/**
 * @fileoverview Item management routes for marketplace listings.
 * @module api/routes/v1/items
 */

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Marketplace item management
 */

import express from 'express';
import { Result, validate, validateAsync, httpError } from '../../../utils/result.js';
import * as itemService from '../../../services/itemService.js';

/**
 * Express router for item operations.
 * Handles CRUD operations for marketplace items, including:
 * - Item creation and deletion
 * - Item updates and searches
 * - Image management
 * - Item reporting
 * - Category-based filtering
 * 
 * @type {express.Router}
 */
const router = express.Router();

/**
 * @swagger
 * /api/v1/items:
 *   get:
 *     summary: Get all items with pagination
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || 'created_at';
        const order = req.query.order || 'DESC';
        
        // Get total count for pagination
        let totalCount = 0;
        try {
            const [countResult, countError] = await validateAsync(
                itemService.countItems(),
                httpError(400, 'Failed to count items')
            );
            
            if (!countError && countResult) {
                totalCount = countResult.count;
            }
        } catch (countErr) {
            console.error('Error counting items:', countErr);
            // Continue with the request even if count fails
        }
        
        // Get paginated items
        const [result, error] = await validateAsync(
            itemService.findAllItems({ page, limit, sort, order }),
            httpError(400, 'Failed to retrieve items')
        );

        if (error) {
            return res.status(error.status).json(error);
        }
        
        // Set total count in header for client-side pagination
        res.setHeader('X-Total-Count', totalCount);
        res.json(result);
    } catch (err) {
        console.error('Error in GET /items:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/search:
 *   get:
 *     summary: Search for items
 *     tags: [Items]
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
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *     responses:
 *       200:
 *         description: List of items matching the search query
 *       500:
 *         description: Server error
 */
