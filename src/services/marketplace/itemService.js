/**
 * @fileoverview Item service handling marketplace listing operations.
 * @module services/marketplace/itemService
 * 
 * Provides functionality for:
 * - Item creation and management
 * - Search and filtering
 * - Image handling
 * - Reporting system
 * - Watch list management
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync, generateManagementKey } from '../database.js';
import { notifyWatchers } from './notificationService.js';

/**
 * @typedef {Object} ItemData
 * @property {string} title - Item title
 * @property {string} description - Item description
 * @property {number} price - Item price
 * @property {('new'|'like_new'|'good'|'fair'|'poor')} condition - Item condition
 * @property {string} location - Item location
 * @property {string[]} [shipping] - Array of shipping options
 * @property {boolean} [negotiable] - Whether price is negotiable
 * @property {string} [email] - Contact email
 * @property {string} [phone] - Contact phone
 * @property {string} [teamsLink] - Microsoft Teams link
 * @property {string[]} [paymentMethods] - Array of payment method keys
 */

/**
 * Creates a new marketplace item
 * @async
 * @param {number} categoryId - Category ID for the item
 * @param {ItemData} itemData - Item details and payment methods
 * @returns {Promise<Result<Object>>} Created item with management key
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
    // Validate required fields
    if (!title || !description || price === undefined || !condition || !location) {
        return Result(null, new Error('Missing required fields'));
    }

    // Validate price
    if (isNaN(price) || price < 0) {
        return Result(null, new Error('Invalid price'));
    }

    // Validate condition
    const validConditions = ['new', 'like_new', 'good', 'fair', 'poor'];
    if (!validConditions.includes(condition)) {
        return Result(null, new Error('Invalid condition'));
    }

    // Convert shipping array to JSON string
    const shippingJson = JSON.stringify(shipping);

    const managementKey = generateManagementKey();
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

    if (error) return Result(null, error);

    const itemId = result.insertId;

    // Add payment methods
    if (paymentMethods && paymentMethods.length > 0) {
        // First, get payment method IDs from their keys
        const paymentMethodsPlaceholders = paymentMethods.map(() => '?').join(',');
        const [paymentMethodsResult, pmError] = await handle(allAsync(
            `SELECT id, slug FROM payment_methods WHERE slug IN (${paymentMethodsPlaceholders})`,
            paymentMethods
        ));

        if (pmError) return Result(null, pmError);

        // Map payment method keys to IDs
        const paymentMethodIds = paymentMethodsResult.map(pm => pm.id);

        if (paymentMethodIds.length > 0) {
            const values = paymentMethodIds.map(pmId => [itemId, pmId]);
            const [_, insertError] = await handle(runAsync(
                'INSERT INTO item_payment_methods (item_id, payment_method_id) VALUES ?',
                [values]
            ));

            if (insertError) return Result(null, insertError);
        }
    }

    const [item, itemError] = await findItemById(itemId);
    if (itemError) return Result(null, itemError);

    return Result({ ...item, managementKey });
};

/**
 * Finds an item by its ID
 * @async
 * @param {number} id - Item ID to find
 * @returns {Promise<Result<Object>>} Item details
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
 * Finds items in a specific category
 * @async
 * @param {number} categoryId - Category ID to search in
 * @param {Object} options - Search options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sort='created_at'] - Sort field
 * @param {string} [options.order='DESC'] - Sort order
 * @returns {Promise<Result<Array<Object>>>} Paginated items in category
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
 * Searches items by query string
 * @async
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sort='created_at'] - Sort field
 * @param {string} [options.order='DESC'] - Sort order
 * @returns {Promise<Result<Array<Object>>>} Matching items
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
 * Updates item details using management key
 * @async
 * @param {number} id - Item ID to update
 * @param {string} managementKey - Secure key for authorization
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Result<Object>>} Updated item
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

    if (updateError) return Result(null, updateError);

    // Update payment methods if provided
    if (paymentMethods && Array.isArray(paymentMethods)) {
        await handle(runAsync('DELETE FROM item_payment_methods WHERE item_id = ?', [id]));
        
        if (paymentMethods.length > 0) {
            // First, get payment method IDs from their keys
            const paymentMethodsPlaceholders = paymentMethods.map(() => '?').join(',');
            const [paymentMethodsResult, pmError] = await handle(allAsync(
                `SELECT id, slug FROM payment_methods WHERE slug IN (${paymentMethodsPlaceholders})`,
                paymentMethods
            ));

            if (pmError) return Result(null, pmError);

            // Map payment method keys to IDs
            const paymentMethodIds = paymentMethodsResult.map(pm => pm.id);

            if (paymentMethodIds.length > 0) {
                const values = paymentMethodIds.map(pmId => [id, pmId]);
                const [_, insertError] = await handle(runAsync(
                    'INSERT INTO item_payment_methods (item_id, payment_method_id) VALUES ?',
                    [values]
                ));

                if (insertError) return Result(null, insertError);
            }
        }
    }

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
    // Verify management key first
    const [item, keyError] = await handle(getAsync(
        'SELECT id FROM items WHERE id = ? AND management_key = ?',
        [id, managementKey]
    ));

    if (keyError) return Result(null, keyError);
    
    if (!item) {
        return Result(null, new Error('Invalid management key'));
    }

    // Delete related records first (payment methods, images)
    await handle(runAsync('DELETE FROM item_payment_methods WHERE item_id = ?', [id]));
    await handle(runAsync('DELETE FROM item_images WHERE item_id = ?', [id]));
    
    // Now delete the item
    return handle(runAsync('DELETE FROM items WHERE id = ? AND management_key = ?', [id, managementKey]));
};

/**
 * Adds an image to an item
 * @async
 * @param {number} itemId - Item ID
 * @param {string} managementKey - Secure key for authorization
 * @param {string} imageUrl - URL of the image
 * @param {boolean} [isPrimary=false] - Whether this is the primary image
 * @returns {Promise<Result<number>>} Image ID
 */
