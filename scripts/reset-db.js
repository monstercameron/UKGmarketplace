/**
 * @fileoverview Script to reset the database and seed it again
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { seed } from '../src/database/seed.js';
import sqlite3 from 'sqlite3';

// Module path resolution for project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(projectRoot, '.env') });

/**
 * Path to SQLite database file in project root.
 * Uses DB_PATH from environment or defaults to 'database.sqlite' in root
 * @type {string}
 */
const dbPath = process.env.DB_PATH || join(projectRoot, 'database.sqlite');

console.log('Resetting database...');

// First, close any open connections to the database
let db = null;
try {
    // Open a connection to the database
    db = new sqlite3.Database(dbPath);
    
    // Close the connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database connection:', err);
        } else {
            console.log('Database connection closed');
            
            // Now try to delete the file
            try {
                if (fs.existsSync(dbPath)) {
                    fs.unlinkSync(dbPath);
                    console.log('Deleted existing database file for fresh start');
                    
                    // Force RESET_DB to true for this run
                    process.env.RESET_DB = 'true';
                    
                    // Run the seed function
                    console.log('Seeding database...');
                    seed().then(() => {
                        console.log('Database reset and seeding completed successfully');
                        process.exit(0);
                    }).catch(error => {
                        console.error('Database reset and seeding failed:', error);
                        process.exit(1);
                    });
                } else {
                    console.log('No existing database file found');
                    
                    // Force RESET_DB to true for this run
                    process.env.RESET_DB = 'true';
                    
                    // Run the seed function
                    console.log('Seeding database...');
                    seed().then(() => {
                        console.log('Database reset and seeding completed successfully');
                        process.exit(0);
                    }).catch(error => {
                        console.error('Database reset and seeding failed:', error);
                        process.exit(1);
                    });
                }
            } catch (error) {
                console.error('Error deleting database file:', error);
                console.log('The database file may be in use by another process.');
                console.log('Please close all applications that might be using the database and try again.');
                process.exit(1);
            }
        }
    });
} catch (error) {
    console.error('Error opening database connection:', error);
    process.exit(1);
} 