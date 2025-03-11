/**
 * @fileoverview Category management routes for marketplace organization.
 * @module api/routes/v1/categories
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

import express from 'express';
import { Result, validate, validateAsync, httpError } from '../../../utils/result.js';
import * as categoryService from '../../../services/categoryService.js';

// Simple in-memory cache for categories
let categoriesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Express router for category operations.
 * Handles the hierarchical category structure, including:
 * - Category creation and deletion
 * - Category tree management
 * - Subcategory relationships
 * - Slug-based lookups
 * 
 * @type {express.Router}
 */
const router = express.Router();

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               parentId:
 *                 type: integer
 *                 description: Parent category ID
 *               description:
 *                 type: string
 *                 description: Category description
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.post('/', async (req, res) => {
    // Extract category details
    const { name, parentId, description } = req.body;
    
    const [result, error] = await validateAsync(
        categoryService.createCategory(name, parentId, description),
        httpError(400, 'Failed to create category')
    );
    
    if (error) return res.status(error.status).json(error);
    
    // Invalidate cache when a new category is created
    invalidateCache();
    
    res.status(201).json(result);
});

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/', async (req, res) => {
    // Check if we have a valid cache
    if (categoriesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return res.status(200).json(categoriesCache);
    }

    const [result, error] = await validateAsync(
        categoryService.findAllCategories(),
        httpError(400, 'Failed to fetch categories')
    );

    if (error) return res.status(error.status).json(error);
    
    // Update cache
    categoriesCache = result;
    cacheTimestamp = Date.now();
    
    res.status(200).json(result);
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.get('/:id', async (req, res) => {
    const categoryId = req.params.id;
    
    const [result, error] = await validateAsync(
        categoryService.findCategoryById(categoryId),
        httpError(404, 'Category not found')
    );
    
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/**
 * @swagger
 * /api/v1/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.get('/slug/:slug', async (req, res) => {
    const slug = req.params.slug;
    
    const [result, error] = await validateAsync(
        categoryService.findCategoryBySlug(slug),
        httpError(404, 'Category not found')
    );
    
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/**
 * @swagger
 * /api/v1/categories/{id}/subcategories:
 *   get:
 *     summary: Get subcategories of a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent category ID
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/:id/subcategories', async (req, res) => {
    const parentId = req.params.id;
    
    const [result, error] = await validateAsync(
        categoryService.findSubCategories(parentId),
        httpError(400, 'Failed to fetch subcategories')
    );
    
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/**
 * @swagger
 * /api/v1/categories/tree:
 *   get:
 *     summary: Get complete category tree
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Category'
 *                   - type: object
 *                     properties:
 *                       children:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/tree', async (req, res) => {
    const [result, error] = await validateAsync(
        categoryService.getCategoryTree(),
        httpError(400, 'Failed to fetch category tree')
    );
    
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.put('/:id', async (req, res) => {
    // Extract update data
    const categoryId = req.params.id;
    const { name, parentId, description } = req.body;
    
    const [result, error] = await validateAsync(
        categoryService.updateCategory(categoryId, { name, parentId, description }),
        httpError(400, 'Failed to update category')
    );
    
    if (error) return res.status(error.status).json(error);
    
    // Invalidate cache when a category is updated
    invalidateCache();
    
    res.json(result);
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.delete('/:id', async (req, res) => {
    const categoryId = req.params.id;
    
    const [result, error] = await validateAsync(
        categoryService.deleteCategory(categoryId),
        httpError(400, 'Failed to delete category')
    );
    
    if (error) return res.status(error.status).json(error);
    
    // Invalidate cache when a category is deleted
    invalidateCache();
    
    res.status(204).send();
});

/**
 * @swagger
 * /api/v1/categories/diagnose:
 *   get:
 *     summary: Diagnose category issues
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Diagnosis results
 *       500:
 *         description: Server error
 */
router.get('/diagnose', async (req, res) => {
    try {
        const itemService = require('../../../services/itemService.js');
        const [result, error] = await itemService.diagnoseCategoryIssues();
        
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error in GET /categories/diagnose:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Invalidate cache when categories are modified
const invalidateCache = () => {
    categoriesCache = null;
    cacheTimestamp = null;
};

export default router; 