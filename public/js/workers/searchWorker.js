/**
 * Web Worker for search operations
 * Handles fuzzy matching using Levenshtein distance
 */

// Levenshtein distance calculation
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

// Calculate similarity score (0-1) where 1 is exact match
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Convert to lowercase for case-insensitive comparison
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
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

// Search function that uses Levenshtein distance for fuzzy matching
function performSearch(items, query, threshold = 0.6) {
  if (!query || query.trim() === '') {
    return { results: items, totalResults: items.length };
  }
  
  // Tokenize the query into words
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  // Process each item
  const results = items.map(item => {
    // Prepare text fields for matching
    const title = item.title || '';
    const description = item.description || '';
    const category = item.category_name || '';
    
    // Calculate best match score across all query words
    let bestScore = 0;
    
    for (const word of queryWords) {
      // Check title (higher weight)
      const titleScore = calculateSimilarity(title.toLowerCase(), word) * 1.5;
      
      // Check description
      const descScore = calculateSimilarity(description.toLowerCase(), word);
      
      // Check category
      const catScore = calculateSimilarity(category.toLowerCase(), word) * 1.2;
      
      // Use the best score from any field
      const wordBestScore = Math.max(titleScore, descScore, catScore);
      
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
  
  // Return only the items, not the scores
  return {
    results: filteredResults.map(result => result.item),
    totalResults: filteredResults.length
  };
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { items, query, threshold } = event.data;
  
  // Perform the search
  const searchResults = performSearch(items, query, threshold);
  
  // Send results back to main thread
  self.postMessage(searchResults);
}); 