/**
 * @fileoverview Test file for the Go-style error handling pattern
 */

// Import the Result utility and logger
import { Result, handle, validate } from '../src/utils/result.js';
import { logger } from '../src/api/utils/logger.js';

// Example of a function that returns a Result tuple
async function fetchData() {
  try {
    // Simulate an API call
    const data = { id: 1, name: 'Test Item' };
    const [result, _] = Result(data);
    return Result(result);
  } catch (error) {
    return Result(null, error);
  }
}

// Example of correct Go-style error handling
async function correctUsage() {
  // Correct: Using destructuring with result and error
  const [data, error] = await fetchData();
  
  if (error) {
    logger.error('Error fetching data:', error);
    return;
  }
  
  logger.info('Data fetched successfully:', data);
  
  // Correct: Using the Result function with destructuring
  const [isValid, validationError] = validate(data.id > 0, 'ID must be positive');
  
  if (validationError) {
    logger.error('Validation error:', validationError);
    return;
  }
  
  // Correct: Using the handle function with destructuring
  const promise = Promise.resolve(data);
  const [processedData, processingError] = await handle(promise);
  
  if (processingError) {
    logger.error('Processing error:', processingError);
    return;
  }
  
  logger.info('Data processed successfully:', processedData);
}

// Example of incorrect Go-style error handling (commented out to pass linting)
/*
async function incorrectUsage() {
  // Incorrect: Not using destructuring
  const result = await fetchData();
  logger.info('Result:', result);
  
  // Incorrect: Not checking for error
  const [data] = await fetchData();
  logger.info('Data:', data);
  
  // Incorrect: Not using destructuring with handle
  await handle(Promise.resolve({ id: 2, name: 'Another Item' }));
  
  // Incorrect: Not using destructuring with validate
  validate(true, 'This should not happen');
}
*/

// Run the examples
correctUsage(); 