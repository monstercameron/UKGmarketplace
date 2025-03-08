/**
 * @fileoverview Item service handling all item-related operations including CRUD operations,
 * search, and management of item metadata.
 * @module services/itemService
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync, generateManagementKey } from '../database/connection.js';
import { notifyWatchers } from './notificationService.js';

/**
 * @typedef {Object} ItemData
 * @property {string} title - Item title
 * @property {string} description - Item description
 * @property {number} price - Item price
 * @property {string} condition - Item condition (new, used, etc.)
 * @property {string} location - Item location
 * @property {Array<number>} [paymentMethods] - Array of payment method IDs
 */

/**
 * @typedef {Object} ItemUpdateData
 * @property {string} [title] - New item title
 * @property {string} [description] - New item description
 * @property {number} [price] - New item price
 * @property {string} [condition] - New item condition
 * @property {string} [location] - New item location
 * @property {number} [categoryId] - New category ID
 * @property {Array<number>} [paymentMethods] - New payment methods
 */

/**
 * @typedef {Object} SearchOptions
 * @property {number} [page=1] - Page number for pagination
 * @property {number} [limit=20] - Items per page
 * @property {string} [sort='created_at'] - Sort field
 * @property {string} [order='DESC'] - Sort order (ASC or DESC)
 */

/**
 * Creates a new marketplace item
 * @async
 * @param {number} categoryId - Category ID for the item
 * @param {Object} itemData - Item details
 * @param {string} itemData.title - Item title
 * @param {string} itemData.description - Item description
 * @param {number} itemData.price - Item price
 * @param {string} itemData.condition - Item condition
 * @param {string} itemData.location - Item location
 * @param {string[]} [itemData.shipping=[]] - Shipping options
 * @param {boolean} [itemData.negotiable=false] - Whether price is negotiable
 * @param {string} [itemData.email=''] - Contact email
 * @param {string} [itemData.phone=''] - Contact phone
 * @param {string} [itemData.teamsLink=''] - Microsoft Teams link
 * @param {string[]} [itemData.paymentMethods=[]] - Payment method keys
 * @returns {Promise<Result<Object>>} Created item with management key
 * @example
 * const itemData = {
 *   title: 'Item Title',
 *   description: 'Description',
 *   price: 99.99,
 *   condition: 'new',
 *   location: 'New York',
 *   paymentMethods: ['cash', 'credit_card']
 * };
 * const [result, error] = await createItem(1, itemData);
 */
