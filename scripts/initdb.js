/**
 * Database initialization script
 * This script runs the schema and seed scripts in the correct order
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initializeDatabase() {
  try {
    console.log('Creating database schema...');
    await execAsync('node src/database/schema.js');
    
    // Wait for 2 seconds to ensure schema is fully initialized
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Seeding database...');
    await execAsync('node src/database/seed.js');
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initializeDatabase(); 