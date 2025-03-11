/**
 * Helper script to find local IP address for RSS feed configuration
 * Run with: node src/utils/get-ip.js
 */

import { getLocalIp, printAllNetworkInterfaces } from './getLocalIp.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const localIp = getLocalIp();
const port = process.env.PORT || 3001;

console.log('\n=== UKG Marketplace IP Configuration Helper ===\n');
console.log(`Local network IP: ${localIp || 'Not found'}`);
console.log(`Current PORT: ${port}`);
console.log(`\nRecommended HOST_URL setting for .env file:`);
console.log(`HOST_URL=http://${localIp}:${port}`);
console.log('\nUpdate this value in your .env file to enable proper RSS feed links.\n');

// Show all interfaces if requested
if (process.argv.includes('--all')) {
  console.log('\nAll network interfaces:');
  printAllNetworkInterfaces();
}

console.log('\nTo see all network interfaces, run: node src/utils/get-ip.js --all');
console.log('After updating .env, restart the server for changes to take effect.\n'); 