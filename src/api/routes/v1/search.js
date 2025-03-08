/**
 * @fileoverview Search API routes for the marketplace.
 * @module api/routes/v1/search
 */

import express from 'express';
import { Result, validate, httpError } from '../../../utils/result.js';
import * as itemService from '../../../services/itemService.js';

const router = express.Router();

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - The Levenshtein distance
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) where 1 is exact match
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Convert to lowercase for case-insensitive comparison
  const s1 = String(str1).toLowerCase();
  const s2 = String(str2).toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Check if one string contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  // Convert distance to similarity score
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search for items
 *     description: Search for items using fuzzy matching across all fields
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Category ID to filter by
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 0.6
 *         description: Minimum similarity threshold (0-1)
 *     responses:
 *       200:
 *         description: List of items matching the search query
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.category ? parseInt(req.query.category) : null;
    const threshold = parseFloat(req.query.threshold) || 0.6;
    
    console.log('Search API called with query:', query, 'page:', page, 'limit:', limit, 'categoryId:', categoryId);
    
    // Get all items (we'll filter them in memory)
    const result = await itemService.getAllItems();
    
    if (!result.success) {
      console.error('Error getting items:', result.error);
      return res.status(result.error.statusCode || 500).json({ error: result.error.message });
    }
    
    console.log('Items retrieved successfully, count:', result.data ? result.data.length : 0);
    
    let items = result.data;
    
    // Apply category filter if specified
    if (categoryId) {
      items = items.filter(item => item.category_id === categoryId);
      console.log('After category filter, items count:', items.length);
    }
    
    // If no query, just return paginated results
    if (!query || query.trim() === '') {
      const totalItems = items.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = items.slice(startIndex, endIndex);
      
      res.setHeader('X-Total-Count', totalItems);
      return res.json(paginatedItems);
    }
    
    // Tokenize the query into words
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    // Process each item
    const results = items.map(item => {
      // Prepare text fields for matching
      const title = item.title || '';
      const description = item.description || '';
      const category = item.category_name || '';
      const location = item.location || '';
      const condition = item.condition || '';
      
      // Calculate best match score across all query words
      let bestScore = 0;
      
      for (const word of queryWords) {
        // Check each field with appropriate weights
        const titleScore = calculateSimilarity(title, word) * 1.5;
        const descScore = calculateSimilarity(description, word);
        const catScore = calculateSimilarity(category, word) * 1.2;
        const locScore = calculateSimilarity(location, word) * 0.8;
        const condScore = calculateSimilarity(condition, word) * 0.8;
        
        // Use the best score from any field
        const wordBestScore = Math.max(titleScore, descScore, catScore, locScore, condScore);
        
        // Accumulate scores, but don't exceed 1.0
        bestScore = Math.min(1.0, bestScore + wordBestScore);
      }
      
      // Normalize by number of words to prevent bias toward longer queries
      bestScore = bestScore / Math.max(1, queryWords.length);
      
      return {
        item,
        score: bestScore
      };
    });
    
    // Filter by threshold and sort by score
    const filteredResults = results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score);
    
    // Paginate results
    const totalItems = filteredResults.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = filteredResults.slice(startIndex, endIndex);
    
    // Return only the items, not the scores
    const paginatedItems = paginatedResults.map(result => result.item);
    
    res.setHeader('X-Total-Count', totalItems);
    return res.json(paginatedItems);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 