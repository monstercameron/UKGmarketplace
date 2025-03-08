/**
 * @fileoverview Category service handling all category-related operations including
 * CRUD operations and category tree management.
 * @module services/categoryService
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync } from '../database/connection.js';
import slugify from 'slugify';

/**
 * @typedef {Object} Category
 * @property {number} id - Category ID
 * @property {string} name - Category name
 * @property {string} slug - URL-friendly category name
 * @property {number} [parent_id] - Parent category ID (null for root categories)
 * @property {string} [description] - Category description
 */

/**
 * @typedef {Object} CategoryNode
 * @property {number} id - Category ID
 * @property {string} name - Category name
 * @property {string} slug - URL-friendly category name
 * @property {number} [parent_id] - Parent category ID
 * @property {string} [description] - Category description
 * @property {Array<CategoryNode>} children - Array of child categories
 */

/**
 * @typedef {Object} CategoryUpdateData
 * @property {string} [name] - New category name
 * @property {number} [parentId] - New parent category ID
 * @property {string} [description] - New category description
 */

/**
 * Creates a new category
 * @async
 * @param {string} name - Category name
 * @param {number} [parentId=null] - Parent category ID
 * @param {string} [description=''] - Category description
 * @returns {Promise<Result<number>>} Result containing the new category ID
 * @throws {Error} If database operation fails
 * @example
 * const [result, error] = await createCategory('Electronics', null, 'Electronic devices and accessories');
 * if (error) console.error('Failed to create category:', error);
 */
export const createCategory = (name, parentId = null, description = '') => {
    const slug = slugify(name, { lower: true, strict: true });
    return handle(runAsync(
        'INSERT INTO categories (name, slug, parent_id, description) VALUES (?, ?, ?, ?)',
        [name, slug, parentId, description]
    ));
};

/**
 * Retrieves all categories
 * @async
 * @returns {Promise<Result<Array<Category>>>} Result containing array of all categories
 * @throws {Error} If database operation fails
 */
export const findAllCategories = () => 
    handle(allAsync('SELECT * FROM categories ORDER BY name'));

/**
 * Finds a category by its ID
 * @async
 * @param {number} id - Category ID to search for
 * @returns {Promise<Result<Category>>} Result containing the category
 * @throws {Error} If database operation fails
 */
export const findCategoryById = async (id) => {
    console.log('Finding category by ID:', id);
    
    // First try to get the category directly
    const [category, error] = await handle(getAsync('SELECT * FROM categories WHERE id = ?', [id]));
    
    if (error) {
        console.error('Error finding category by ID:', error);
        return Result(null, error);
    }
    
    // If category is undefined, try to check if the ID exists in all categories
    if (category === undefined) {
        console.log('Category not found in direct query, checking all categories...');
        const [categories, categoriesError] = await handle(allAsync('SELECT id FROM categories'));
        
        if (categoriesError) {
            console.error('Error checking all categories:', categoriesError);
            return Result(null, categoriesError);
        }
        
        const categoryExists = categories.some(cat => cat.id === parseInt(id));
        if (categoryExists) {
            // If the category exists but we couldn't get it directly, try again with a different query
            console.log('Category exists in all categories, trying to get it again...');
            const [allCategories, allCategoriesError] = await handle(allAsync('SELECT * FROM categories WHERE id = ?', [id]));
            
            if (allCategoriesError) {
                console.error('Error getting category from all categories:', allCategoriesError);
                return Result(null, allCategoriesError);
            }
            
            if (allCategories && allCategories.length > 0) {
                console.log('Category found in all categories:', allCategories[0]);
                return Result(allCategories[0]);
            }
        }
        
        console.log('Category not found in all categories:', id);
    }
    
    console.log('Category result:', category);
    return Result(category);
};

/**
 * Finds a category by its slug
 * @async
 * @param {string} slug - Category slug to search for
 * @returns {Promise<Result<Category>>} Result containing the category
 * @throws {Error} If database operation fails
 */
