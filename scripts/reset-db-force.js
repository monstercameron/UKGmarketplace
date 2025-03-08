/**
 * @fileoverview Script to forcefully kill Node.js processes and reset the database
 * WARNING: This will kill ALL Node.js processes running on your system
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { seed } from '../src/database/seed.js';

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
 * Kills all Node.js processes except the current one
 */
async function killNodeProcesses() {
    const currentPid = process.pid;
    console.log(`Current process ID: ${currentPid}`);
    
    try {
        if (process.platform === 'win32') {
            console.log('Killing all Node.js processes except the current one...');
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            
            // Parse the CSV output to get PIDs
            const lines = stdout.split('\n').filter(line => line.trim() !== '');
            const pids = [];
            
            // Skip the header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const match = line.match(/"node.exe","(\d+)"/);
                if (match && match[1]) {
                    const pid = parseInt(match[1], 10);
                    if (pid !== currentPid) {
                        pids.push(pid);
                    }
                }
            }
            
            // Kill each process
            for (const pid of pids) {
                try {
                    console.log(`Killing process with PID: ${pid}`);
                    await execAsync(`taskkill /F /PID ${pid}`);
                } catch (error) {
                    console.error(`Error killing process ${pid}:`, error.message);
                }
            }
            
            return pids.length > 0;
        } else if (process.platform === 'linux' || process.platform === 'darwin') {
            console.log('Killing all Node.js processes except the current one...');
            await execAsync(`pkill -f "node" -9 -n ${currentPid}`);
            return true;
        } else {
            console.log(`Unsupported platform: ${process.platform}`);
            return false;
        }
    } catch (error) {
        console.error('Error killing processes:', error.message);
        return false;
    }
}

/**
 * Deletes the database file
 */
function deleteDatabase() {
    try {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('Deleted existing database file for fresh start');
            return true;
        } else {
            console.log('No existing database file found');
            return true;
        }
    } catch (error) {
        console.error('Error deleting database file:', error.message);
        return false;
    }
}

/**
 * Main function to reset the database
 */
async function resetDatabase() {
    console.log('WARNING: This will kill ALL Node.js processes except this script!');
    console.log('Press Ctrl+C now if you want to cancel.');
    
    // Wait for 5 seconds to allow the user to cancel
    console.log('Continuing in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Kill all Node.js processes
    const killed = await killNodeProcesses();
    
    if (killed) {
        console.log('Waiting for processes to terminate...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Delete the database file
    const deleted = deleteDatabase();
    
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
resetDatabase(); 