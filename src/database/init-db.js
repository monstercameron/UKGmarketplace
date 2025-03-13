/**
 * @fileoverview Database initialization script to set up tables and basic structure
 */

import { db, runAsync, tablesInitialized } from './schema.js';
import { handle } from '../utils/result.js';

/**
 * Initialize the database with essential records
 * This sets up required records but doesn't add example/demo data
 */
export async function initializeDatabase() {
    try {
        // Wait for tables to be initialized
        await tablesInitialized;
        
        // Initialize payment methods (essential for the app)
        const paymentMethods = [
            { name: 'Cash', slug: 'cash', description: 'Cash on delivery' },
            { name: 'PayPal', slug: 'paypal', description: 'PayPal payment' },
            { name: 'Venmo', slug: 'venmo', description: 'Venmo payment' },
            { name: 'Zelle', slug: 'zelle', description: 'Zelle payment' },
            { name: 'Apple Cash', slug: 'apple_cash', description: 'Apple Cash payment' },
            { name: 'Cash App', slug: 'cash_app', description: 'Cash App payment' },
            { name: 'Other', slug: 'other', description: 'Other payment methods' }
        ];

        for (const method of paymentMethods) {
            await runAsync(
                'INSERT OR IGNORE INTO payment_methods (name, slug, description) VALUES (?, ?, ?)',
                [method.name, method.slug, method.description]
            );
        }

        // Add 20 broad, commonly traded categories
        const categories = [
            // Technology categories
            { name: 'Electronics & Computers', slug: 'electronics-computers', description: 'Electronics, computers, and tech items including laptops, desktops, TVs, cameras, smart home devices, audio equipment, and accessories' },
            { name: 'Mobile Phones', slug: 'mobile-phones', description: 'Smartphones, cell phones, and phone accessories including cases, chargers, and screen protectors' },
            { name: 'Gaming & Consoles', slug: 'gaming', description: 'Video games, consoles, gaming accessories, and related equipment' },
            
            // Home categories
            { name: 'Furniture', slug: 'furniture', description: 'Indoor and outdoor furniture including desks, chairs, tables, beds, shelves, and patio furniture' },
            { name: 'Home & Kitchen Appliances', slug: 'home-appliances', description: 'Kitchen and household appliances including microwaves, blenders, coffee makers, refrigerators, and washing machines' },
            { name: 'Home Decor & Improvement', slug: 'home-decor-improvement', description: 'Home decorative items, tools, hardware, and improvement supplies' },
            
            // Real Estate
            { name: 'Housing & Real Estate', slug: 'housing-real-estate', description: 'Properties for sale or rent including apartments, houses, condos, rooms for rent, and commercial properties' },
            
            // Vehicle categories
            { name: 'Vehicles & Automotive', slug: 'vehicles-automotive', description: 'Cars, trucks, motorcycles, parts, accessories, and other automotive items' },
            { name: 'Bicycles', slug: 'bicycles', description: 'Bicycles, cycling gear, and related accessories' },
            
            // Personal items
            { name: 'Clothing & Shoes', slug: 'clothing-shoes', description: 'All types of apparel including shirts, pants, dresses, outerwear, shoes, and fashion accessories' },
            { name: 'Jewelry & Accessories', slug: 'jewelry-accessories', description: 'Jewelry, watches, handbags, purses, backpacks, and personal accessories' },
            { name: 'Health & Beauty', slug: 'health-beauty', description: 'Personal care items, beauty products, fitness equipment, and wellness items' },
            
            // Entertainment categories
            { name: 'Books & Media', slug: 'books-media', description: 'Books, textbooks, magazines, movies, music, and educational materials' },
            { name: 'Musical Instruments', slug: 'musical-instruments', description: 'Instruments and music gear including guitars, keyboards, percussion, and accessories' },
            
            // Sports and outdoors
            { name: 'Sports & Outdoor Gear', slug: 'sports-outdoors', description: 'Athletic equipment, outdoor recreation gear, camping supplies, and fitness accessories' },
            
            // Collectibles and hobbies
            { name: 'Toys, Games & Hobbies', slug: 'toys-games-hobbies', description: 'Toys, board games, puzzles, collectibles, and hobby supplies' },
            { name: 'Art & Collectibles', slug: 'art-collectibles', description: 'Artwork, antiques, collectibles, memorabilia, and unique items' },
            
            // Other important categories
            { name: 'Baby & Kids Items', slug: 'baby-kids', description: 'Products for babies, children, and parents including strollers, toys, clothing, and accessories' },
            { name: 'Pet Supplies', slug: 'pet-supplies', description: 'Items for pets including food bowls, beds, carriers, toys, and accessories' },
            
            // Catch-all category
            { name: 'Other', slug: 'other', description: 'Items that don\'t fit into other categories' }
        ];

        for (const category of categories) {
            await runAsync(
                'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
                [category.name, category.slug, category.description]
            );
        }

        console.log('Database initialized successfully with essential records!');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run the initialization function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase().then(() => {
        console.log('Database initialization complete');
        process.exit(0);
    }).catch(error => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });
} 