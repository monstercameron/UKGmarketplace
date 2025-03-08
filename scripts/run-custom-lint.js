/**
 * @fileoverview Script to run all custom ESLint rules
 */

import { ESLint } from 'eslint';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Directories to lint
const dirsToLint = [
  'src/api',
  'src/database',
  'src/utils',
  'scripts',
  'server.js',
];

// Load custom rules
const basicRules = require('../config/eslint-basic-rules.js');
const asyncErrorRule = require('./eslint-async-error-rule.js');
const namingRule = require('./eslint-naming-rule.js');
const jsdocRule = require('./eslint-jsdoc-rule.js');

// Create ESLint instance with custom configuration
const eslint = new ESLint({
  fix: process.argv.includes('--fix'),
  extensions: ['.js'],
  useEslintrc: false, // Don't use .eslintrc files
  baseConfig: {
    ...basicRules,
    plugins: [
      'custom-rules'
    ],
    rules: {
      ...basicRules.rules,
      'custom-rules/async-error': 'warn',
      'custom-rules/naming-convention': 'warn',
      'custom-rules/jsdoc': 'warn'
    }
  },
  plugins: {
    'custom-rules': {
      rules: {
        'async-error': asyncErrorRule,
        'naming-convention': namingRule,
        'jsdoc': jsdocRule
      }
    }
  }
});

async function main() {
  console.log('Running custom ESLint rules...');
  
  // Get all files to lint
  const filesToLint = [];
  
  for (const dir of dirsToLint) {
    const dirPath = join(rootDir, dir);
    
    try {
      // Check if it's a directory or a file
      const stats = fs.statSync(dirPath);
      
      if (stats.isDirectory()) {
        // Get all .js files in the directory
        const results = await eslint.lintFiles([`${dirPath}/**/*.js`]);
        filesToLint.push(...results);
      } else if (stats.isFile() && dir.endsWith('.js')) {
        // Lint the file directly
        const results = await eslint.lintFiles([dirPath]);
        filesToLint.push(...results);
      }
    } catch (error) {
      console.error(`Error processing ${dirPath}:`, error);
    }
  }
  
  // Format the results
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(filesToLint);
  
  // Output the results
  console.log(resultText);
  
  // Check if there are any errors
  const errorCount = filesToLint.reduce((count, result) => count + result.errorCount, 0);
  const warningCount = filesToLint.reduce((count, result) => count + result.warningCount, 0);
  
  console.log(`Linting complete: ${errorCount} errors, ${warningCount} warnings`);
  
  // Apply fixes if --fix flag is provided
  if (process.argv.includes('--fix')) {
    console.log('Applying fixes...');
    await ESLint.outputFixes(filesToLint);
    console.log('Fixes applied');
  }
  
  // Exit with error code if there are errors
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error running linter:', error);
  process.exit(1);
}); 