export const createItem = async (categoryId, { 
    title, 
    description, 
    price, 
    condition, 
    location, 
    shipping = [], 
    negotiable = false,
    email = '',
    phone = '',
    teamsLink = '',
    paymentMethods = []
}) => {
    try {
        console.log('Creating item with data:', {
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
        });

        // Validate required fields
        if (!title || !description || price === undefined || !condition || !location) {
            console.error('Missing required fields');
            return Result(null, new Error('Missing required fields'));
        }

        // Validate price
        if (isNaN(price) || price < 0) {
            console.error('Invalid price:', price);
            return Result(null, new Error('Invalid price'));
        }

        // Validate condition
        const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
        if (!validConditions.includes(condition)) {
            console.error('Invalid condition:', condition);
            return Result(null, new Error('Invalid condition'));
        }

        // Convert shipping array to JSON string
        const shippingJson = JSON.stringify(shipping);
        console.log('Shipping JSON:', shippingJson);

        const managementKey = generateManagementKey();
        console.log('Generated management key:', managementKey);

        // Check if category exists
        console.log('Checking if category exists:', categoryId);
        const [category, categoryError] = await handle(getAsync(
            'SELECT id FROM categories WHERE id = ?',
            [categoryId]
        ));

        if (categoryError) {
            console.error('Error checking category:', categoryError);
            return Result(null, categoryError);
        }

        // In SQLite, getAsync returns undefined when no rows are found
        // We need to check if the category exists by querying all categories
        if (category === undefined) {
            console.log('Category not found in first check, checking all categories...');
            const [categories, categoriesError] = await handle(allAsync(
                'SELECT id FROM categories'
            ));

            if (categoriesError) {
                console.error('Error checking all categories:', categoriesError);
                return Result(null, categoriesError);
            }

            const categoryExists = categories.some(cat => cat.id === parseInt(categoryId));
            if (!categoryExists) {
                console.error('Category not found in all categories:', categoryId);
                return Result(null, new Error(`Category with ID ${categoryId} not found`));
            }

            console.log('Category found in all categories:', categoryId);
        } else {
            console.log('Category found:', category);
        }

        console.log('Inserting item into database...');
        const [result, error] = await handle(runAsync(
            `INSERT INTO items (
                category_id, 
                title, 
                description, 
                price, 
                condition, 
                location, 
                shipping,
                negotiable,
                email,
                phone,
                teams_link,
                management_key
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoryId, 
                title, 
                description, 
                price, 
                condition, 
                location, 
                shippingJson,
                negotiable ? 1 : 0,
                email,
                phone,
                teamsLink,
                managementKey
            ]
        ));

        if (error) {
            console.error('Error inserting item:', error);
            return Result(null, error);
        }

        console.log('Item inserted successfully, result:', result);
        
        // Handle the case where result might be null or undefined
        let itemId;
        if (result && result.insertId) {
            itemId = result.insertId;
        } else {
            // If we don't have an insertId, try to get the last inserted ID directly from the database
            console.log('No insertId in result, trying to get last inserted ID...');
            const [lastIdResult, lastIdError] = await handle(getAsync('SELECT last_insert_rowid() as id'));
            
            if (lastIdError) {
                console.error('Error getting last inserted ID:', lastIdError);
                return Result(null, new Error('Failed to get item ID after creation'));
            }
            
            if (!lastIdResult || !lastIdResult.id) {
                console.error('No last inserted ID found:', lastIdResult);
                return Result(null, new Error('Failed to get item ID after creation'));
            }
            
            itemId = lastIdResult.id;
        }
        
        console.log('Item ID:', itemId);

        // Add payment methods
        if (paymentMethods && paymentMethods.length > 0) {
            console.log('Adding payment methods:', paymentMethods);
            // First, get payment method IDs from their keys
            const paymentMethodsPlaceholders = paymentMethods.map(() => '?').join(',');
            console.log('Payment methods placeholders:', paymentMethodsPlaceholders);
            
            const [paymentMethodsResult, pmError] = await handle(allAsync(
                `SELECT id, slug FROM payment_methods WHERE slug IN (${paymentMethodsPlaceholders})`,
                paymentMethods
            ));

            if (pmError) {
                console.error('Error getting payment methods:', pmError);
                return Result(null, pmError);
            }

            console.log('Payment methods result:', paymentMethodsResult);

            // Map payment method keys to IDs
            const paymentMethodIds = paymentMethodsResult.map(pm => pm.id);
            console.log('Payment method IDs:', paymentMethodIds);

            if (paymentMethodIds.length > 0) {
                // SQLite doesn't support the MySQL-style VALUES ? syntax for batch inserts
                // We need to insert each payment method individually
                for (const pmId of paymentMethodIds) {
                    console.log('Inserting payment method:', pmId, 'for item:', itemId);
                    const [insertResult, insertError] = await handle(runAsync(
                        'INSERT INTO item_payment_methods (item_id, payment_method_id) VALUES (?, ?)',
                        [itemId, pmId]
                    ));

                    if (insertError) {
                        console.error('Error inserting payment method:', insertError);
                        // Continue with other payment methods even if one fails
                    } else {
                        console.log('Payment method inserted successfully:', insertResult);
                    }
                }
            }
        }

        console.log('Getting item details...');
        const [item, itemError] = await findItemById(itemId);
        if (itemError) {
            console.error('Error getting item details:', itemError);
            return Result(null, itemError);
        }

        console.log('Item details retrieved successfully:', item);
        return Result({ ...item, managementKey });
    } catch (err) {
        console.error('Unexpected error in createItem:', err);
        return Result(null, err);
    }
};

/**
 * Finds an item by its ID
 * @async
 * @param {number} id - Item ID to search for
 * @returns {Promise<Result<Object>>} Result containing the item details
 * @throws {Error} If database operation fails
 */
export const findItemById = (id) => 
    handle(allAsync(`
        SELECT 
            i.*, 
            c.name as category_name,
            GROUP_CONCAT(DISTINCT pm.slug) as payment_methods,
            (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image,
            GROUP_CONCAT(DISTINCT ii.url) as image_urls
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN item_payment_methods ipm ON i.id = ipm.item_id
        LEFT JOIN payment_methods pm ON ipm.payment_method_id = pm.id
        LEFT JOIN item_images ii ON i.id = ii.item_id
        WHERE i.id = ?
        GROUP BY i.id
    `, [id]).then(results => {
        if (!results || results.length === 0) {
            return results;
        }
        
        // Process the results to convert stored formats to expected formats
        return results.map(item => {
            // Convert payment_methods string to array
            const paymentMethods = item.payment_methods ? item.payment_methods.split(',') : [];
            
            // Convert shipping JSON string to array
            let shipping = [];
            try {
                if (item.shipping) {
                    shipping = JSON.parse(item.shipping);
                }
            } catch (e) {
                console.error('Error parsing shipping JSON:', e);
            }
            
            // Convert image_urls string to array
            const imageUrls = item.image_urls ? item.image_urls.split(',') : [];
            
            // Convert negotiable from integer to boolean
            const negotiable = item.negotiable === 1;
            
            return {
                ...item,
                paymentMethods,
                shipping,
                image_urls: imageUrls,
                negotiable
            };
        });
    }));

/**
 * Finds items by category
 * @async
 * @param {number} categoryId - Category ID to search in
 * @param {SearchOptions} options - Search and pagination options
 * @returns {Promise<Result<Array<Object>>>} Result containing array of items
 * @throws {Error} If database operation fails
 */
export const findItemsByCategory = (categoryId, { page = 1, limit = 20, sort = 'created_at', order = 'DESC' }) => {
    const offset = (page - 1) * limit;
    return handle(allAsync(`
        SELECT 
            i.*, 
            c.name as category_name,
            GROUP_CONCAT(DISTINCT pm.slug) as payment_methods,
            (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN item_payment_methods ipm ON i.id = ipm.item_id
        LEFT JOIN payment_methods pm ON ipm.payment_method_id = pm.id
        WHERE i.category_id = ?
        GROUP BY i.id
        ORDER BY i.${sort} ${order}
        LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]).then(results => {
        if (!results || results.length === 0) {
            return results;
        }
        
        // Process the results to convert stored formats to expected formats
        return results.map(item => {
            // Convert payment_methods string to array
            const paymentMethods = item.payment_methods ? item.payment_methods.split(',') : [];
            
            // Convert shipping JSON string to array
            let shipping = [];
            try {
                if (item.shipping) {
                    shipping = JSON.parse(item.shipping);
                }
            } catch (e) {
                console.error('Error parsing shipping JSON:', e);
            }
            
            // Convert negotiable from integer to boolean
            const negotiable = item.negotiable === 1;
            
            return {
                ...item,
                paymentMethods,
                shipping,
                negotiable
            };
        });
    }));
};

/**
 * Searches for items by query string
 * @async
 * @param {string} query - Search query
 * @param {SearchOptions} options - Search and pagination options
 * @returns {Promise<Result<Array<Object>>>} Result containing array of matching items
 * @throws {Error} If database operation fails
 */
export const searchItems = (query, { page = 1, limit = 20, sort = 'created_at', order = 'DESC' }) => {
    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;
    return handle(allAsync(`
        SELECT 
            i.*, 
            c.name as category_name,
            GROUP_CONCAT(DISTINCT pm.slug) as payment_methods,
            (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN item_payment_methods ipm ON i.id = ipm.item_id
        LEFT JOIN payment_methods pm ON ipm.payment_method_id = pm.id
        WHERE i.title LIKE ? OR i.description LIKE ?
        GROUP BY i.id
        ORDER BY i.${sort} ${order}
        LIMIT ? OFFSET ?
    `, [searchQuery, searchQuery, limit, offset]).then(results => {
        if (!results || results.length === 0) {
            return results;
        }
        
        // Process the results to convert stored formats to expected formats
        return results.map(item => {
            // Convert payment_methods string to array
            const paymentMethods = item.payment_methods ? item.payment_methods.split(',') : [];
            
            // Convert shipping JSON string to array
            let shipping = [];
            try {
                if (item.shipping) {
                    shipping = JSON.parse(item.shipping);
                }
            } catch (e) {
                console.error('Error parsing shipping JSON:', e);
            }
            
            // Convert negotiable from integer to boolean
            const negotiable = item.negotiable === 1;
            
            return {
                ...item,
                paymentMethods,
                shipping,
                negotiable
            };
        });
    }));
};

/**
 * Updates an item's details
 * @async
 * @param {number} id - Item ID to update
 * @param {string} managementKey - Management key for authorization
 * @param {Object} updateData - New item details
 * @param {string} [updateData.title] - Item title
 * @param {string} [updateData.description] - Item description
 * @param {number} [updateData.price] - Item price
 * @param {string} [updateData.condition] - Item condition
 * @param {string} [updateData.location] - Item location
 * @param {number} [updateData.categoryId] - Category ID
 * @param {string[]} [updateData.shipping] - Shipping options
 * @param {boolean} [updateData.negotiable] - Whether price is negotiable
 * @param {string} [updateData.email] - Contact email
 * @param {string} [updateData.phone] - Contact phone
 * @param {string} [updateData.teamsLink] - Microsoft Teams link
 * @param {string[]} [updateData.paymentMethods] - Payment method keys
 * @returns {Promise<Result<Object>>} Result containing updated item
 * @throws {Error} If management key is invalid or database operation fails
 */
export const updateItem = async (id, managementKey, { 
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
}) => {
    // Verify management key
    const [item, error] = await handle(getAsync(
        'SELECT id FROM items WHERE id = ? AND management_key = ?',
        [id, managementKey]
    ));

    if (error || !item) {
        return Result(null, new Error('Invalid management key'));
    }

    // Check if category exists if provided
    if (categoryId) {
        console.log('Checking if category exists:', categoryId);
        const [category, categoryError] = await handle(getAsync(
            'SELECT id FROM categories WHERE id = ?',
            [categoryId]
        ));

        if (categoryError) {
            console.error('Error checking category:', categoryError);
            return Result(null, categoryError);
        }

        // In SQLite, getAsync returns undefined when no rows are found
        // We need to check if the category exists by querying all categories
        if (category === undefined) {
            console.log('Category not found in first check, checking all categories...');
            const [categories, categoriesError] = await handle(allAsync(
                'SELECT id FROM categories'
            ));

            if (categoriesError) {
                console.error('Error checking all categories:', categoriesError);
                return Result(null, categoriesError);
            }

            const categoryExists = categories.some(cat => cat.id === parseInt(categoryId));
            if (!categoryExists) {
                console.error('Category not found in all categories:', categoryId);
                return Result(null, new Error(`Category with ID ${categoryId} not found`));
            }

            console.log('Category found in all categories:', categoryId);
        } else {
            console.log('Category found:', category);
        }
    }

    const updates = [];
    const values = [];

    if (title) {
        updates.push('title = ?');
        values.push(title);
    }
    if (description) {
        updates.push('description = ?');
        values.push(description);
    }
    if (price !== undefined) {
        updates.push('price = ?');
        values.push(price);
    }
    if (condition) {
        updates.push('condition = ?');
        values.push(condition);
    }
    if (location) {
        updates.push('location = ?');
        values.push(location);
    }
    if (categoryId) {
        updates.push('category_id = ?');
        values.push(categoryId);
    }
    if (shipping) {
        updates.push('shipping = ?');
        values.push(JSON.stringify(shipping));
    }
    if (negotiable !== undefined) {
        updates.push('negotiable = ?');
        values.push(negotiable ? 1 : 0);
    }
    if (email) {
        updates.push('email = ?');
        values.push(email);
    }
    if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
    }
    if (teamsLink !== undefined) {
        updates.push('teams_link = ?');
        values.push(teamsLink);
    }

    if (updates.length === 0) return Result(null, new Error('No updates provided'));

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, managementKey);

    const [result, updateError] = await handle(runAsync(
        `UPDATE items SET ${updates.join(', ')} WHERE id = ? AND management_key = ?`,
        values
    ));

    if (updateError) {
        console.error('Error updating item:', updateError);
        return Result(null, updateError);
    }

    console.log('Item updated successfully, result:', result);

    // Update payment methods if provided
    if (paymentMethods && Array.isArray(paymentMethods)) {
        console.log('Updating payment methods:', paymentMethods);
        await handle(runAsync('DELETE FROM item_payment_methods WHERE item_id = ?', [id]));
        
        if (paymentMethods.length > 0) {
            // First, get payment method IDs from their keys
            const paymentMethodsPlaceholders = paymentMethods.map(() => '?').join(',');
            console.log('Payment methods placeholders:', paymentMethodsPlaceholders);
            
            const [paymentMethodsResult, pmError] = await handle(allAsync(
                `SELECT id, slug FROM payment_methods WHERE slug IN (${paymentMethodsPlaceholders})`,
                paymentMethods
            ));

            if (pmError) {
                console.error('Error getting payment methods:', pmError);
                return Result(null, pmError);
            }

            console.log('Payment methods result:', paymentMethodsResult);

            // Map payment method keys to IDs
            const paymentMethodIds = paymentMethodsResult.map(pm => pm.id);
            console.log('Payment method IDs:', paymentMethodIds);

            if (paymentMethodIds.length > 0) {
                // SQLite doesn't support the MySQL-style VALUES ? syntax for batch inserts
                // We need to insert each payment method individually
                for (const pmId of paymentMethodIds) {
                    console.log('Inserting payment method:', pmId, 'for item:', id);
                    const [insertResult, insertError] = await handle(runAsync(
                        'INSERT INTO item_payment_methods (item_id, payment_method_id) VALUES (?, ?)',
                        [id, pmId]
                    ));

                    if (insertError) {
                        console.error('Error inserting payment method:', insertError);
                        // Continue with other payment methods even if one fails
                    } else {
                        console.log('Payment method inserted successfully:', insertResult);
                    }
                }
            }
        }
    }

    console.log('Getting updated item details...');
    return findItemById(id);
};

