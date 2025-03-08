/**
 * @fileoverview Script to help identify which process is locking the database file
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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
 * Finds processes that have the database file open
 */
async function findProcessesLockingDatabase() {
    console.log(`Looking for processes that have locked the database file: ${dbPath}`);
    
    try {
        if (process.platform === 'win32') {
            // On Windows, we can use the handle command if available
            try {
                const { stdout } = await execAsync(`handle "${dbPath}" 2>nul`);
                console.log('Processes that have the database file open:');
                console.log(stdout || 'No processes found or handle.exe not available');
                
                // Alternative approach using tasklist and findstr
                console.log('\nAlternative approach:');
                const { stdout: tasklistOutput } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO LIST');
                console.log('Node.js processes running:');
                console.log(tasklistOutput || 'No Node.js processes found');
            } catch (error) {
                console.log('Could not run handle command. You may need to install Sysinternals Handle utility.');
                console.log('Download from: https://docs.microsoft.com/en-us/sysinternals/downloads/handle');
                
                // Try the alternative approach
                try {
                    const { stdout: tasklistOutput } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO LIST');
                    console.log('Node.js processes running:');
                    console.log(tasklistOutput || 'No Node.js processes found');
                } catch (tasklistError) {
                    console.error('Error running tasklist:', tasklistError.message);
                }
            }
        } else if (process.platform === 'linux' || process.platform === 'darwin') {
            // On Linux/macOS, we can use lsof
            try {
                const { stdout } = await execAsync(`lsof "${dbPath}"`);
                console.log('Processes that have the database file open:');
                console.log(stdout || 'No processes found');
            } catch (error) {
                console.log('No processes found or lsof not available');
            }
        } else {
            console.log(`Unsupported platform: ${process.platform}`);
        }
        
        console.log('\nTo reset the database:');
        console.log('1. Identify the process that has the database file locked');
        console.log('2. Close that process or kill it using Task Manager (Windows) or kill command (Linux/macOS)');
        console.log('3. Run the database reset script again: npm run db:reset-safe');
    } catch (error) {
        console.error('Error finding processes:', error.message);
    }
}

// Run the main function
findProcessesLockingDatabase(); 