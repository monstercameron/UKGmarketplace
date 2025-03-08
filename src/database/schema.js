/**
 * @fileoverview Database schema and initialization module for SQLite database.
 * @module database/schema
 * 
 * Defines and manages the database structure including:
 * - Table definitions and relationships
 * - Default data initialization
 * - Database connection management
 * - Utility functions for database operations
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs';

// Module path resolution for project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Load environment variables
dotenv.config({ path: join(projectRoot, '.env') });

/**
 * Path to SQLite database file in project root.
 * Uses DB_PATH from environment or defaults to 'database.sqlite' in root
 * @type {string}
 */
const dbPath = process.env.DB_PATH || join(projectRoot, 'database.sqlite');

// In development mode, delete the database file if it exists AND RESET_DB is true
if (process.env.NODE_ENV === 'development' && process.env.RESET_DB === 'true') {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('Deleted existing database file for fresh start');
        }
    } catch (error) {
        console.error('Error deleting database file:', error);
    }
}

/**
 * SQLite database instance.
 * Automatically initializes tables on successful connection.
 * @type {sqlite3.Database}
 */
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeTables();
    }
});

/**
 * Promisified database operations for async/await support
 * @type {Function} runAsync - Execute SQL statements
 * @type {Function} allAsync - Fetch all rows
 * @type {Function} getAsync - Fetch single row
 */
const runAsyncBase = promisify(db.run.bind(db));
const allAsyncBase = promisify(db.all.bind(db));
const getAsyncBase = promisify(db.get.bind(db));

/**
 * Enhanced runAsync with logging
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const runAsync = async (sql, params) => {
    try {
        // For INSERT statements, we need to get the last inserted ID
        const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
        
        if (isInsert) {
            return new Promise((resolve, reject) => {
                // Use run with a callback to get the lastID
                db.run(sql, params, function(err) {
                    if (err) {
                        console.error('SQL error in runAsync (insert):', err);
                        reject(err);
                    } else {
                        // this.lastID contains the ID of the last inserted row
                        const result = { 
                            insertId: this.lastID,
                            changes: this.changes 
                        };
                        resolve(result);
                    }
                });
            });
        } else {
            // For non-INSERT statements, use the promisified version
            return await runAsyncBase(sql, params);
        }
    } catch (err) {
        console.error('SQL error in runAsync:', err);
        throw err;
    }
};

/**
 * Enhanced allAsync with logging
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
const allAsync = async (sql, params) => {
    try {
        return await allAsyncBase(sql, params);
    } catch (err) {
        console.error('SQL error in allAsync:', err);
        throw err;
    }
};

/**
 * Enhanced getAsync with logging
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const getAsync = async (sql, params) => {
    try {
        return await getAsyncBase(sql, params);
    } catch (err) {
        console.error('SQL error in getAsync:', err);
        throw err;
    }
};

/**
 * Generates a secure random key for item management
 * @returns {string} 64-character hexadecimal string
 */
const generateManagementKey = () => crypto.randomBytes(32).toString('hex');

/**
 * Initializes database tables and default data.
 * Creates the following structure:
 * - Categories (hierarchical structure)
 * - Users (authentication and profiles)
 * - Items (marketplace listings)
 * - Item Images (listing photos)
 * - Payment Methods (available payment options)
 * - Item Payment Methods (payment options per item)
 * - Favorites (user item bookmarks)
 * - Messages (user communication)
 * - Reports (content moderation)
 * 
 * @async
 * @private
 * @returns {Promise<void>} Promise that resolves when tables are initialized
 */
