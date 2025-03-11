/**
 * Utility to find the local network IP address
 * Can be used to get the proper IP to use in the .env file HOST_URL
 */

import os from 'os';

/**
 * Get the local network IP address (non-localhost)
 * @returns {string|null} The local IP address or null if not found
 */
export const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  
  // Loop through all network interfaces
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    
    // Find IPv4 non-internal addresses
    for (const iface of interfaces) {
      // Skip internal/localhost addresses and IPv6
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null; // No suitable IP found
};

/**
 * Print all available network interfaces and their IP addresses
 */
export const printAllNetworkInterfaces = () => {
  const networkInterfaces = os.networkInterfaces();
  console.log('Available network interfaces:');
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    console.log(`\nInterface: ${interfaceName}`);
    
    for (const iface of interfaces) {
      console.log(`  Address: ${iface.address}`);
      console.log(`  Family: ${iface.family}`);
      console.log(`  Internal: ${iface.internal}`);
      console.log('  ---');
    }
  }
};

// Show information if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const localIp = getLocalIp();
  console.log(`Local network IP: ${localIp || 'Not found'}`);
  console.log(`Recommended HOST_URL: http://${localIp}:${process.env.PORT || 3001}`);
  
  console.log('\nIf the above IP is not correct, here are all available network interfaces:');
  printAllNetworkInterfaces();
}

// For direct execution with Node.js
import { fileURLToPath } from 'url'; 