export const findCategoryBySlug = async (slug) => {
    console.log('Finding category by slug:', slug);
    
    // First try to get the category directly
    const [category, error] = await handle(getAsync('SELECT * FROM categories WHERE slug = ?', [slug]));
    
    if (error) {
        console.error('Error finding category by slug:', error);
        return Result(null, error);
    }
    
    // If category is undefined, try to check if the slug exists in all categories
    if (category === undefined) {
        console.log('Category not found in direct query, checking all categories...');
        const [categories, categoriesError] = await handle(allAsync('SELECT slug FROM categories'));
        
        if (categoriesError) {
            console.error('Error checking all categories:', categoriesError);
            return Result(null, categoriesError);
        }
        
        const categoryExists = categories.some(cat => cat.slug === slug);
        if (categoryExists) {
            // If the category exists but we couldn't get it directly, try again with a different query
            console.log('Category exists in all categories, trying to get it again...');
            const [allCategories, allCategoriesError] = await handle(allAsync('SELECT * FROM categories WHERE slug = ?', [slug]));
            
            if (allCategoriesError) {
                console.error('Error getting category from all categories:', allCategoriesError);
                return Result(null, allCategoriesError);
            }
            
            if (allCategories && allCategories.length > 0) {
                console.log('Category found in all categories:', allCategories[0]);
                return Result(allCategories[0]);
            }
        }
        
        console.log('Category not found in all categories:', slug);
    }
    
    console.log('Category result:', category);
    return Result(category);
};

/**
 * Finds all subcategories of a category
 * @async
 * @param {number} parentId - Parent category ID
 * @returns {Promise<Result<Array<Category>>>} Result containing array of subcategories
 * @throws {Error} If database operation fails
 */
export const findSubCategories = async (parentId) => {
    console.log('Finding subcategories for parent ID:', parentId);
    
    // First check if the parent category exists
    const [parentCategory, parentError] = await findCategoryById(parentId);
    
    if (parentError) {
        console.error('Error finding parent category:', parentError);
        return Result(null, parentError);
    }
    
    if (!parentCategory) {
        console.error('Parent category not found:', parentId);
        return Result(null, new Error(`Parent category with ID ${parentId} not found`));
    }
    
    // Now get the subcategories
    const [subcategories, error] = await handle(allAsync(
        'SELECT * FROM categories WHERE parent_id = ? ORDER BY name', 
        [parentId]
    ));
    
    if (error) {
        console.error('Error finding subcategories:', error);
        return Result(null, error);
    }
    
    console.log('Subcategories found:', subcategories ? subcategories.length : 0);
    return Result(subcategories || []);
};

/**
 * Updates a category's details
 * @async
 * @param {number} id - Category ID to update
 * @param {CategoryUpdateData} updateData - New category details
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If no updates provided or database operation fails
 */
export const updateCategory = (id, { name, parentId, description }) => {
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;
    const updates = [];
    const values = [];

    if (name) {
        updates.push('name = ?');
        values.push(name);
    }
    if (slug) {
        updates.push('slug = ?');
        values.push(slug);
    }
    if (parentId !== undefined) {
        updates.push('parent_id = ?');
        values.push(parentId);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }

    if (updates.length === 0) return Result(null, new Error('No updates provided'));

    values.push(id);
    return handle(runAsync(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        values
    ));
};

/**
 * Deletes a category
 * @async
 * @param {number} id - Category ID to delete
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const deleteCategory = (id) => 
    handle(runAsync('DELETE FROM categories WHERE id = ?', [id]));

/**
 * Builds a hierarchical tree of all categories
 * @async
 * @returns {Promise<Result<Array<CategoryNode>>>} Result containing array of root categories with their children
 * @throws {Error} If database operation fails
 * @example
 * const [tree, error] = await getCategoryTree();
 * if (error) console.error('Failed to get category tree:', error);
 * else console.log('Category tree:', JSON.stringify(tree, null, 2));
 */
export const getCategoryTree = async () => {
    const [categories, error] = await findAllCategories();
    if (error) return Result(null, error);

    const categoryMap = new Map();
    const roots = [];

    // First pass: create category objects
    categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build the tree
    categories.forEach(category => {
        const node = categoryMap.get(category.id);
        if (category.parent_id) {
            const parent = categoryMap.get(category.parent_id);
            if (parent) parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return Result(roots);
}; 