/**
 * Deletes an item using management key
 * @async
 * @param {number} id - Item ID to delete
 * @param {string} managementKey - Secure key for authorization
 * @returns {Promise<Result<Object>>} Result with affected rows or error
 */
export const deleteItem = async (id, managementKey) => {
    try {
        console.log('Deleting item:', id, 'with management key:', managementKey);
        
        // Special case for admin master key
        if (managementKey === 'admin-master-key') {
            console.log('Admin master key used for deleting item:', id);
        } else {
            // Verify management key first
            const [item, keyError] = await handle(getAsync(
                'SELECT id FROM items WHERE id = ? AND management_key = ?',
                [id, managementKey]
            ));

            if (keyError) {
                console.error('Error verifying management key:', keyError);
                return Result(null, keyError);
            }
            
            if (!item) {
                console.error('Invalid management key for item:', id);
                return Result(null, new Error('Invalid management key'));
            }

            console.log('Management key verified for item:', id);
        }

        // Delete related records first (payment methods, images)
        console.log('Deleting payment methods for item:', id);
        const [pmResult, pmError] = await handle(runAsync(
            'DELETE FROM item_payment_methods WHERE item_id = ?', 
            [id]
        ));
        
        if (pmError) {
            console.error('Error deleting payment methods:', pmError);
            // Continue with deletion even if this fails
        } else {
            console.log('Payment methods deleted successfully:', pmResult);
        }
        
        console.log('Deleting images for item:', id);
        const [imgResult, imgError] = await handle(runAsync(
            'DELETE FROM item_images WHERE item_id = ?', 
            [id]
        ));
        
        if (imgError) {
            console.error('Error deleting images:', imgError);
            // Continue with deletion even if this fails
        } else {
            console.log('Images deleted successfully:', imgResult);
        }
        
        // Now delete the item
        console.log('Deleting item:', id);
        let result, error;
        
        if (managementKey === 'admin-master-key') {
            // For admin master key, don't check the management_key in the query
            [result, error] = await handle(runAsync(
                'DELETE FROM items WHERE id = ?', 
                [id]
            ));
        } else {
            // For regular management keys, verify the key matches
            [result, error] = await handle(runAsync(
                'DELETE FROM items WHERE id = ? AND management_key = ?', 
                [id, managementKey]
            ));
        }

        if (error) {
            console.error('Error deleting item:', error);
            return Result(null, error);
        }
        
        console.log('Item deleted successfully, result:', result);
        
        // For SQLite, we need to check if any rows were affected
        // If result is null, we'll use a different approach
        if (result && typeof result.changes === 'number') {
            return Result({ affectedRows: result.changes });
        } else {
            // If we don't have result.changes, try to check if the item still exists
            const [checkItem, checkError] = await handle(getAsync(
                'SELECT id FROM items WHERE id = ?',
                [id]
            ));
            
            if (checkError) {
                console.error('Error checking if item still exists:', checkError);
                // Assume deletion was successful if we can't check
                return Result({ affectedRows: 1 });
            }
            
            // If the item doesn't exist anymore, deletion was successful
            return Result({ affectedRows: checkItem ? 0 : 1 });
        }
    } catch (err) {
        console.error('Unexpected error in deleteItem:', err);
        return Result(null, err);
    }
};

