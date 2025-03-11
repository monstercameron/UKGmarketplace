import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Font URL and target path
const FONT_URL = 'https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf';
const FONT_CACHE_DIR = path.join(__dirname, '..', 'public', 'cache', 'fonts');
const FONT_LOCAL_PATH = path.join(FONT_CACHE_DIR, 'flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf');

// Function to download a file
function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${targetPath}`);
    
    // Use https for downloading
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}, status code: ${response.statusCode}`));
      }
      
      // Write to disk
      const fileStream = fs.createWriteStream(targetPath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on('error', (err) => {
        fsPromises.unlink(targetPath).catch(() => {}); // Clean up
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.end();
  });
}

// Main function
async function main() {
  try {
    // Create fonts directory if it doesn't exist
    await fsPromises.mkdir(FONT_CACHE_DIR, { recursive: true });
    
    // Download the font file
    await downloadFile(FONT_URL, FONT_LOCAL_PATH);
    
    console.log('Material Icons font downloaded successfully!');
  } catch (error) {
    console.error('Error downloading font:', error);
    process.exit(1);
  }
}

// Run the script
main(); 