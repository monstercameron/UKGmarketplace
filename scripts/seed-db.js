/**
 * @fileoverview Script to seed the database without deleting existing data
 * @deprecated Use db:setup and db:seed separately instead
 */

import { seed } from '../src/database/seed.js';

// Set environment variable to prevent database deletion
process.env.RESET_DB = 'false';

// Display deprecation warning
console.log('\x1b[33m%s\x1b[0m', 'WARNING: This script is deprecated. Please use "npm run db:setup" followed by "npm run db:seed" instead.');

// Run the seed function
seed().then(() => {
    console.log('Database seeding completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('Database seeding failed:', error);
    process.exit(1);
}); 