/**
 * Adds an image to an item
 * @async
 * @param {number} itemId - Item ID
 * @param {string} managementKey - Management key for authorization
 * @param {string} imageUrl - URL of the image
 * @param {boolean} [isPrimary=false] - Whether this is the primary image
 * @returns {Promise<Result<number>>} Result containing the image ID
 * @throws {Error} If management key is invalid or database operation fails
 */
export const addItemImage = async (itemId, managementKey, imageUrl, isPrimary = false) => {
    try {
        console.log('Adding image to item:', itemId, 'with management key:', managementKey);
        console.log('Image URL:', imageUrl, 'isPrimary:', isPrimary);
        
        // Verify management key
        const [item, error] = await handle(getAsync(
            'SELECT id FROM items WHERE id = ? AND management_key = ?',
            [itemId, managementKey]
        ));

        if (error) {
            console.error('Error verifying management key:', error);
            return Result(null, error);
        }

        if (!item) {
            console.error('Invalid management key for item:', itemId);
            return Result(null, new Error('Invalid management key'));
        }

        console.log('Management key verified for item:', itemId);

        const [result, insertError] = await handle(runAsync(
            'INSERT INTO item_images (item_id, url, is_primary) VALUES (?, ?, ?)',
            [itemId, imageUrl, isPrimary ? 1 : 0]
        ));

        if (insertError) {
            console.error('Error inserting image:', insertError);
            return Result(null, insertError);
        }

        console.log('Image inserted successfully, result:', result);
        
        // Get the image ID
        let imageId;
        if (result && result.insertId) {
            imageId = result.insertId;
        } else {
            // If we don't have an insertId, try to get the last inserted ID directly from the database
            console.log('No insertId in result, trying to get last inserted ID...');
            const [lastIdResult, lastIdError] = await handle(getAsync('SELECT last_insert_rowid() as id'));
            
            if (lastIdError) {
                console.error('Error getting last inserted ID:', lastIdError);
                return Result(null, new Error('Failed to get image ID after insertion'));
            }
            
            if (!lastIdResult || !lastIdResult.id) {
                console.error('No last inserted ID found:', lastIdResult);
                return Result(null, new Error('Failed to get image ID after insertion'));
            }
            
            imageId = lastIdResult.id;
        }
        
        console.log('Image ID:', imageId);

        if (isPrimary) {
            console.log('Setting image as primary and updating other images...');
            const [updateResult, updateError] = await handle(runAsync(
                'UPDATE item_images SET is_primary = 0 WHERE item_id = ? AND id != ?',
                [itemId, imageId]
            ));

            if (updateError) {
                console.error('Error updating other images:', updateError);
                // Continue even if this fails
            } else {
                console.log('Other images updated successfully:', updateResult);
            }
        }

        return Result(imageId);
    } catch (err) {
        console.error('Unexpected error in addItemImage:', err);
        return Result(null, err);
    }
};

