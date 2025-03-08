/**
 * @fileoverview Test file for the logger linting rule
 */

// Import the logger module
import { logger } from '../src/api/utils/logger.js';

function testFunction() {
  // Use the logger module instead of console
  logger.info('This is using the logger module correctly');
  logger.error('This is also using the logger module correctly');
  
  return 'Test completed';
}

testFunction(); 