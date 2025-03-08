/**
 * @fileoverview A more robust script to reset the database and seed it again
 * This script uses a different approach to handle file locks
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { seed } from '../src/database/seed.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

/**
 * Attempts to delete the database file
 * @returns {Promise<boolean>} Whether the file was successfully deleted
 */
async function deleteDatabase() {
    try {
        // Check if the file exists
        if (fs.existsSync(dbPath)) {
            // On Windows, try to close any open handles to the file
            if (process.platform === 'win32') {
                try {
                    // This will list processes that have the file open
                    await execAsync(`handle "${dbPath}" 2>nul`);
                    console.log('Warning: The database file may be in use by another process.');
                    console.log('Please close all applications that might be using the database.');
                } catch (error) {
                    // handle.exe not found or no processes have the file open, which is fine
                }
            }

            // Try to delete the file
            fs.unlinkSync(dbPath);
            console.log('Deleted existing database file for fresh start');
            return true;
        } else {
            console.log('No existing database file found');
            return true;
        }
    } catch (error) {
        console.error('Error deleting database file:', error.message);
        console.log('The database file may be in use by another process.');
        console.log('Please close all applications that might be using the database and try again.');
        
        // If we're on Windows, suggest using Task Manager
        if (process.platform === 'win32') {
            console.log('You can use Task Manager to find and close processes that might be using the database.');
        }
        
        return false;
    }
}

/**
 * Main function to reset and seed the database
 */
async function resetAndSeedDatabase() {
    console.log('Resetting database...');
    
    // Try to delete the database file
    const deleted = await deleteDatabase();
    
    if (deleted) {
        // Force RESET_DB to true for this run
        process.env.RESET_DB = 'true';
        
        // Run the seed function
        console.log('Seeding database...');
        try {
            await seed();
            console.log('Database reset and seeding completed successfully');
            process.exit(0);
        } catch (error) {
            console.error('Database reset and seeding failed:', error);
            process.exit(1);
        }
    } else {
        process.exit(1);
    }
}

// Run the main function
resetAndSeedDatabase(); 