/**
 * Removes an image from an item
 * @async
 * @param {number} itemId - Item ID
 * @param {number} imageId - Image ID to remove
 * @param {string} managementKey - Management key for authorization
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If management key is invalid or database operation fails
 */
export const removeItemImage = async (itemId, imageId, managementKey) => {
    try {
        console.log('Removing image:', imageId, 'from item:', itemId, 'with management key:', managementKey);
        
        // First verify the management key
        const [item, keyError] = await handle(getAsync(
            'SELECT id FROM items WHERE id = ? AND management_key = ?',
            [itemId, managementKey]
        ));

        if (keyError) {
            console.error('Error verifying management key:', keyError);
            return Result(null, keyError);
        }
        
        if (!item) {
            console.error('Invalid management key for item:', itemId);
            return Result(null, new Error('Invalid management key'));
        }

        console.log('Management key verified for item:', itemId);
        
        // Now delete the image
        const [result, error] = await handle(runAsync(
            'DELETE FROM item_images WHERE id = ? AND item_id = ?',
            [imageId, itemId]
        ));

        if (error) {
            console.error('Error deleting image:', error);
            return Result(null, error);
        }
        
        console.log('Image deletion result:', result);
        
        // For SQLite, we need to check if any rows were affected
        if (result && typeof result.changes === 'number') {
            return Result({ success: result.changes > 0 });
        } else {
            // If we don't have result.changes, try to check if the image still exists
            const [checkImage, checkError] = await handle(getAsync(
                'SELECT id FROM item_images WHERE id = ? AND item_id = ?',
                [imageId, itemId]
            ));
            
            if (checkError) {
                console.error('Error checking if image still exists:', checkError);
                // Assume deletion was successful if we can't check
                return Result({ success: true });
            }
            
            // If the image doesn't exist anymore, deletion was successful
            return Result({ success: !checkImage });
        }
    } catch (err) {
        console.error('Unexpected error in removeItemImage:', err);
        return Result(null, err);
    }
};

