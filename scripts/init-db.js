/**
 * @fileoverview Script to initialize the database with essential records
 */

import { initializeDatabase } from '../src/database/init-db.js';

// Set environment variable to prevent database deletion
process.env.RESET_DB = 'false';

// Run the initialization function
initializeDatabase().then(() => {
    console.log('Database initialization completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
}); 