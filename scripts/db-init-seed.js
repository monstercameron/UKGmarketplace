/**
 * Database initialization and seeding script
 * 
 * This script initializes the database tables and seeds them with test data.
 * It can be used to set up a fresh database for development or testing.
 */

import { db } from '../src/database/schema.js';
import { seed } from '../src/database/seed.js';

console.log('Starting database initialization and seeding...');

// Wait for database to be ready
setTimeout(async () => {
  try {
    // Seed the database with test data
    console.log('Starting data seeding...');
    await seed();
    console.log('Database initialization and seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization and seeding:', error);
    process.exit(1);
  }
}, 2000); // Wait 2 seconds for tables to initialize 