async function initializeTables() {
    try {
        await db.serialize(async () => {
            // Categories: Hierarchical category structure
            await runAsync(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,        -- URL-friendly identifier
                parent_id INTEGER,                -- Self-referential hierarchy
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(parent_id) REFERENCES categories(id)
            )`);

            // Users: Authentication and profiles
            await runAsync(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,    -- Display name
                email TEXT UNIQUE NOT NULL,       -- Login identifier
                password_hash TEXT NOT NULL,      -- Secure password storage
                phone TEXT,                       -- Optional contact
                location TEXT,                    -- Optional location
                is_verified BOOLEAN DEFAULT 0,    -- Email verification status
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )`);

            // Items: Marketplace listings
            await runAsync(`CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                category_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                status TEXT CHECK(status IN ('available', 'pending', 'sold', 'reserved')) DEFAULT 'available',
                condition TEXT CHECK(condition IN ('new', 'like_new', 'good', 'fair', 'poor')) NOT NULL,
                location TEXT,
                shipping TEXT,                    -- JSON string of shipping options
                negotiable BOOLEAN DEFAULT 0,     -- Whether price is negotiable
                email TEXT,                       -- Contact email
                phone TEXT,                       -- Contact phone
                teams_link TEXT,                  -- Microsoft Teams link
                views INTEGER DEFAULT 0,          -- View counter
                sold BOOLEAN DEFAULT 0,           -- Whether item is sold
                management_key TEXT UNIQUE NOT NULL,  -- Secure edit key
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,              -- Optional expiration
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(category_id) REFERENCES categories(id)
            )`);

            // Item Images: Multiple images per listing
            await runAsync(`CREATE TABLE IF NOT EXISTS item_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                url TEXT NOT NULL,                -- Image storage URL
                filename TEXT NOT NULL,           -- Original filename
                hash_filename TEXT NOT NULL,      -- Hashed filename stored on disk
                mime_type TEXT NOT NULL,          -- MIME type of the image
                file_size INTEGER NOT NULL,       -- File size in bytes
                width INTEGER,                    -- Image width in pixels
                height INTEGER,                   -- Image height in pixels
                display_order INTEGER DEFAULT 0,  -- Order for display (for reordering)
                is_primary BOOLEAN DEFAULT 0,     -- Main image flag
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
            )`);

            // Payment Methods: Available payment options
            await runAsync(`CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,        -- URL-friendly identifier
                description TEXT,
                is_active BOOLEAN DEFAULT 1,      -- Availability flag
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Item Payment Methods: Payment options per listing
            await runAsync(`CREATE TABLE IF NOT EXISTS item_payment_methods (
                item_id INTEGER NOT NULL,
                payment_method_id INTEGER NOT NULL,
                PRIMARY KEY(item_id, payment_method_id),
                FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY(payment_method_id) REFERENCES payment_methods(id)
            )`);

            // Favorites: User item bookmarks
            await runAsync(`CREATE TABLE IF NOT EXISTS favorites (
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY(user_id, item_id),    -- Prevent duplicate favorites
                FOREIGN KEY(item_id) REFERENCES items(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            // Messages: User communication
            await runAsync(`CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                item_id INTEGER,                  -- Optional item reference
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT 0,        -- Message status
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(sender_id) REFERENCES users(id),
                FOREIGN KEY(receiver_id) REFERENCES users(id),
                FOREIGN KEY(item_id) REFERENCES items(id)
            )`);

            // Reports: Content moderation
            await runAsync(`CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reporter_id INTEGER NOT NULL,
                item_id INTEGER,                  -- Optional item reference
                user_id INTEGER,                  -- Optional user reference
                reason TEXT NOT NULL,
                description TEXT,
                status TEXT CHECK(status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(reporter_id) REFERENCES users(id),
                FOREIGN KEY(item_id) REFERENCES items(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            // Note: All test data and default values are now handled by the seed.js file
        });
    } catch (error) {
        console.error('Error initializing tables:', error);
    }
}

// Export a promise that resolves when tables are initialized
export const tablesInitialized = new Promise((resolve, reject) => {
    db.serialize(() => {
        initializeTables()
            .then(() => {
                console.log('Database tables initialized');
                resolve();
            })
            .catch(err => {
                console.error('Error initializing tables:', err);
                reject(err);
            });
    });
});

// Export database and utility functions
export { db, runAsync, allAsync, getAsync, generateManagementKey }; 