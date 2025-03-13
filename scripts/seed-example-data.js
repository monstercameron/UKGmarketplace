/**
 * @fileoverview Script to seed the database with example/demo data
 */

import { seedExampleData } from '../src/database/seed.js';

// Set environment variable to prevent database deletion
process.env.RESET_DB = 'false';

// Run the seed function
seedExampleData().then(() => {
    console.log('Example data seeding completed successfully');
    process.exit(0);
}).catch(error => {
    console.error('Example data seeding failed:', error);
    process.exit(1);
}); 