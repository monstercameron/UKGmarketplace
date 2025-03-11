/**
 * Utility script to seed test data into the database
 * This will help resolve the RSS feed issue by ensuring there are items to display
 */

import { runAsync, allAsync, getAsync } from './connection.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name and set up path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '../..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });

/**
 * Sample test data
 */
const testCategories = [
    { id: 1, name: 'Electronics', slug: 'electronics' },
    { id: 2, name: 'Furniture', slug: 'furniture' },
    { id: 3, name: 'Clothing', slug: 'clothing' }
];

const testItems = [
    {
        id: 1,
        title: 'Test Laptop',
        description: 'A test laptop for the RSS feed',
        price: 499.99,
        condition: 'Like New',
        location: 'Office 101',
        category_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
    },
    {
        id: 2,
        title: 'Office Chair',
        description: 'Comfortable office chair',
        price: 149.99,
        condition: 'Good',
        location: 'Office 202',
        category_id: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
    },
    {
        id: 3,
        title: 'Company T-Shirt',
        description: 'A branded t-shirt, XL size',
        price: 19.99,
        condition: 'New',
        location: 'HR Department',
        category_id: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
    }
];

/**
 * Seed test data into the database
 */
async function seedTestData() {
    try {
        console.log('Checking database status...');
        
        // Check if categories table exists
        try {
            await getAsync('SELECT 1 FROM categories LIMIT 1');
            console.log('Categories table exists');
        } catch (error) {
            console.error('Error accessing categories table:', error.message);
            console.log('Please make sure the database is initialized properly');
            return;
        }
        
        // Check if items table exists
        try {
            await getAsync('SELECT 1 FROM items LIMIT 1');
            console.log('Items table exists');
        } catch (error) {
            console.error('Error accessing items table:', error.message);
            console.log('Please make sure the database is initialized properly');
            return;
        }
        
        // Check if there are already items in the database
        const existingItems = await allAsync('SELECT id FROM items');
        if (existingItems && existingItems.length > 0) {
            console.log(`Database already has ${existingItems.length} items.`);
            console.log('Would you like to add test data anyway? Set FORCE_SEED=true in environment to proceed.');
            
            if (process.env.FORCE_SEED !== 'true') {
                console.log('Exiting without changes. Set FORCE_SEED=true to force seeding.');
                return;
            }
        }
        
        console.log('Starting to seed test data...');
        
        // Seed categories
        for (const category of testCategories) {
            const existingCategory = await getAsync('SELECT id FROM categories WHERE id = ?', [category.id]);
            if (!existingCategory) {
                await runAsync(
                    'INSERT OR REPLACE INTO categories (id, name, slug) VALUES (?, ?, ?)',
                    [category.id, category.name, category.slug]
                );
                console.log(`Added category: ${category.name}`);
            } else {
                console.log(`Category already exists: ${category.name}`);
            }
        }
        
        // Seed items
        for (const item of testItems) {
            const existingItem = await getAsync('SELECT id FROM items WHERE id = ?', [item.id]);
            if (!existingItem) {
                await runAsync(
                    'INSERT OR REPLACE INTO items (id, title, description, price, condition, location, category_id, created_at, updated_at, status) ' +
                    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        item.id, 
                        item.title, 
                        item.description, 
                        item.price, 
                        item.condition, 
                        item.location, 
                        item.category_id, 
                        item.created_at, 
                        item.updated_at, 
                        item.status
                    ]
                );
                console.log(`Added item: ${item.title}`);
            } else {
                console.log(`Item already exists: ${item.title}`);
            }
        }
        
        console.log('Test data seeding complete!');
        console.log('You should now be able to access the RSS feed without errors.');
        
        // Verify items were added
        const countCheck = await getAsync('SELECT COUNT(*) as count FROM items');
        console.log(`Total items in database: ${countCheck.count}`);
        
    } catch (error) {
        console.error('Error seeding test data:', error);
    }
}

// Run the seed function when this file is executed directly
seedTestData().then(() => {
    console.log('Seed script completed');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error in seed script:', error);
    process.exit(1);
}); 