/**
 * @fileoverview Script to check server files for logger usage and Go-style error handling
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Directories to check
const dirsToCheck = [
  'src/api',
  'src/database',
  'src/utils',
  'scripts',
  'server.js',
];

// Function to check if a file uses the logger module
function checkLoggerUsage(filePath) {
  try {
    // Skip test files
    if (filePath.includes('test-') || filePath.includes('test/') || filePath.includes('tests/')) {
      return {
        file: filePath,
        hasLoggerImport: true,
        hasConsoleUsage: false,
        isValid: true
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports the logger
    const hasLoggerImport = /import.*\{.*logger.*\}.*from.*['"].*logger\.js['"]/.test(content) || 
                           /import.*\{.*logger.*\}.*from.*['"].*utils\/logger['"]/.test(content);
    
    // Check if the file uses console directly
    const hasConsoleUsage = /console\.(log|error|warn|info|debug)\(/.test(content);
    
    // Return results
    return {
      file: filePath,
      hasLoggerImport,
      hasConsoleUsage,
      isValid: hasLoggerImport && !hasConsoleUsage
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return {
      file: filePath,
      hasLoggerImport: false,
      hasConsoleUsage: false,
      isValid: false,
      error: error.message
    };
  }
}

// Function to check if a file follows Go-style error handling
function checkGoStyleErrorHandling(filePath) {
  try {
    // Skip test files
    if (filePath.includes('test-') || filePath.includes('test/') || filePath.includes('tests/')) {
      return {
        file: filePath,
        violations: [],
        isValid: true
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // List of functions that should return a Result tuple
    const resultFunctions = [
      'handle',
      'Result',
      'validate',
      'validateAsync',
      'httpError',
      'findItemById',
      'findItemsByCategory',
      'searchItems',
      'updateItem',
      'deleteItem',
      'addItemImage',
      'removeItemImage',
      'incrementItemViews',
      'reportItem',
      'addSubscriber',
      'addWatcher',
      'findWatchers',
      'findAllItems',
      'validateManagementKey',
      'countItems',
      'updateItemSoldStatus',
      'countItemsByCategory',
      'countItemsBySearch',
      'getAllItems',
      'createItem',
      'createCategory',
      'findCategoryById',
      'findAllCategories',
      'getCategoryTree',
      'createUser',
      'findUserByEmail',
      'sendMessage'
    ];
    
    // Find all function calls that should follow Go-style error handling
    const violations = [];
    
    // Check for await expressions without proper destructuring
    const awaitRegex = new RegExp(`await\\s+(${resultFunctions.join('|')})\\s*\\(`, 'g');
    let match;
    while ((match = awaitRegex.exec(content)) !== null) {
      // Check if the await expression is part of a destructuring assignment
      const functionName = match[1];
      const pos = match.index;
      
      // Look for a destructuring assignment before this position
      const beforeText = content.substring(Math.max(0, pos - 50), pos);
      if (!beforeText.includes('const [') && !beforeText.includes('let [')) {
        violations.push({
          functionName,
          position: pos,
          message: `Function '${functionName}' should be used with Go-style error handling: const [result, error] = await ${functionName}(...)`
        });
      }
    }
    
    // Check for direct function calls without proper destructuring
    const directCallRegex = new RegExp(`(?<!await\\s+)(${resultFunctions.join('|')})\\s*\\(`, 'g');
    while ((match = directCallRegex.exec(content)) !== null) {
      // Check if the function call is part of a destructuring assignment
      const functionName = match[1];
      const pos = match.index;
      
      // Look for a destructuring assignment before this position
      const beforeText = content.substring(Math.max(0, pos - 50), pos);
      if (!beforeText.includes('const [') && !beforeText.includes('let [')) {
        violations.push({
          functionName,
          position: pos,
          message: `Function '${functionName}' should be used with Go-style error handling: const [result, error] = ${functionName}(...)`
        });
      }
    }
    
    return {
      file: filePath,
      violations,
      isValid: violations.length === 0
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return {
      file: filePath,
      violations: [],
      isValid: false,
      error: error.message
    };
  }
}

// Function to recursively get all JS files in a directory
function getJsFiles(dirPath) {
  const files = [];
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (item !== 'node_modules' && item !== '.git') {
        files.push(...getJsFiles(itemPath));
      }
    } else if (stats.isFile() && item.endsWith('.js')) {
      files.push(itemPath);
    }
  }
  
  return files;
}

// Main function
async function main() {
  console.log('Checking server files for logger usage and Go-style error handling...');
  
  const filesToCheck = [];
  
  // Collect all files to check
  for (const dir of dirsToCheck) {
    const dirPath = join(rootDir, dir);
    
    try {
      // Check if it's a directory or a file
      const stats = fs.statSync(dirPath);
      
      if (stats.isDirectory()) {
        // Get all .js files in the directory
        const jsFiles = getJsFiles(dirPath);
        filesToCheck.push(...jsFiles);
      } else if (stats.isFile() && dir.endsWith('.js')) {
        // Add the file directly
        filesToCheck.push(dirPath);
      }
    } catch (error) {
      console.error(`Error processing ${dirPath}:`, error);
    }
  }
  
  // Check each file for logger usage
  const loggerResults = [];
  
  for (const file of filesToCheck) {
    const result = checkLoggerUsage(file);
    loggerResults.push(result);
  }
  
  // Filter out files that don't comply with logger usage rule
  const nonCompliantLoggerFiles = loggerResults.filter(result => !result.isValid);
  
  // Check each file for Go-style error handling
  const goStyleResults = [];
  
  for (const file of filesToCheck) {
    const result = checkGoStyleErrorHandling(file);
    goStyleResults.push(result);
  }
  
  // Filter out files that don't comply with Go-style error handling rule
  const nonCompliantGoStyleFiles = goStyleResults.filter(result => !result.isValid);
  
  // Output results
  let hasErrors = false;
  
  if (nonCompliantLoggerFiles.length > 0) {
    console.log('\nThe following files do not comply with the logger usage rule:');
    
    for (const file of nonCompliantLoggerFiles) {
      const relativePath = path.relative(rootDir, file.file);
      console.log(`\n${relativePath}:`);
      
      if (!file.hasLoggerImport) {
        console.log('  - Missing logger import. Add: import { logger } from \'../path/to/utils/logger.js\';');
      }
      
      if (file.hasConsoleUsage) {
        console.log('  - Uses console directly. Replace with logger methods.');
      }
      
      if (file.error) {
        console.log(`  - Error: ${file.error}`);
      }
    }
    
    console.log(`\nLinting complete: ${nonCompliantLoggerFiles.length} files do not comply with logger usage rules.`);
    hasErrors = true;
  }
  
  if (nonCompliantGoStyleFiles.length > 0) {
    console.log('\nThe following files do not comply with the Go-style error handling rule:');
    
    for (const file of nonCompliantGoStyleFiles) {
      const relativePath = path.relative(rootDir, file.file);
      console.log(`\n${relativePath}:`);
      
      for (const violation of file.violations) {
        console.log(`  - ${violation.message}`);
      }
      
      if (file.error) {
        console.log(`  - Error: ${file.error}`);
      }
    }
    
    console.log(`\nLinting complete: ${nonCompliantGoStyleFiles.length} files do not comply with Go-style error handling rules.`);
    hasErrors = true;
  }
  
  if (!hasErrors) {
    console.log('\nAll server files comply with logger usage and Go-style error handling rules.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running linter:', error);
  process.exit(1);
}); 