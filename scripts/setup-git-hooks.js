/**
 * @fileoverview Script to set up Git hooks
 * 
 * This script sets up Git hooks, including a pre-commit hook to run the linter
 * before each commit.
 */

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import {execSync} from 'child_process';
import os from 'os';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Path to the Git hooks directory
const gitHooksDir = path.join(rootDir, '.git', 'hooks');

// Create the pre-commit hook
const preCommitHook = `#!/bin/sh
# Pre-commit hook to run the linter before each commit

# Get the list of staged JavaScript files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.js$')

if [ -n "$STAGED_FILES" ]; then
  echo "Running linter on staged JavaScript files..."
  
  # Run the linter on staged files
  npm run lint:backend
  
  # If the linter fails, abort the commit
  if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix the errors before committing."
    exit 1
  fi
fi

# If everything passes, proceed with the commit
exit 0
`;

// Create the pre-commit hook file
const preCommitHookPath = path.join(gitHooksDir, 'pre-commit');
fs.writeFileSync(preCommitHookPath, preCommitHook);

// Make the pre-commit hook executable
try {
  // Check if we're on Windows
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // On Windows, we don't need to make the file executable
    console.log('Pre-commit hook created (Windows detected, no need to make executable)');
  } else {
    // On Unix-like systems, make the file executable
    execSync(`chmod +x ${preCommitHookPath}`);
    console.log('Pre-commit hook created and made executable');
  }
} catch (error) {
  console.error('Failed to set up pre-commit hook:', error.message);
  
  if (os.platform() !== 'win32') {
    console.log('Please run the following command manually:');
    console.log(`chmod +x ${preCommitHookPath}`);
  }
}

console.log('Git hooks set up successfully'); 