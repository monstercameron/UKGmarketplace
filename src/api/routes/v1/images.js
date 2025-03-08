/**
 * @fileoverview Image management routes for marketplace listings.
 * @module api/routes/v1/images
 */

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image management endpoints
 */

import express from 'express';
import multer from 'multer';
import { Result, validate, validateAsync, httpError } from '../../../utils/result.js';
import * as imageService from '../../../services/imageService.js';
import * as itemService from '../../../services/itemService.js';

// Configure multer for memory storage (we'll process and save files manually)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 8 // Maximum 8 files per upload
  }
});

const router = express.Router();

/**
 * @swagger
 * /api/v1/images/{itemId}:
 *   get:
 *     summary: Get all images for an item
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.get('/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    // Verify the item exists
    const [item, itemError] = await validateAsync(
      itemService.findItemById(itemId),
      httpError(404, 'Item not found')
    );
    
    if (itemError) return res.status(itemError.status).json(itemError);
    
    // Get all images for the item
    const [images, error] = await validateAsync(
      imageService.getItemImages(itemId),
      httpError(400, 'Failed to retrieve images')
    );
    
    if (error) return res.status(error.status).json(error);
    
    res.json(images);
  } catch (err) {
    console.error('Error in GET /images/:itemId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/images/{itemId}:
 *   post:
 *     summary: Upload images for an item
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - managementKey
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               managementKey:
 *                 type: string
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.post('/:itemId', upload.array('images', 8), async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const managementKey = req.body.managementKey || req.query.management_key;
    
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
    
    // Check if the item exists
    const [item, itemError] = await validateAsync(
      itemService.findItemById(itemId),
      httpError(404, 'Item not found')
    );
    
    if (itemError) return res.status(itemError.status).json(itemError);
    
    // Count existing images
    const [imageCount, countError] = await validateAsync(
      imageService.countItemImages(itemId),
      httpError(400, 'Failed to count existing images')
    );
    
    if (countError) return res.status(countError.status).json(countError);
    
    // Check if adding these images would exceed the limit
    if (imageCount + req.files.length > 8) {
      return res.status(400).json({ 
        error: 'Maximum 8 images allowed per item',
        current: imageCount,
        attempting_to_add: req.files.length,
        max_allowed: 8
      });
    }
    
    // Process each uploaded image
    const uploadedImages = [];
    let displayOrder = imageCount; // Start order after existing images
    
    for (const file of req.files) {
      // Process and save the image
      const [processedImage, processError] = await validateAsync(
        imageService.processImage(file),
        httpError(400, `Failed to process image: ${file.originalname}`)
      );
      
      if (processError) return res.status(processError.status).json(processError);
      
      // Determine if this should be the primary image
      const isPrimary = imageCount === 0 && uploadedImages.length === 0;
      
      // Save image metadata to database
      const [imageId, saveError] = await validateAsync(
        imageService.saveImageMetadata(itemId, processedImage, isPrimary, displayOrder),
        httpError(400, `Failed to save image metadata: ${file.originalname}`)
      );
      
      if (saveError) return res.status(saveError.status).json(saveError);
      
      uploadedImages.push({
        id: imageId,
        ...processedImage,
        is_primary: isPrimary,
        display_order: displayOrder
      });
      
      displayOrder++;
    }
    
    res.status(201).json(uploadedImages);
  } catch (err) {
    console.error('Error in POST /images/:itemId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/images/{itemId}/{imageId}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *     responses:
 *       204:
 *         description: Image deleted successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.delete('/:itemId/:imageId', async (req, res) => {
  try {
    const { itemId, imageId } = req.params;
    const managementKey = req.body.managementKey || req.query.management_key;
    
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
    
    // Verify the image exists and belongs to the item
    const [image, imageError] = await validateAsync(
      imageService.getImageById(imageId),
      httpError(404, 'Image not found')
    );
    
    if (imageError) return res.status(imageError.status).json(imageError);
    
    if (image.item_id !== parseInt(itemId)) {
      return res.status(403).json({ error: 'Image does not belong to this item' });
    }
    
    // Delete the image
    const [deleteResult, deleteError] = await validateAsync(
      imageService.deleteImage(imageId),
      httpError(400, 'Failed to delete image')
    );
    
    if (deleteError) return res.status(deleteError.status).json(deleteError);
    
    res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /images/:itemId/:imageId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/images/{itemId}/primary/{imageId}:
 *   put:
 *     summary: Set an image as the primary image for an item
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *     responses:
 *       200:
 *         description: Primary image set successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.put('/:itemId/primary/:imageId', async (req, res) => {
  try {
    const { itemId, imageId } = req.params;
    const managementKey = req.body.managementKey || req.query.management_key;
    
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
    
    // Verify the image exists and belongs to the item
    const [image, imageError] = await validateAsync(
      imageService.getImageById(imageId),
      httpError(404, 'Image not found')
    );
    
    if (imageError) return res.status(imageError.status).json(imageError);
    
    if (image.item_id !== parseInt(itemId)) {
      return res.status(403).json({ error: 'Image does not belong to this item' });
    }
    
    // Set as primary image
    const [setPrimaryResult, setPrimaryError] = await validateAsync(
      imageService.setPrimaryImage(itemId, imageId),
      httpError(400, 'Failed to set primary image')
    );
    
    if (setPrimaryError) return res.status(setPrimaryError.status).json(setPrimaryError);
    
    res.json({ success: true, message: 'Primary image set successfully' });
  } catch (err) {
    console.error('Error in PUT /images/:itemId/primary/:imageId:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/images/{itemId}/order:
 *   put:
 *     summary: Update the display order of images
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *               - orderUpdates
 *             properties:
 *               managementKey:
 *                 type: string
 *               orderUpdates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: integer
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Image order updated successfully
 *       400:
 *         $ref: '#/components/responses/Error400'
 *       403:
 *         description: Invalid management key
 *       404:
 *         $ref: '#/components/responses/Error404'
 */
router.put('/:itemId/order', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { managementKey, orderUpdates } = req.body;
    
    if (!managementKey) {
      return res.status(400).json({ error: 'Management key is required' });
    }
    
    if (!orderUpdates || !Array.isArray(orderUpdates) || orderUpdates.length === 0) {
      return res.status(400).json({ error: 'Order updates are required' });
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
    
    // Get all images for the item to verify the updates
    const [images, imagesError] = await validateAsync(
      imageService.getItemImages(itemId),
      httpError(400, 'Failed to retrieve images')
    );
    
    if (imagesError) return res.status(imagesError.status).json(imagesError);
    
    // Create a map of image IDs for quick lookup
    const imageMap = new Map(images.map(img => [img.id, img]));
    
    // Verify all image IDs in the updates belong to this item
    for (const update of orderUpdates) {
      if (!imageMap.has(update.id)) {
        return res.status(400).json({ 
          error: 'Invalid image ID in order updates',
          invalid_id: update.id
        });
      }
    }
    
    // Update the display order
    const [updateResult, updateError] = await validateAsync(
      imageService.updateImagesOrder(orderUpdates),
      httpError(400, 'Failed to update image order')
    );
    
    if (updateError) return res.status(updateError.status).json(updateError);
    
    res.json({ success: true, message: 'Image order updated successfully' });
  } catch (err) {
    console.error('Error in PUT /images/:itemId/order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 