export const addItemImage = async (itemId, managementKey, imageUrl, isPrimary = false) => {
    // Verify management key
    const [item, error] = await handle(getAsync(
        'SELECT id FROM items WHERE id = ? AND management_key = ?',
        [itemId, managementKey]
    ));

    if (error || !item) {
        return Result(null, new Error('Invalid management key'));
    }

    const [result, insertError] = await handle(runAsync(
        'INSERT INTO item_images (item_id, url, is_primary) VALUES (?, ?, ?)',
        [itemId, imageUrl, isPrimary]
    ));

    if (insertError) return Result(null, insertError);

    if (isPrimary) {
        await handle(runAsync(
            'UPDATE item_images SET is_primary = 0 WHERE item_id = ? AND id != ?',
            [itemId, result.insertId]
        ));
    }

    return Result(result.insertId);
};

/**
 * Removes an image from an item
 * @async
 * @param {number} itemId - Item ID
 * @param {number} imageId - Image ID to remove
 * @param {string} managementKey - Secure key for authorization
 * @returns {Promise<Result<boolean>>} Success indicator
 */
export const removeItemImage = (itemId, imageId, managementKey) => 
    handle(runAsync(
        'DELETE FROM item_images WHERE id = ? AND item_id = ? AND EXISTS (SELECT 1 FROM items WHERE id = ? AND management_key = ?)',
        [imageId, itemId, itemId, managementKey]
    ));

/**
 * Increments the view count for an item
 * @async
 * @param {number} id - Item ID
 * @returns {Promise<Result<boolean>>} Success indicator
 */
export const incrementItemViews = (id) => 
    handle(runAsync('UPDATE items SET views = views + 1 WHERE id = ?', [id]));

/**
 * Reports an item for review
 * @async
 * @param {string} reporterEmail - Email of reporter
 * @param {number} itemId - Item ID being reported
 * @param {string} reason - Reason for report
 * @param {string} description - Detailed description
 * @returns {Promise<Result<number>>} Report ID
 */
export const reportItem = (reporterEmail, itemId, reason, description) => 
    handle(runAsync(
        'INSERT INTO reports (reporter_email, item_id, reason, description) VALUES (?, ?, ?, ?)',
        [reporterEmail, itemId, reason, description]
    ));

/**
 * Adds a subscriber for item updates
 * @async
 * @param {string} email - Subscriber email
 * @param {string} frequency - Update frequency
 * @returns {Promise<Result<number>>} Subscriber ID
 */
export const addSubscriber = (email, frequency) => 
    handle(runAsync(
        'INSERT INTO subscribers (email, frequency) VALUES (?, ?)',
        [email, frequency]
    ));

/**
 * Adds a watcher to an item
 * @async
 * @param {number} itemId - Item ID to watch
 * @param {string} email - Watcher's email
 * @returns {Promise<Result<boolean>>} Success indicator
 */
export const addWatcher = (itemId, email) => 
    handle(runAsync(
        'INSERT INTO watchers (item_id, email) VALUES (?, ?)',
        [itemId, email]
    ));

/**
 * Finds all watchers for an item
 * @async
 * @param {number} itemId - Item ID
 * @returns {Promise<Result<Array<Object>>>} List of watchers
 */
export const findWatchers = (itemId) => 
    handle(allAsync(`
        SELECT w.email, i.title 
        FROM watchers w 
        JOIN items i ON w.item_id = i.id 
        WHERE i.id = ?
    `, [itemId])); 