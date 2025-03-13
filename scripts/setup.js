#!/usr/bin/env node

/**
 * @fileoverview Setup script for UKG Classifieds
 * 
 * This script handles the complete setup process for the UKG Classifieds application:
 * 1. Install dependencies
 * 2. Build CSS
 * 3. Initialize the database
 * 4. Compress static files
 * 
 * Usage:
 *   node setup.js         - Full setup
 *   node setup.js --quick - Quick setup (skips full compression)
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const isQuickSetup = args.includes('--quick');

console.log('🚀 Starting UKG Classifieds setup process...');
console.log(`Mode: ${isQuickSetup ? 'Quick' : 'Full'}`);

// Helper function to run commands with a timeout
function runCommand(command, description, timeoutMs = 120000) {
  console.log(`\n📋 ${description}...`);
  console.log(`Running command: ${command}`);
  
  try {
    // Set a timeout to prevent hanging
    execSync(command, { 
      stdio: 'inherit', 
      cwd: rootDir,
      timeout: timeoutMs  // Default 2-minute timeout
    });
    console.log(`✅ ${description} completed successfully!`);
    return true;
  } catch (error) {
    if (error.signal === 'SIGTERM') {
      console.error(`❌ Command timed out after ${timeoutMs/1000} seconds: ${command}`);
    } else {
      console.error(`❌ Error during ${description.toLowerCase()}: ${error.message}`);
    }
    return false;
  }
}

// Execute a command with a callback to continue
function runCommandAsync(command, description, callback, timeoutMs = 120000) {
  console.log(`\n📋 ${description}...`);
  console.log(`Running command: ${command}`);
  
  let timeout = null;
  
  const process = exec(command, { cwd: rootDir });
  
  // Set timeout
  timeout = setTimeout(() => {
    console.error(`❌ Command timed out after ${timeoutMs/1000} seconds: ${command}`);
    process.kill();
    callback(false);
  }, timeoutMs);
  
  // Output streams
  process.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  process.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  process.on('close', (code) => {
    clearTimeout(timeout);
    const success = code === 0;
    if (success) {
      console.log(`✅ ${description} completed successfully!`);
    } else {
      console.error(`❌ Command failed with exit code ${code}: ${command}`);
    }
    callback(success);
  });
}

// Setup steps
async function setup() {
  console.log('Starting setup at:', new Date().toISOString());
  
  // 1. Check if node_modules exists to skip install if possible
  const nodeModulesExists = fs.existsSync(path.join(rootDir, 'node_modules'));
  let npmInstallSuccess = true;
  
  if (!nodeModulesExists) {
    // 1. Install dependencies
    npmInstallSuccess = runCommand('npm install', 'Installing dependencies', 300000); // 5 minute timeout
    if (!npmInstallSuccess) {
      console.error('Failed to install dependencies. Exiting setup process.');
      process.exit(1);
    }
  } else {
    console.log('⏩ node_modules already exists, skipping npm install');
  }

  // 2. Build CSS
  const buildCssSuccess = runCommand('npm run build:css', 'Building CSS', 60000);
  if (!buildCssSuccess) {
    console.error('Failed to build CSS. Exiting setup process.');
    process.exit(1);
  }

  // 3. Initialize the database
  const initDbSuccess = runCommand('npm run db:init', 'Initializing database', 60000);
  if (!initDbSuccess) {
    console.error('Failed to initialize database. Exiting setup process.');
    process.exit(1);
  }

  // For quick setup, use the test compression
  if (isQuickSetup) {
    console.log('\n\n==== Quick setup mode: Testing compression only ====');
    const testCompressSuccess = runCommand('npm run test:compress', 'Testing compression', 60000);
    if (!testCompressSuccess) {
      console.warn('⚠️ Warning: Compression test failed. Please check the compression script.');
    }
    
    console.log(`\n🎉 UKG Classifieds quick setup completed at: ${new Date().toISOString()}`);
    console.log('\nYou can now start the application with:');
    console.log('  - npm run dev       (Development mode with hot reload)');
    console.log('  - npm run dev:full  (Development mode with CSS watching)');
    console.log('  - npm start         (Production mode)');
    
    console.log('\n⚠️ Note: Quick setup skipped full compression.');
    console.log('To complete the full setup, run:');
    console.log('  - npm run compress:static     (Compress static files)');
    
    return;
  }

  // 4. Compress static files - using async to prevent freezing
  console.log('\n\n==== Starting static file compression (This may take a while) ====');
  return new Promise((resolve) => {
    runCommandAsync('npm run compress:static', 'Compressing static files', (compressSuccess) => {
      if (!compressSuccess) {
        console.warn('⚠️ Warning: Failed to compress static files.');
      }
      
      console.log(`\n🎉 UKG Classifieds setup completed at: ${new Date().toISOString()}`);
      console.log('\nYou can now start the application with:');
      console.log('  - npm run dev       (Development mode with hot reload)');
      console.log('  - npm run dev:full  (Development mode with CSS watching)');
      console.log('  - npm start         (Production mode)');
      
      resolve();
    }, 180000); // 3 minute timeout for compression
  });
}

// Run the setup
setup().catch(error => {
  console.error('Fatal error during setup:', error);
  process.exit(1);
}); 