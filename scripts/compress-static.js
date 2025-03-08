/**
 * @fileoverview Script to pre-compress static assets with gzip and brotli
 * 
 * This script walks through the public directory and creates compressed versions
 * of static assets that can be served directly by express-static-gzip middleware.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the public directory
const publicDir = path.join(__dirname, '..', 'public');

// File types to compress
const compressibleExtensions = [
  '.html', '.css', '.js', '.json', '.xml', '.svg', '.txt', '.map', '.ico'
];

// Compression options
const gzipOptions = { level: 9 }; // Maximum compression
const brotliOptions = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
  }
};

/**
 * Check if a file should be compressed based on its extension
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file should be compressed
 */
function shouldCompress(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return compressibleExtensions.includes(ext);
}

/**
 * Compress a file with gzip and brotli
 * @param {string} filePath - Path to the file to compress
 */
function compressFile(filePath) {
  if (!shouldCompress(filePath)) {
    return;
  }

  const fileContent = fs.readFileSync(filePath);
  
  // Create gzip version
  const gzipFilePath = `${filePath}.gz`;
  const gzipped = zlib.gzipSync(fileContent, gzipOptions);
  fs.writeFileSync(gzipFilePath, gzipped);
  console.log(`Created ${gzipFilePath}`);
  
  // Create brotli version
  const brotliFilePath = `${filePath}.br`;
  const brotlied = zlib.brotliCompressSync(fileContent, brotliOptions);
  fs.writeFileSync(brotliFilePath, brotlied);
  console.log(`Created ${brotliFilePath}`);
}

/**
 * Walk through a directory and process all files
 * @param {string} dir - Directory to walk through
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath); // Recursively process subdirectories
    } else {
      compressFile(filePath);
    }
  });
}

// Start the compression process
console.log('Starting static asset compression...');
walkDir(publicDir);
console.log('Compression complete!'); 