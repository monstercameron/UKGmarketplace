import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { URL } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create cache directory structure
const CACHE_DIR = path.join(__dirname, '..', 'public', 'cache');
const CSS_CACHE_DIR = path.join(CACHE_DIR, 'css');
const JS_CACHE_DIR = path.join(CACHE_DIR, 'js');
const FONT_CACHE_DIR = path.join(CACHE_DIR, 'fonts');

// Resources to download
const resources = [
  { 
    url: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    localPath: path.join(CSS_CACHE_DIR, 'material-icons.css'),
    type: 'css'
  },
  { 
    url: 'https://unpkg.com/react@17/umd/react.production.min.js',
    localPath: path.join(JS_CACHE_DIR, 'react.production.min.js'),
    type: 'js'
  },
  { 
    url: 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js',
    localPath: path.join(JS_CACHE_DIR, 'react-dom.production.min.js'),
    type: 'js'
  },
  { 
    url: 'https://cdnjs.cloudflare.com/ajax/libs/htm/3.1.1/htm.js',
    localPath: path.join(JS_CACHE_DIR, 'htm.js'),
    type: 'js'
  },
  { 
    url: 'https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.6/marked.min.js',
    localPath: path.join(JS_CACHE_DIR, 'marked.min.js'),
    type: 'js'
  }
];

// Function to download a file
function downloadFile(url, targetPath, baseUrl = null) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${targetPath}`);
    
    // Handle relative URLs by joining with baseUrl
    let fullUrl = url;
    if (url.startsWith('/') && baseUrl) {
      try {
        const parsedBaseUrl = new URL(baseUrl);
        fullUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}${url}`;
        console.log(`Resolved relative URL to: ${fullUrl}`);
      } catch (error) {
        return reject(new Error(`Failed to resolve relative URL: ${url} with base: ${baseUrl}`));
      }
    }
    
    // Determine if we should use http or https
    const protocol = fullUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(fullUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to ${redirectUrl}`);
        return downloadFile(redirectUrl, targetPath, fullUrl).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${fullUrl}, status code: ${response.statusCode}`));
      }
      
      // For CSS files, we need to handle fonts and other resources
      if (fullUrl.includes('googleapis.com') && fullUrl.includes('css')) {
        let body = '';
        response.setEncoding('utf8');
        
        response.on('data', (chunk) => {
          body += chunk;
        });
        
        response.on('end', () => {
          // We'll need to download and cache font files referenced in the CSS
          // and update the CSS to point to our cached versions
          processCssAndDownloadFonts(body, targetPath, fullUrl).then(resolve).catch(reject);
        });
      } else {
        // For other files, just write to disk
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
      }
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.end();
  });
}

// Process CSS files to handle fonts and other resources
async function processCssAndDownloadFonts(cssContent, targetPath, baseUrl) {
  // This is a simplified version - in a real-world scenario, you'd need
  // a proper CSS parser to handle all edge cases
  
  // Extract font URLs
  const fontUrlRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
  let match;
  const fontUrls = [];
  
  while ((match = fontUrlRegex.exec(cssContent)) !== null) {
    const fontUrl = match[1];
    if (fontUrl.startsWith('http')) {
      fontUrls.push(fontUrl);
    } else if (fontUrl.startsWith('//')) {
      fontUrls.push(`https:${fontUrl}`);
    } else if (fontUrl.startsWith('/')) {
      // Handle relative URLs
      try {
        const parsedBaseUrl = new URL(baseUrl);
        fontUrls.push(`${parsedBaseUrl.protocol}//${parsedBaseUrl.host}${fontUrl}`);
      } catch (error) {
        console.error(`Failed to resolve relative font URL: ${fontUrl}`);
      }
    }
  }
  
  // Download all fonts
  console.log(`Found ${fontUrls.length} font URLs to download`);
  for (const fontUrl of fontUrls) {
    const fontFilename = fontUrl.split('/').pop().split('?')[0];
    const fontLocalPath = path.join(FONT_CACHE_DIR, fontFilename);
    
    // Replace URL in CSS
    cssContent = cssContent.replace(
      new RegExp(fontUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `/cache/fonts/${fontFilename}`
    );
    
    // Download the font
    await downloadFile(fontUrl, fontLocalPath);
  }
  
  // Write the updated CSS
  await fsPromises.writeFile(targetPath, cssContent, 'utf8');
}

// Update HTML to use local resources
async function updateHtml() {
  const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
  let htmlContent = await fsPromises.readFile(htmlPath, 'utf8');
  
  // Replace each URL with its local equivalent
  for (const resource of resources) {
    const escapedUrl = resource.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let localResourcePath = resource.localPath.split('public')[1].replace(/\\/g, '/');
    
    if (resource.type === 'css') {
      htmlContent = htmlContent.replace(
        new RegExp(`<link[^>]*href=["']${escapedUrl}["'][^>]*>`, 'g'),
        `<link href="${localResourcePath}" rel="stylesheet">`
      );
    } else if (resource.type === 'js') {
      htmlContent = htmlContent.replace(
        new RegExp(`<script[^>]*src=["']${escapedUrl}["'][^>]*></script>`, 'g'),
        `<script src="${localResourcePath}"></script>`
      );
    }
  }
  
  // Write the updated HTML
  await fsPromises.writeFile(htmlPath, htmlContent, 'utf8');
  console.log('Updated HTML to use local resources');
}

// Main function
async function main() {
  try {
    // Create cache directories if they don't exist
    await fsPromises.mkdir(CACHE_DIR, { recursive: true });
    await fsPromises.mkdir(CSS_CACHE_DIR, { recursive: true });
    await fsPromises.mkdir(JS_CACHE_DIR, { recursive: true });
    await fsPromises.mkdir(FONT_CACHE_DIR, { recursive: true });
    
    // Download all resources
    for (const resource of resources) {
      await downloadFile(resource.url, resource.localPath);
    }
    
    // Update HTML
    await updateHtml();
    
    console.log('All resources downloaded and cached successfully!');
  } catch (error) {
    console.error('Error caching resources:', error);
    process.exit(1);
  }
}

// Run the script
main(); 