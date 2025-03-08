/**
 * @fileoverview User service handling all user-related operations including authentication,
 * profile management, and user data operations.
 * @module services/userService
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync } from '../database/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * @constant {number} SALT_ROUNDS - Number of salt rounds for password hashing
 */
const SALT_ROUNDS = 10;

/**
 * @constant {string} JWT_SECRET - Secret key for JWT token generation
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * @typedef {Object} UserProfile
 * @property {string} username - User's display name
 * @property {string} email - User's email address
 * @property {string} [phone] - User's phone number (optional)
 * @property {string} [location] - User's location (optional)
 */

/**
 * @typedef {Object} UserUpdateData
 * @property {string} [username] - New username
 * @property {string} [email] - New email address
 * @property {string} [phone] - New phone number
 * @property {string} [location] - New location
 */

/**
 * @typedef {Object} AuthResult
 * @property {string} token - JWT authentication token
 * @property {Object} user - User object without sensitive data
 */

/**
 * Creates a new user account
 * @async
 * @param {string} username - User's display name
 * @param {string} email - User's email address
 * @param {string} password - User's password (will be hashed)
 * @param {string} [phone=null] - User's phone number
 * @param {string} [location=null] - User's location
 * @returns {Promise<Result<number>>} Result containing the new user ID
 * @throws {Error} If database operation fails
 * @example
 * const [result, error] = await createUser('john_doe', 'john@example.com', 'password123');
 * if (error) console.error('Failed to create user:', error);
 * else console.log('Created user with ID:', result);
 */
export const createUser = async (username, email, password, phone = null, location = null) => {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return handle(runAsync(
        'INSERT INTO users (username, email, password_hash, phone, location) VALUES (?, ?, ?, ?, ?)',
        [username, email, passwordHash, phone, location]
    ));
};

/**
 * Finds a user by their ID
 * @async
 * @param {number} id - User ID to search for
 * @returns {Promise<Result<UserProfile>>} Result containing the user profile
 * @throws {Error} If database operation fails
 */
export const findUserById = (id) => 
    handle(getAsync('SELECT id, username, email, phone, location, is_verified, created_at FROM users WHERE id = ?', [id]));

/**
 * Finds a user by their email address
 * @async
 * @param {string} email - Email address to search for
 * @returns {Promise<Result<UserProfile>>} Result containing the user profile
 * @throws {Error} If database operation fails
 */
export const findUserByEmail = (email) => 
    handle(getAsync('SELECT * FROM users WHERE email = ?', [email]));

/**
 * Finds a user by their username
 * @async
 * @param {string} username - Username to search for
 * @returns {Promise<Result<UserProfile>>} Result containing the user profile
 * @throws {Error} If database operation fails
 */
export const findUserByUsername = (username) => 
    handle(getAsync('SELECT * FROM users WHERE username = ?', [username]));

/**
 * Updates a user's profile information
 * @async
 * @param {number} id - User ID to update
 * @param {UserUpdateData} updateData - Object containing fields to update
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If no updates provided or database operation fails
 */
export const updateUser = (id, { username, email, phone, location }) => {
    const updates = [];
    const values = [];

    if (username) {
        updates.push('username = ?');
        values.push(username);
    }
    if (email) {
        updates.push('email = ?');
        values.push(email);
    }
    if (phone !== undefined) {
        updates.push('phone = ?');
        values.push(phone);
    }
    if (location !== undefined) {
        updates.push('location = ?');
        values.push(location);
    }

    if (updates.length === 0) return Result(null, new Error('No updates provided'));

    values.push(id);
    return handle(runAsync(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
    ));
};

/**
 * Deletes a user account
 * @async
 * @param {number} id - User ID to delete
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const deleteUser = (id) => 
    handle(runAsync('DELETE FROM users WHERE id = ?', [id]));

/**
 * Authenticates a user and generates a JWT token
 * @async
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Result<AuthResult>>} Result containing token and user data
 * @throws {Error} If credentials are invalid or database operation fails
 */
export const authenticateUser = async (email, password) => {
    const [user, error] = await findUserByEmail(email);
    if (error || !user) return Result(null, new Error('Invalid credentials'));

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return Result(null, new Error('Invalid credentials'));

    const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return Result({ token, user: { ...user, password_hash: undefined } });
};

/**
 * Marks a user's account as verified
 * @async
 * @param {number} id - User ID to verify
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const verifyUser = (id) => 
    handle(runAsync('UPDATE users SET is_verified = 1 WHERE id = ?', [id]));

/**
 * Updates a user's last login timestamp
 * @async
 * @param {number} id - User ID to update
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const updateLastLogin = (id) => 
    handle(runAsync('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]));

/**
 * Retrieves all items listed by a user
 * @async
 * @param {number} userId - User ID to get items for
 * @returns {Promise<Result<Array<Object>>>} Result containing array of items
 * @throws {Error} If database operation fails
 */
export const getUserItems = (userId) => 
    handle(allAsync(`
        SELECT i.*, c.name as category_name, 
               (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
    `, [userId]));

/**
 * Retrieves all items favorited by a user
 * @async
 * @param {number} userId - User ID to get favorites for
 * @returns {Promise<Result<Array<Object>>>} Result containing array of favorited items
 * @throws {Error} If database operation fails
 */
export const getUserFavorites = (userId) => 
    handle(allAsync(`
        SELECT i.*, c.name as category_name,
               (SELECT url FROM item_images WHERE item_id = i.id AND is_primary = 1 LIMIT 1) as primary_image
        FROM favorites f
        JOIN items i ON f.item_id = i.id
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    `, [userId])); 