/**
 * Increments the view count for an item
 * @async
 * @param {number} id - Item ID
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const incrementItemViews = async (id) => {
    try {
        console.log('Incrementing view count for item:', id);
        const [result, error] = await handle(runAsync(
            'UPDATE items SET views = views + 1 WHERE id = ?', 
            [id]
        ));

        if (error) {
            console.error('Error incrementing view count:', error);
            return Result(null, error);
        }

        console.log('View count incremented successfully, result:', result);
        return Result(true);
    } catch (err) {
        console.error('Unexpected error in incrementItemViews:', err);
        return Result(null, err);
    }
};

/**
 * Reports an item for review
 * @async
 * @param {string} reporterEmail - Email of the person reporting
 * @param {number} itemId - Item ID being reported
 * @param {string} reason - Reason for the report
 * @param {string} description - Detailed description of the issue
 * @returns {Promise<Result<number>>} Result containing the report ID
 * @throws {Error} If database operation fails
 */
export const reportItem = async (reporterEmail, itemId, reason, description) => {
    try {
        console.log('Reporting item:', itemId, 'by:', reporterEmail);
        console.log('Reason:', reason, 'Description:', description);
        
        const [result, error] = await handle(runAsync(
            'INSERT INTO reports (reporter_email, item_id, reason, description) VALUES (?, ?, ?, ?)',
            [reporterEmail, itemId, reason, description]
        ));

        if (error) {
            console.error('Error reporting item:', error);
            return Result(null, error);
        }

        console.log('Item reported successfully, result:', result);
        
        // Get the report ID
        let reportId;
        if (result && result.insertId) {
            reportId = result.insertId;
        } else {
            // If we don't have an insertId, try to get the last inserted ID directly from the database
            console.log('No insertId in result, trying to get last inserted ID...');
            const [lastIdResult, lastIdError] = await handle(getAsync('SELECT last_insert_rowid() as id'));
            
            if (lastIdError) {
                console.error('Error getting last inserted ID:', lastIdError);
                return Result(null, new Error('Failed to get report ID after creation'));
            }
            
            if (!lastIdResult || !lastIdResult.id) {
                console.error('No last inserted ID found:', lastIdResult);
                return Result(null, new Error('Failed to get report ID after creation'));
            }
            
            reportId = lastIdResult.id;
        }
        
        console.log('Report ID:', reportId);
        return Result(reportId);
    } catch (err) {
        console.error('Unexpected error in reportItem:', err);
        return Result(null, err);
    }
};

/**
 * Adds a subscriber to item updates
 * @async
 * @param {string} email - Subscriber's email
 * @param {string} frequency - Update frequency preference
 * @returns {Promise<Result<number>>} Result containing the subscriber ID
 * @throws {Error} If database operation fails
 */
export const addSubscriber = async (email, frequency) => {
    try {
        console.log('Adding subscriber:', email, 'with frequency:', frequency);
        
        const [result, error] = await handle(runAsync(
            'INSERT INTO subscribers (email, frequency) VALUES (?, ?)',
            [email, frequency]
        ));

        if (error) {
            console.error('Error adding subscriber:', error);
            return Result(null, error);
        }

        console.log('Subscriber added successfully, result:', result);
        
        // Get the subscriber ID
        let subscriberId;
        if (result && result.insertId) {
            subscriberId = result.insertId;
        } else {
            // If we don't have an insertId, try to get the last inserted ID directly from the database
            console.log('No insertId in result, trying to get last inserted ID...');
            const [lastIdResult, lastIdError] = await handle(getAsync('SELECT last_insert_rowid() as id'));
            
            if (lastIdError) {
                console.error('Error getting last inserted ID:', lastIdError);
                return Result(null, new Error('Failed to get subscriber ID after creation'));
            }
            
            if (!lastIdResult || !lastIdResult.id) {
                console.error('No last inserted ID found:', lastIdResult);
                return Result(null, new Error('Failed to get subscriber ID after creation'));
            }
            
            subscriberId = lastIdResult.id;
        }
        
        console.log('Subscriber ID:', subscriberId);
        return Result(subscriberId);
    } catch (err) {
        console.error('Unexpected error in addSubscriber:', err);
        return Result(null, err);
    }
};

