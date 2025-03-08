/**
 * @fileoverview Message service handling all messaging operations including sending,
 * retrieving, and managing conversations between users.
 * @module services/messageService
 */

import { Result, handle } from '../utils/result.js';
import { runAsync, allAsync, getAsync } from '../database/connection.js';

/**
 * @typedef {Object} Message
 * @property {number} id - Message ID
 * @property {string} sender_email - Sender's email
 * @property {string} receiver_email - Receiver's email
 * @property {number} item_id - Related item ID
 * @property {string} message - Message content
 * @property {boolean} is_read - Read status
 * @property {Date} created_at - Message creation timestamp
 */

/**
 * @typedef {Object} Conversation
 * @property {number} item_id - Related item ID
 * @property {string} item_title - Title of the related item
 * @property {string} other_email - Email of the other participant
 * @property {string} last_message - Content of the last message
 * @property {Date} last_message_time - Timestamp of the last message
 */

/**
 * Sends a new message
 * @async
 * @param {string} senderEmail - Email of the sender
 * @param {string} receiverEmail - Email of the receiver
 * @param {number} itemId - ID of the related item
 * @param {string} message - Message content
 * @returns {Promise<Result<number>>} Result containing the message ID
 * @throws {Error} If database operation fails
 * @example
 * const [result, error] = await sendMessage('sender@example.com', 'receiver@example.com', 1, 'Hello!');
 * if (error) console.error('Failed to send message:', error);
 */
export const sendMessage = (senderEmail, receiverEmail, itemId, message) => 
    handle(runAsync(
        'INSERT INTO messages (sender_email, receiver_email, item_id, message) VALUES (?, ?, ?, ?)',
        [senderEmail, receiverEmail, itemId, message]
    ));

/**
 * Retrieves a conversation between two users about an item
 * @async
 * @param {string} email1 - First participant's email
 * @param {string} email2 - Second participant's email
 * @param {number} itemId - ID of the item being discussed
 * @returns {Promise<Result<Array<Message>>>} Result containing array of messages
 * @throws {Error} If database operation fails
 */
export const getConversation = (email1, email2, itemId) => 
    handle(allAsync(`
        SELECT m.*, 
               i.title as item_title
        FROM messages m
        JOIN items i ON m.item_id = i.id
        WHERE m.item_id = ?
        AND ((m.sender_email = ? AND m.receiver_email = ?)
        OR (m.sender_email = ? AND m.receiver_email = ?))
        ORDER BY m.created_at ASC
    `, [itemId, email1, email2, email2, email1]));

/**
 * Retrieves all conversations for a user
 * @async
 * @param {string} email - User's email address
 * @returns {Promise<Result<Array<Conversation>>>} Result containing array of conversations
 * @throws {Error} If database operation fails
 */
export const getConversations = (email) => 
    handle(allAsync(`
        SELECT DISTINCT 
            i.id as item_id,
            i.title as item_title,
            CASE 
                WHEN m.sender_email = ? THEN m.receiver_email
                ELSE m.sender_email
            END as other_email,
            (SELECT message 
             FROM messages 
             WHERE item_id = i.id 
             AND (sender_email = ? OR receiver_email = ?)
             ORDER BY created_at DESC 
             LIMIT 1) as last_message,
            (SELECT created_at 
             FROM messages 
             WHERE item_id = i.id 
             AND (sender_email = ? OR receiver_email = ?)
             ORDER BY created_at DESC 
             LIMIT 1) as last_message_time
        FROM messages m
        JOIN items i ON m.item_id = i.id
        WHERE m.sender_email = ? OR m.receiver_email = ?
        ORDER BY last_message_time DESC
    `, [email, email, email, email, email, email, email, email]));

/**
 * Marks a message as read
 * @async
 * @param {number} messageId - ID of the message to mark
 * @param {string} email - Email of the receiver
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const markMessageAsRead = (messageId, email) => 
    handle(runAsync(
        'UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_email = ?',
        [messageId, email]
    ));

/**
 * Marks all messages in a conversation as read
 * @async
 * @param {number} itemId - ID of the item being discussed
 * @param {string} email1 - Email of the receiver
 * @param {string} email2 - Email of the sender
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const markConversationAsRead = (itemId, email1, email2) => 
    handle(runAsync(
        'UPDATE messages SET is_read = 1 WHERE item_id = ? AND receiver_email = ? AND sender_email = ?',
        [itemId, email1, email2]
    ));

/**
 * Gets the count of unread messages for a user
 * @async
 * @param {string} email - User's email address
 * @returns {Promise<Result<{count: number}>>} Result containing the unread count
 * @throws {Error} If database operation fails
 */
export const getUnreadCount = (email) => 
    handle(getAsync(
        'SELECT COUNT(*) as count FROM messages WHERE receiver_email = ? AND is_read = 0',
        [email]
    ));

/**
 * Deletes a message
 * @async
 * @param {number} messageId - ID of the message to delete
 * @param {string} email - Email of the user (must be sender or receiver)
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const deleteMessage = (messageId, email) => 
    handle(runAsync(
        'DELETE FROM messages WHERE id = ? AND (sender_email = ? OR receiver_email = ?)',
        [messageId, email, email]
    ));

/**
 * Deletes an entire conversation
 * @async
 * @param {number} itemId - ID of the item being discussed
 * @param {string} email1 - First participant's email
 * @param {string} email2 - Second participant's email
 * @returns {Promise<Result<boolean>>} Result indicating success
 * @throws {Error} If database operation fails
 */
export const deleteConversation = (itemId, email1, email2) => 
    handle(runAsync(
        'DELETE FROM messages WHERE item_id = ? AND ((sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?))',
        [itemId, email1, email2, email2, email1]
    )); 