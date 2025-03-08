/**
 * @fileoverview Utility module providing Go-style error handling and functional programming helpers.
 * @module utils/result
 * 
 * @exports Result
 * @exports handle
 * @exports pipe
 * @exports httpError
 * @exports validate
 * @exports validateAsync
 */

/**
 * Creates a Result tuple containing data and error values.
 * @template T
 * @param {T} [data=null] - The success value
 * @param {Error} [error=null] - The error value
 * @returns {[T|null, Error|null]} A tuple containing the data and error
 * @example
 * const [data, error] = Result(42);
 * if (error) console.error('Error:', error);
 * else console.log('Data:', data);
 */
export const Result = (data = null, error = null) => [data, error];

/**
 * Handles promises in a Go-style way, returning a Result tuple.
 * @template T
 * @async
 * @param {Promise<T>} promise - The promise to handle
 * @returns {Promise<[T|null, Error|null]>} A Result tuple containing the resolved value or error
 * @example
 * const [data, error] = await handle(fetchData());
 * if (error) console.error('Failed to fetch:', error);
 */
export const handle = async (promise) => {
    try {
        console.log('Handling promise...');
        const data = await promise;
        console.log('Promise resolved successfully:', data);
        return Result(data);
    } catch (error) {
        console.error('Promise rejected with error:', error);
        return Result(null, error);
    }
};

/**
 * Composes multiple functions into a single function, applying them from left to right.
 * @param {...Function} fns - Functions to compose
 * @returns {Function} A composed function
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const addOneThenDouble = pipe(addOne, double);
 * console.log(addOneThenDouble(5)); // Output: 12
 */
export const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

/**
 * Creates an HTTP error object for a Result tuple.
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {[null, Error]} Result tuple containing the error with status property
 * @example
 * return httpError(404, 'User not found');
 */
export const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return Result(null, error);
};

/**
 * Validates a condition and returns a Result tuple.
 * @param {boolean} condition - The condition to validate
 * @param {string|Error} errorMessage - Error message if condition is false, or an Error object
 * @returns {[boolean|null, Error|null]} Result tuple indicating validation success or failure
 * @example
 * const [valid, error] = validate(user.age >= 18, 'Must be 18 or older');
 * if (error) console.error('Validation failed:', error);
 */
export const validate = (condition, errorMessage) => {
    if (condition) {
        return Result(true);
    } else {
        const error = typeof errorMessage === 'string' ? new Error(errorMessage) : errorMessage;
        return Result(null, error);
    }
};

/**
 * Validates an async operation and returns a Result tuple.
 * @template T
 * @async
 * @param {Promise<[T|null, Error|null]>} resultPromise - Promise that resolves to a Result tuple
 * @param {[null, Error]} errorResult - Result tuple to return if the operation fails
 * @returns {Promise<[T|null, Error|null]>} Result tuple from the operation or the error result
 * @example
 * const [data, error] = await validateAsync(
 *   userService.findById(id),
 *   httpError(404, 'User not found')
 * );
 */
export const validateAsync = async (resultPromise, errorResult) => {
    try {
        const [data, error] = await resultPromise;
        if (error) return errorResult;
        return Result(data);
    } catch (err) {
        return errorResult;
    }
}; 