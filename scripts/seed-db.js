/**
 * @fileoverview Script to seed the database without deleting existing data
 */

import { seed } from '../src/database/seed.js';

// Set environment variable to prevent database deletion
process.env.RESET_DB = 'false';

// Run the seed function
seed().then(() => {
    console.log('Database seeding completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('Database seeding failed:', error);
    process.exit(1);
}); 