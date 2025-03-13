/**
 * @fileoverview Script to pre-compress static assets with gzip and brotli
 * 
 * This script walks through the public directory and creates compressed versions
 * of static assets that can be served directly by express-static-gzip middleware.
 * 
 * It specifically handles files in the public and public/cache directories.
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
const cacheDir = path.join(publicDir, 'cache');

// File types to compress
const compressibleExtensions = [
  '.html', '.css', '.js', '.json', '.xml', '.svg', '.txt', '.map', '.ico', 
  '.woff', '.woff2', '.ttf', '.otf', '.eot' // Add font file types
];

// Compression options
const gzipOptions = { level: 9 }; // Maximum compression
const brotliOptions = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
  }
};

// Stats tracking
let stats = {
  totalFiles: 0,
  compressedFiles: 0,
  skippedFiles: 0,
  errorFiles: 0,
  startTime: Date.now()
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
 * Check if a file already has compressed versions
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file already has compressed versions
 */
function hasCompressedVersions(filePath) {
  return fs.existsSync(`${filePath}.gz`) && fs.existsSync(`${filePath}.br`);
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Compress a file with gzip and brotli
 * @param {string} filePath - Path to the file to compress
 */
function compressFile(filePath) {
  stats.totalFiles++;

  if (!shouldCompress(filePath)) {
    stats.skippedFiles++;
    return;
  }

  // Check if compressed versions already exist
  if (hasCompressedVersions(filePath)) {
    stats.skippedFiles++;
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const fileSize = Buffer.byteLength(fileContent);
    
    // Create gzip version
    const gzipFilePath = `${filePath}.gz`;
    const gzipped = zlib.gzipSync(fileContent, gzipOptions);
    fs.writeFileSync(gzipFilePath, gzipped);
    
    // Create brotli version
    const brotliFilePath = `${filePath}.br`;
    const brotlied = zlib.brotliCompressSync(fileContent, brotliOptions);
    fs.writeFileSync(brotliFilePath, brotlied);
    
    const gzipSize = Buffer.byteLength(gzipped);
    const brotliSize = Buffer.byteLength(brotlied);
    
    console.log(`Compressed ${path.relative(path.join(__dirname, '..'), filePath)}`);
    console.log(`  Original: ${formatFileSize(fileSize)}, Gzip: ${formatFileSize(gzipSize)} (${Math.round((gzipSize/fileSize)*100)}%), Brotli: ${formatFileSize(brotliSize)} (${Math.round((brotliSize/fileSize)*100)}%)`);
    
    stats.compressedFiles++;
  } catch (error) {
    console.error(`Error compressing ${filePath}: ${error.message}`);
    stats.errorFiles++;
  }
}

/**
 * Process a batch of files for compression
 * @param {Array<string>} filePaths - Array of file paths to compress
 */
function processBatch(filePaths) {
  for (const filePath of filePaths) {
    compressFile(filePath);
  }
}

/**
 * Walk through a directory and collect all files
 * @param {string} dir - Directory to walk through
 * @param {Array<string>} allFiles - Array to collect file paths
 */
function collectFiles(dir, allFiles = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        collectFiles(filePath, allFiles); // Recursively process subdirectories
      } else {
        allFiles.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}: ${error.message}`);
  }
  
  return allFiles;
}

/**
 * Print stats about the compression process
 */
function printStats() {
  const duration = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n===== Compression Stats =====');
  console.log(`Total files processed: ${stats.totalFiles}`);
  console.log(`Files compressed: ${stats.compressedFiles}`);
  console.log(`Files skipped (not compressible or already compressed): ${stats.skippedFiles}`);
  console.log(`Files with errors: ${stats.errorFiles}`);
  console.log(`Time taken: ${duration.toFixed(2)} seconds`);
  console.log('=============================');
}

// Start the compression process
console.log('Starting static asset compression...');
console.log(`Start time: ${new Date().toISOString()}`);
stats.startTime = Date.now();

// Collect files from public directory
console.log('Collecting files from public directory...');
const publicFiles = collectFiles(publicDir);

// Process files in batches for better performance and to avoid memory issues
const BATCH_SIZE = 50;
for (let i = 0; i < publicFiles.length; i += BATCH_SIZE) {
  const batch = publicFiles.slice(i, i + BATCH_SIZE);
  processBatch(batch);
  
  // Progress update
  if (i + BATCH_SIZE < publicFiles.length) {
    console.log(`Progress: Processed ${i + BATCH_SIZE}/${publicFiles.length} files (${Math.round(((i + BATCH_SIZE) / publicFiles.length) * 100)}%)`);
  }
}

// Print final stats
printStats();
console.log(`End time: ${new Date().toISOString()}`);
console.log('Compression complete!'); 