router.get('/search', async (req, res) => {
  try {
    // Get search parameters
    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const categoryId = req.query.category ? parseInt(req.query.category) : null;
    
    // Get all items (we'll filter them in memory)
    const [items, error] = await itemService.getAllItems();
    
    if (error) {
      console.error('Error getting items:', error);
      return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch items' });
    }
    
    if (!items || !Array.isArray(items)) {
      console.error('Invalid items result:', items);
      return res.status(500).json({ error: 'Invalid items data returned from service' });
    }
    
    // Apply category filter if specified
    let filteredItems = items;
    if (categoryId) {
      filteredItems = items.filter(item => item.category_id === categoryId);
    }
    
    // If no query, just return paginated results
    if (!query || query.trim() === '') {
      const totalItems = filteredItems.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      
      res.setHeader('X-Total-Count', totalItems);
      return res.json(paginatedItems);
    }
    
    // Simple search implementation - filter items that contain the query in title or description
    const searchResults = filteredItems.filter(item => {
      const title = (item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const category = (item.category_name || '').toLowerCase();
      const searchQuery = query.toLowerCase();
      
      return title.includes(searchQuery) || 
             description.includes(searchQuery) || 
             category.includes(searchQuery);
    });
    
    // Paginate results
    const totalItems = searchResults.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = searchResults.slice(startIndex, endIndex);
    
    res.setHeader('X-Total-Count', totalItems);
    return res.json(paginatedItems);
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/items/category/{categoryId}:
 *   get:
 *     summary: Get items by category
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 10)
 *     responses:
 *       200:
 *         description: Items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // Get total count for pagination
        let totalCount = 0;
        try {
            const [countResult, countError] = await validateAsync(
                itemService.countItemsByCategory(categoryId),
                httpError(400, 'Failed to count items')
            );
            
            if (!countError && countResult) {
                totalCount = countResult.count;
            }
        } catch (countErr) {
            console.error('Error counting items by category:', countErr);
            // Continue with the request even if count fails
        }
        
        // Get paginated items
        const [result, error] = await validateAsync(
            itemService.findItemsByCategory(categoryId, { page, limit }),
            httpError(400, 'Failed to get items by category')
        );
        
        if (error) {
            return res.status(error.status).json(error);
        }
        
        // Set total count in header for client-side pagination
        res.setHeader('X-Total-Count', totalCount);
        res.json(result);
    } catch (err) {
        console.error('Error in GET /items/category/:categoryId:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.get('/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const [result, error] = await itemService.findItemById(itemId);
        
        if (error) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (!result || (Array.isArray(result) && result.length === 0)) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(Array.isArray(result) ? result[0] : result);
    } catch (err) {
        console.error('Error in GET /items/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - condition
 *               - location
 *               - categoryId
 *               - email
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: Category ID
 *               title:
 *                 type: string
 *                 description: Item title
 *               description:
 *                 type: string
 *                 description: Item description
 *               price:
 *                 type: number
 *                 description: Item price
 *               condition:
 *                 type: string
 *                 enum: [new, like_new, good, fair, poor]
 *                 description: Item condition
 *               location:
 *                 type: string
 *                 description: Item location
 *               shipping:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Shipping options
 *               negotiable:
 *                 type: boolean
 *                 description: Whether price is negotiable
 *               email:
 *                 type: string
 *                 description: Contact email
 *               phone:
 *                 type: string
 *                 description: Contact phone
 *               teamsLink:
 *                 type: string
 *                 description: Microsoft Teams link
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Accepted payment methods
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.post('/', async (req, res) => {
    try {
        // Extract item details from request
        const { 
            categoryId, 
            title, 
            description, 
            price, 
            condition, 
            location, 
            shipping,
            negotiable,
            email,
            phone,
            teamsLink,
            paymentMethods 
        } = req.body;

        // Basic validation
        if (!title || !description || !price || !condition || !location || !categoryId || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result, error] = await itemService.createItem(categoryId, { 
            title, 
            description, 
            price, 
            condition, 
            location, 
            shipping,
            negotiable,
            email,
            phone,
            teamsLink,
            paymentMethods 
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(201).json(result);
    } catch (err) {
        console.error('Error in POST /items:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}:
 *   put:
 *     summary: Update an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managementKey
 *             properties:
 *               managementKey:
 *                 type: string
 *                 description: Secure key for authorization
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               condition:
 *                 type: string
 *                 enum: [new, like_new, good, fair, poor]
 *               location:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               shipping:
 *                 type: array
 *                 items:
 *                   type: string
 *               negotiable:
 *                 type: boolean
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               teamsLink:
 *                 type: string
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.put('/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { 
            managementKey, 
            title, 
            description, 
            price, 
            condition, 
            location, 
            categoryId, 
            shipping,
            negotiable,
            email,
            phone,
            teamsLink,
            paymentMethods 
        } = req.body;

        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }

        const [result, error] = await validateAsync(
            itemService.updateItem(itemId, managementKey, { 
                title, 
                description, 
                price, 
                condition, 
                location, 
                categoryId, 
                shipping,
                negotiable,
                email,
                phone,
                teamsLink,
                paymentMethods 
            }),
            httpError(400, 'Failed to update item')
        );

        if (error) {
            if (error.message === 'Invalid management key') {
                return res.status(403).json({ error: 'Invalid management key' });
            }
            return res.status(error.status).json(error);
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error in PUT /items/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managementKey
 *             properties:
 *               managementKey:
 *                 type: string
 *                 description: Secure key for authorization
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.delete('/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        // Check for management key in query parameters first, then in body
        const managementKey = req.query.management_key || (req.body ? req.body.managementKey : null);

        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }

        const [result, error] = await validateAsync(
            itemService.deleteItem(itemId, managementKey),
            httpError(400, 'Failed to delete item')
        );

        if (error) {
            if (error.message === 'Invalid management key') {
                return res.status(403).json({ error: 'Invalid management key' });
            }
            return res.status(error.status).json(error);
        }

        // Check if any rows were affected
        if (result && result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found or already deleted' });
        }

        res.status(204).send();
    } catch (err) {
        console.error('Error in DELETE /items/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}/images:
 *   post:
 *     summary: Add image to item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *               - managementKey
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image
 *               managementKey:
 *                 type: string
 *                 description: Secure key for authorization
 *               isPrimary:
 *                 type: boolean
 *                 description: Whether this is the primary image
 *     responses:
 *       201:
 *         description: Image added successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 */
router.post('/:id/images', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { imageUrl, isPrimary, managementKey } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }

        const [result, error] = await validateAsync(
            itemService.addItemImage(itemId, managementKey, imageUrl, isPrimary),
            httpError(400, 'Failed to add image')
        );

        if (error) {
            if (error.message === 'Invalid management key') {
                return res.status(403).json({ error: 'Invalid management key' });
            }
            return res.status(error.status).json(error);
        }
        
        res.status(201).json(result);
    } catch (err) {
        console.error('Error in POST /items/:id/images:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}/images/{imageId}:
 *   delete:
 *     summary: Remove image from item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managementKey
 *             properties:
 *               managementKey:
 *                 type: string
 *                 description: Secure key for authorization
 *     responses:
 *       204:
 *         description: Image removed successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 */
router.delete('/:id/images/:imageId', async (req, res) => {
    try {
        const { id: itemId, imageId } = req.params;
        const { managementKey } = req.body;

        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }

        const [result, error] = await validateAsync(
            itemService.removeItemImage(itemId, imageId, managementKey),
            httpError(400, 'Failed to remove image')
        );

        if (error) {
            if (error.message === 'Invalid management key') {
                return res.status(403).json({ error: 'Invalid management key' });
            }
            return res.status(error.status).json(error);
        }
        
        res.status(204).send();
    } catch (err) {
        console.error('Error in DELETE /items/:id/images/:imageId:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}/report:
 *   post:
 *     summary: Report an item for review
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - reason
 *             properties:
 *               email:
 *                 type: string
 *                 description: Reporter's email
 *               reason:
 *                 type: string
 *                 description: Reason for report
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.post('/:id/report', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { email, reason, description } = req.body;

        if (!email || !reason) {
            return res.status(400).json({ error: 'Email and reason are required' });
        }

        const [result, error] = await validateAsync(
            itemService.reportItem(email, itemId, reason, description || ''),
            httpError(400, 'Failed to report item')
        );

        if (error) return res.status(error.status).json(error);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error in POST /items/:id/report:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}/validate:
 *   post:
 *     summary: Validate a management key for an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - managementKey
 *             properties:
 *               managementKey:
 *                 type: string
 *                 description: Management key to validate
 *     responses:
 *       200:
 *         description: Management key is valid
 *       403:
 *         description: Invalid management key
 */
router.post('/:id/validate', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { managementKey } = req.body;

        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }

        console.log(`Validating management key for item ${itemId}`);

        // Check if the item exists with this management key
        const [item, error] = await validateAsync(
            itemService.validateManagementKey(itemId, managementKey),
            httpError(400, 'Failed to validate management key')
        );

        if (error) {
            if (error.message === 'Invalid management key') {
                return res.status(403).json({ error: 'Invalid management key' });
            }
            return res.status(error.status).json(error);
        }

        res.json({ valid: true, message: 'Management key is valid' });
    } catch (err) {
        console.error('Error in POST /items/:id/validate:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/v1/items/{id}:
 *   patch:
 *     summary: Update item sold status
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sold:
 *                 type: boolean
 *                 description: Whether the item is sold
 *               X-Management-Key:
 *                 type: string
 *                 description: Management key for authorization
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Unauthorized
 */
router.patch('/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { sold } = req.body;
        
        // Check for management key in query parameters first, then in headers
        const managementKey = req.query.management_key || req.headers['x-management-key'];
        
        if (!managementKey) {
            return res.status(400).json({ error: 'Management key is required' });
        }
        
        // Special case for admin master key
        const isAdminMasterKey = managementKey === 'admin-master-key';
        
        if (!isAdminMasterKey) {
            // Verify the management key is valid for this item
            const [validKey, keyError] = await validateAsync(
                itemService.validateManagementKey(itemId, managementKey),
                httpError(403, 'Invalid management key')
            );
            
            if (keyError || !validKey) {
                return res.status(403).json({ error: 'Invalid management key' });
            }
        }
        
        if (sold === undefined) {
            return res.status(400).json({ error: 'Sold status is required' });
        }
        
        const [result, error] = await validateAsync(
            itemService.updateItemSoldStatus(itemId, sold, managementKey),
            httpError(400, 'Failed to update item')
        );
        
        if (error) {
            return res.status(error.status).json(error);
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error in PATCH /items/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 