#!/usr/bin/env node

/**
 * @fileoverview Simplified test script for compression
 * 
 * This script tests compression on a minimal set of files to verify functionality.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Path to the public directory
const publicDir = path.join(rootDir, 'public');
const cacheDir = path.join(publicDir, 'cache');

// Compression options
const gzipOptions = { level: 9 }; // Maximum compression
const brotliOptions = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
  }
};

console.log('Starting test compression...');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`Public directory: ${publicDir}`);
console.log(`Cache directory: ${cacheDir}`);

// Test a single file compression
function testCompressFile(filePath) {
  console.log(`Testing compression on: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }
    
    const fileContent = fs.readFileSync(filePath);
    const fileSize = Buffer.byteLength(fileContent);
    console.log(`Original file size: ${fileSize} bytes`);
    
    // Create gzip version
    const gzipFilePath = `${filePath}.test.gz`;
    console.log(`Creating gzip file: ${gzipFilePath}`);
    const gzipped = zlib.gzipSync(fileContent, gzipOptions);
    fs.writeFileSync(gzipFilePath, gzipped);
    console.log(`Gzip file created, size: ${Buffer.byteLength(gzipped)} bytes`);
    
    // Create brotli version
    const brotliFilePath = `${filePath}.test.br`;
    console.log(`Creating brotli file: ${brotliFilePath}`);
    const brotlied = zlib.brotliCompressSync(fileContent, brotliOptions);
    fs.writeFileSync(brotliFilePath, brotlied);
    console.log(`Brotli file created, size: ${Buffer.byteLength(brotlied)} bytes`);
    
    // Clean up test files
    fs.unlinkSync(gzipFilePath);
    fs.unlinkSync(brotliFilePath);
    console.log('Test files cleaned up');
    
    return true;
  } catch (error) {
    console.error(`Error during test compression: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Test public directory exists
if (!fs.existsSync(publicDir)) {
  console.error(`Public directory not found: ${publicDir}`);
  process.exit(1);
}

// Find a test file in public directory
const publicFiles = fs.readdirSync(publicDir);
let testFile = null;

for (const file of publicFiles) {
  const filePath = path.join(publicDir, file);
  if (fs.statSync(filePath).isFile() && ['.html', '.css', '.js'].includes(path.extname(filePath).toLowerCase())) {
    testFile = filePath;
    break;
  }
}

if (testFile) {
  console.log(`Found test file: ${testFile}`);
  const success = testCompressFile(testFile);
  if (success) {
    console.log('✅ Test compression successful!');
  } else {
    console.error('❌ Test compression failed!');
    process.exit(1);
  }
} else {
  console.error('No suitable test file found in public directory');
  process.exit(1);
}

// Test cache directory if it exists
if (fs.existsSync(cacheDir)) {
  console.log('\nTesting cache directory...');
  
  // Check if we can list the cache directory
  try {
    console.log('Cache directory contents:');
    const cacheContents = fs.readdirSync(cacheDir);
    cacheContents.forEach(item => {
      const itemPath = path.join(cacheDir, item);
      const stat = fs.statSync(itemPath);
      console.log(`- ${item} (${stat.isDirectory() ? 'directory' : 'file'})`);
    });
    
    // Find a test file in cache directory or its subdirectories
    let cacheTestFile = null;
    
    function findTestFile(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isFile() && ['.css', '.js'].includes(path.extname(itemPath).toLowerCase())) {
          return itemPath;
        } else if (stat.isDirectory()) {
          const found = findTestFile(itemPath);
          if (found) return found;
        }
      }
      
      return null;
    }
    
    cacheTestFile = findTestFile(cacheDir);
    
    if (cacheTestFile) {
      console.log(`\nFound cache test file: ${cacheTestFile}`);
      const success = testCompressFile(cacheTestFile);
      if (success) {
        console.log('✅ Cache test compression successful!');
      } else {
        console.error('❌ Cache test compression failed!');
      }
    } else {
      console.warn('No suitable test file found in cache directory');
    }
  } catch (error) {
    console.error(`Error accessing cache directory: ${error.message}`);
  }
} else {
  console.warn(`Cache directory not found: ${cacheDir}`);
}

console.log('\nCompression test complete!'); 