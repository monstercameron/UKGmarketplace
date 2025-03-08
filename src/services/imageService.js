/**
 * @fileoverview Image service handling all image-related operations including
 * uploading, processing, storage, and retrieval.
 * @module services/imageService
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync } from '../database/connection.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the image storage directory
const IMAGES_DIR = path.join(__dirname, '../../public/images');
const MAX_HEIGHT = 500; // Maximum height for resized images
const MAX_WIDTH = 800;  // Maximum width for resized images

// Ensure the images directory exists
(async () => {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    console.log(`Ensured images directory exists: ${IMAGES_DIR}`);
  } catch (err) {
    console.error('Error creating images directory:', err);
  }
})();

/**
 * Generates a hashed filename for an uploaded image
 * @param {string} originalFilename - Original filename
 * @returns {string} Hashed filename
 */
const generateHashFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const hash = crypto.createHash('md5').update(`${originalFilename}${timestamp}${randomString}`).digest('hex');
  const ext = path.extname(originalFilename);
  return `${hash}${ext}`;
};

/**
 * Processes and saves an uploaded image
 * @async
 * @param {Object} file - Uploaded file object
 * @returns {Promise<Result<Object>>} Result with processed image info or error
 */
export const processImage = async (file) => {
  try {
    const { originalname, buffer, mimetype, size } = file;
    const hashFilename = generateHashFilename(originalname);
    const imagePath = path.join(IMAGES_DIR, hashFilename);
    
    // Process the image with sharp
    let imageInfo;
    try {
      // Resize the image while maintaining aspect ratio
      const processedImage = await sharp(buffer)
        .resize({
          width: MAX_WIDTH,
          height: MAX_HEIGHT,
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .toBuffer({ resolveWithObject: true });
      
      // Save the processed image
      await fs.writeFile(imagePath, processedImage.data);
      
      // Get image dimensions
      imageInfo = {
        width: processedImage.info.width,
        height: processedImage.info.height,
        format: processedImage.info.format,
        size: processedImage.info.size
      };
    } catch (err) {
      console.error('Error processing image with sharp:', err);
      // Fallback: save the original image if sharp processing fails
      await fs.writeFile(imagePath, buffer);
      imageInfo = { size };
    }
    
    return Result({
      filename: originalname,
      hashFilename,
      url: `/images/${hashFilename}`,
      mimetype,
      size: imageInfo.size || size,
      width: imageInfo.width,
      height: imageInfo.height
    });
  } catch (err) {
    console.error('Error processing image:', err);
    return Result(null, err);
  }
};

/**
 * Saves image metadata to the database
 * @async
 * @param {number} itemId - Item ID
 * @param {Object} imageData - Image metadata
 * @param {boolean} isPrimary - Whether this is the primary image
 * @param {number} displayOrder - Display order for the image
 * @returns {Promise<Result<number>>} Result with image ID or error
 */
export const saveImageMetadata = async (itemId, imageData, isPrimary = false, displayOrder = 0) => {
  try {
    const { filename, hashFilename, url, mimetype, size, width, height } = imageData;
    
    const [result, error] = await handle(runAsync(
      `INSERT INTO item_images (
        item_id, url, filename, hash_filename, mime_type, file_size, 
        width, height, is_primary, display_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        itemId, url, filename, hashFilename, mimetype, size,
        width, height, isPrimary ? 1 : 0, displayOrder
      ]
    ));
    
    if (error) {
      console.error('Error saving image metadata:', error);
      return Result(null, error);
    }
    
    return Result(result.insertId);
  } catch (err) {
    console.error('Error in saveImageMetadata:', err);
    return Result(null, err);
  }
};

/**
 * Gets all images for an item
 * @async
 * @param {number} itemId - Item ID
 * @returns {Promise<Result<Array<Object>>>} Result with array of images or error
 */
export const getItemImages = async (itemId) => {
  try {
    const [images, error] = await handle(allAsync(
      `SELECT * FROM item_images WHERE item_id = ? ORDER BY display_order ASC, is_primary DESC, created_at ASC`,
      [itemId]
    ));
    
    if (error) {
      console.error('Error getting item images:', error);
      return Result(null, error);
    }
    
    return Result(images);
  } catch (err) {
    console.error('Error in getItemImages:', err);
    return Result(null, err);
  }
};

/**
 * Gets a single image by ID
 * @async
 * @param {number} imageId - Image ID
 * @returns {Promise<Result<Object>>} Result with image data or error
 */
export const getImageById = async (imageId) => {
  try {
    const [image, error] = await handle(getAsync(
      `SELECT * FROM item_images WHERE id = ?`,
      [imageId]
    ));
    
    if (error) {
      console.error('Error getting image by ID:', error);
      return Result(null, error);
    }
    
    if (!image) {
      return Result(null, new Error('Image not found'));
    }
    
    return Result(image);
  } catch (err) {
    console.error('Error in getImageById:', err);
    return Result(null, err);
  }
};

/**
 * Updates image metadata
 * @async
 * @param {number} imageId - Image ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Result<boolean>>} Result with success status or error
 */
export const updateImageMetadata = async (imageId, updateData) => {
  try {
    const { isPrimary, displayOrder } = updateData;
    
    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let params = [];
    
    if (isPrimary !== undefined) {
      updateFields.push('is_primary = ?');
      params.push(isPrimary ? 1 : 0);
    }
    
    if (displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      params.push(displayOrder);
    }
    
    if (updateFields.length === 0) {
      return Result(true); // Nothing to update
    }
    
    // Add the image ID to params
    params.push(imageId);
    
    const [result, error] = await handle(runAsync(
      `UPDATE item_images SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    ));
    
    if (error) {
      console.error('Error updating image metadata:', error);
      return Result(null, error);
    }
    
    return Result(true);
  } catch (err) {
    console.error('Error in updateImageMetadata:', err);
    return Result(null, err);
  }
};

/**
 * Sets an image as the primary image for an item
 * @async
 * @param {number} itemId - Item ID
 * @param {number} imageId - Image ID to set as primary
 * @returns {Promise<Result<boolean>>} Result with success status or error
 */
export const setPrimaryImage = async (itemId, imageId) => {
  try {
    // First, unset primary flag for all images of this item
    const [unsetResult, unsetError] = await handle(runAsync(
      `UPDATE item_images SET is_primary = 0 WHERE item_id = ?`,
      [itemId]
    ));
    
    if (unsetError) {
      console.error('Error unsetting primary images:', unsetError);
      return Result(null, unsetError);
    }
    
    // Then, set the specified image as primary
    const [setResult, setError] = await handle(runAsync(
      `UPDATE item_images SET is_primary = 1 WHERE id = ? AND item_id = ?`,
      [imageId, itemId]
    ));
    
    if (setError) {
      console.error('Error setting primary image:', setError);
      return Result(null, setError);
    }
    
    return Result(true);
  } catch (err) {
    console.error('Error in setPrimaryImage:', err);
    return Result(null, err);
  }
};

/**
 * Updates the display order of multiple images
 * @async
 * @param {Array<Object>} orderUpdates - Array of {id, order} objects
 * @returns {Promise<Result<boolean>>} Result with success status or error
 */
export const updateImagesOrder = async (orderUpdates) => {
  try {
    // Use a transaction to ensure all updates are applied atomically
    const connection = await getAsync('BEGIN TRANSACTION');
    
    try {
      for (const { id, order } of orderUpdates) {
        await runAsync(
          `UPDATE item_images SET display_order = ? WHERE id = ?`,
          [order, id]
        );
      }
      
      await runAsync('COMMIT');
      return Result(true);
    } catch (err) {
      await runAsync('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error in updateImagesOrder:', err);
    return Result(null, err);
  }
};

/**
 * Deletes an image
 * @async
 * @param {number} imageId - Image ID
 * @returns {Promise<Result<boolean>>} Result with success status or error
 */
export const deleteImage = async (imageId) => {
  try {
    // First, get the image data to know which file to delete
    const [image, getError] = await handle(getAsync(
      `SELECT * FROM item_images WHERE id = ?`,
      [imageId]
    ));
    
    if (getError) {
      console.error('Error getting image data for deletion:', getError);
      return Result(null, getError);
    }
    
    if (!image) {
      return Result(null, new Error('Image not found'));
    }
    
    // Delete the image file from disk
    try {
      const imagePath = path.join(IMAGES_DIR, image.hash_filename);
      await fs.unlink(imagePath);
    } catch (fileErr) {
      console.error('Error deleting image file:', fileErr);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete the image record from the database
    const [deleteResult, deleteError] = await handle(runAsync(
      `DELETE FROM item_images WHERE id = ?`,
      [imageId]
    ));
    
    if (deleteError) {
      console.error('Error deleting image record:', deleteError);
      return Result(null, deleteError);
    }
    
    return Result(true);
  } catch (err) {
    console.error('Error in deleteImage:', err);
    return Result(null, err);
  }
};

/**
 * Counts the number of images for an item
 * @async
 * @param {number} itemId - Item ID
 * @returns {Promise<Result<number>>} Result with image count or error
 */
export const countItemImages = async (itemId) => {
  try {
    const [result, error] = await handle(getAsync(
      `SELECT COUNT(*) as count FROM item_images WHERE item_id = ?`,
      [itemId]
    ));
    
    if (error) {
      console.error('Error counting item images:', error);
      return Result(null, error);
    }
    
    return Result(result.count);
  } catch (err) {
    console.error('Error in countItemImages:', err);
    return Result(null, err);
  }
}; 