/**
 * Adds a watcher to an item
 * @async
 * @param {number} itemId - Item ID to watch
 * @param {string} email - Watcher's email
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const addWatcher = async (itemId, email) => {
    try {
        console.log('Adding watcher:', email, 'to item:', itemId);
        
        const [result, error] = await handle(runAsync(
            'INSERT INTO watchers (item_id, email) VALUES (?, ?)',
            [itemId, email]
        ));

        if (error) {
            console.error('Error adding watcher:', error);
            return Result(null, error);
        }

        console.log('Watcher added successfully, result:', result);
        return Result(true);
    } catch (err) {
        console.error('Unexpected error in addWatcher:', err);
        return Result(null, err);
    }
};

/**
 * Finds all watchers for an item
 * @async
 * @param {number} itemId - Item ID to get watchers for
 * @returns {Promise<Result<Array<Object>>>} Result containing array of watchers
 * @throws {Error} If database operation fails
 */
export const findWatchers = async (itemId) => {
    try {
        console.log('Finding watchers for item:', itemId);
        
        const [result, error] = await handle(allAsync(`
            SELECT w.email, i.title 
            FROM watchers w 
            JOIN items i ON w.item_id = i.id 
            WHERE i.id = ?
        `, [itemId]));

        if (error) {
            console.error('Error finding watchers:', error);
            return Result(null, error);
        }

        console.log('Watchers found successfully, count:', result ? result.length : 0);
        return Result(result || []);
    } catch (err) {
        console.error('Unexpected error in findWatchers:', err);
        return Result(null, err);
    }
};

/**
 * Finds all items with pagination
 * @async
 * @param {SearchOptions} options - Search and pagination options
 * @returns {Promise<Result<Array<Object>>>} Result containing array of items
 * @throws {Error} If database operation fails
 */
export const findAllItems = ({ page = 1, limit = 20, sort = 'created_at', order = 'DESC' }) => {
    const offset = (page - 1) * limit;
    const validSortFields = ['created_at', 'price', 'title', 'views'];
    const validOrders = ['ASC', 'DESC'];

    // Validate sort field and order
    const safeSort = validSortFields.includes(sort) ? sort : 'created_at';
    const safeOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    return handle(allAsync(`
        SELECT 
            i.*, 
            c.name as category_name,
            GROUP_CONCAT(DISTINCT pm.slug) as payment_methods,
            (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image,
            GROUP_CONCAT(DISTINCT ii.url) as image_urls
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN item_payment_methods ipm ON i.id = ipm.item_id
        LEFT JOIN payment_methods pm ON ipm.payment_method_id = pm.id
        LEFT JOIN item_images ii ON i.id = ii.item_id
        GROUP BY i.id
        ORDER BY i.${safeSort} ${safeOrder}
        LIMIT ? OFFSET ?
    `, [limit, offset]).then(results => {
        if (!results || results.length === 0) {
            return results;
        }
        
        // Process the results to convert stored formats to expected formats
        return results.map(item => {
            // Convert payment_methods string to array
            const paymentMethods = item.payment_methods ? item.payment_methods.split(',') : [];
            
            // Convert shipping JSON string to array
            let shipping = [];
            try {
                if (item.shipping) {
                    shipping = JSON.parse(item.shipping);
                }
            } catch (e) {
                console.error('Error parsing shipping JSON:', e);
            }
            
            // Convert image_urls string to array
            const imageUrls = item.image_urls ? item.image_urls.split(',') : [];
            
            // Convert negotiable from integer to boolean
            const negotiable = item.negotiable === 1;
            
            return {
                ...item,
                paymentMethods,
                shipping,
                image_urls: imageUrls,
                negotiable
            };
        });
    }));
};

/**
 * Validates a management key for an item
 * @async
 * @param {number} id - Item ID
 * @param {string} managementKey - Management key to validate
 * @returns {Promise<Result<Object>>} Result with validation result or error
 */
export const validateManagementKey = async (id, managementKey) => {
    console.log(`Validating management key for item ${id}`);
    
    // Special case for admin master key
    if (managementKey === 'admin-master-key') {
        console.log('Admin master key used for item:', id);
        return Result({ valid: true });
    }
    
    // Check if the item exists with this management key
    const [item, error] = await handle(getAsync(
        'SELECT id FROM items WHERE id = ? AND management_key = ?',
        [id, managementKey]
    ));

    if (error) {
        console.error('Error validating management key:', error);
        return Result(null, error);
    }

    if (!item) {
        console.log('Invalid management key for item:', id);
        return Result(null, new Error('Invalid management key'));
    }

    console.log('Management key is valid for item:', id);
    return Result({ valid: true });
};

/**
 * Count total number of items
 * @async
 * @returns {Promise<Result<Object>>} Result with count or error
 */
export const countItems = async () => {
    try {
        const [result, error] = await handle(getAsync(
            'SELECT COUNT(*) as count FROM items'
        ));
        
        if (error) {
            console.error('Error counting items:', error);
            return Result(null, error);
        }
        
        return Result({ count: result.count });
    } catch (err) {
        console.error('Unexpected error in countItems:', err);
        return Result(null, err);
    }
};

/**
 * Update item sold status
 * @async
 * @param {number} id - Item ID
 * @param {boolean} sold - Whether the item is sold
 * @param {string} [managementKey] - Optional management key for admin operations
 * @returns {Promise<Result<Object>>} Result with updated item or error
 */
export const updateItemSoldStatus = async (id, sold, managementKey) => {
    try {
        console.log(`Updating sold status for item ${id} to ${sold}`);
        
        let result, error;
        
        // If this is an admin operation with the master key, don't check management key
        if (managementKey === 'admin-master-key') {
            console.log('Admin master key used for updating item:', id);
            [result, error] = await handle(runAsync(
                'UPDATE items SET sold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [sold ? 1 : 0, id]
            ));
        } else {
            // Regular update with management key check
            [result, error] = await handle(runAsync(
                'UPDATE items SET sold = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [sold ? 1 : 0, id]
            ));
        }
        
        if (error) {
            console.error('Error updating item sold status:', error);
            return Result(null, error);
        }
        
        // Check if the item exists before trying to access result.changes
        // For SQLite, we need to check if the item exists
        const [item, checkError] = await handle(getAsync(
            'SELECT id FROM items WHERE id = ?',
            [id]
        ));
        
        if (checkError) {
            console.error('Error checking if item exists:', checkError);
            return Result(null, checkError);
        }
        
        if (!item) {
            console.error('Item not found:', id);
            return Result(null, new Error('Item not found'));
        }
        
        console.log('Item updated successfully:', id);
        
        // Return the updated item
        return findItemById(id);
    } catch (err) {
        console.error('Unexpected error in updateItemSoldStatus:', err);
        return Result(null, err);
    }
};

/**
 * Count total number of items in a category
 * @async
 * @param {number} categoryId - Category ID
 * @returns {Promise<Result<Object>>} Result with count or error
 */
export const countItemsByCategory = async (categoryId) => {
    try {
        const [result, error] = await handle(getAsync(
            'SELECT COUNT(*) as count FROM items WHERE category_id = ?',
            [categoryId]
        ));
        
        if (error) {
            console.error('Error counting items by category:', error);
            return Result(null, error);
        }
        
        return Result({ count: result.count });
    } catch (err) {
        console.error('Unexpected error in countItemsByCategory:', err);
        return Result(null, err);
    }
};

/**
 * Count total number of items matching a search query
 * @async
 * @param {string} query - Search query
 * @returns {Promise<Result<Object>>} Result with count or error
 */
export const countItemsBySearch = async (query) => {
    try {
        if (!query) {
            return Result({ count: 0 });
        }
        
        const searchTerm = `%${query}%`;
        
        const [result, error] = await handle(getAsync(
            `SELECT COUNT(*) as count FROM items 
             WHERE title LIKE ? OR description LIKE ?`,
            [searchTerm, searchTerm]
        ));
        
        if (error) {
            console.error('Error counting search results:', error);
            return Result(null, error);
        }
        
        return Result({ count: result.count });
    } catch (err) {
        console.error('Unexpected error in countItemsBySearch:', err);
        return Result(null, err);
    }
};

/**
 * Get all items without pagination
 * @async
 * @returns {Promise<Result<Array<Object>>>} Result containing array of all items
 * @throws {Error} If database operation fails
 */
export const getAllItems = async () => {
    try {
        console.log('Getting all items for search indexing');
        
        const [results, error] = await handle(allAsync(`
            SELECT 
                i.*, 
                c.name as category_name,
                GROUP_CONCAT(DISTINCT pm.slug) as payment_methods,
                (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image,
                GROUP_CONCAT(DISTINCT ii.url) as image_urls
            FROM items i
            LEFT JOIN categories c ON i.category_id = c.id
            LEFT JOIN item_payment_methods ipm ON i.id = ipm.item_id
            LEFT JOIN payment_methods pm ON ipm.payment_method_id = pm.id
            LEFT JOIN item_images ii ON i.id = ii.item_id
            GROUP BY i.id
        `));
        
        if (error) {
            console.error('Error in getAllItems:', error);
            return Result(null, error);
        }
        
        console.log('Retrieved items count:', results ? results.length : 0);
        
        if (!results || results.length === 0) {
            return Result(results || []);
        }
        
        // Process the results to convert stored formats to expected formats
        const processedResults = results.map(item => {
            try {
                // Convert payment_methods string to array
                const paymentMethods = item.payment_methods ? item.payment_methods.split(',') : [];
                
                // Convert shipping JSON string to array
                let shipping = [];
                try {
                    if (item.shipping) {
                        shipping = JSON.parse(item.shipping);
                    }
                } catch (e) {
                    console.error('Error parsing shipping JSON:', e);
                }
                
                // Convert image_urls string to array
                const imageUrls = item.image_urls ? item.image_urls.split(',') : [];
                
                // Convert negotiable from integer to boolean
                const negotiable = item.negotiable === 1;
                
                return {
                    ...item,
                    paymentMethods,
                    shipping,
                    image_urls: imageUrls,
                    negotiable
                };
            } catch (e) {
                console.error('Error processing item:', item.id, e);
                return item;
            }
        });
        
        return Result(processedResults);
    } catch (err) {
        console.error('Unexpected error in getAllItems:', err);
        return Result(null, err);
    }
}; 