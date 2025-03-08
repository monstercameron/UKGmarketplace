/**
 * @fileoverview Notification service handling email notifications and alerts
 * for various system events.
 * @module services/notificationService
 */

import nodemailer from 'nodemailer';
import { Result, handle } from '../utils/result.js';

/**
 * @typedef {Object} EmailConfig
 * @property {string} host - SMTP host
 * @property {number} port - SMTP port
 * @property {string} user - SMTP username
 * @property {string} pass - SMTP password
 */

/**
 * @typedef {Object} Item
 * @property {string} title - Item title
 * @property {string} [description] - Item description
 */

/**
 * @typedef {Object} Watcher
 * @property {string} email - Watcher's email address
 * @property {string} [name] - Watcher's name
 */

/**
 * Creates a nodemailer transport instance
 * @private
 * @param {EmailConfig} config - Email configuration
 * @returns {import('nodemailer').Transporter} Configured nodemailer transport
 */
const createTransporter = (config) => 
    nodemailer.createTransport({
        host: config.host,
        port: config.port,
        auth: {
            user: config.user,
            pass: config.pass
        }
    });

/**
 * Creates an email payload for item status updates
 * @private
 * @param {string} from - Sender email address
 * @param {string} to - Recipient email address
 * @param {Item} item - Item that was updated
 * @param {string} status - New status of the item
 * @returns {Object} Email payload for nodemailer
 */
const createEmailPayload = (from, to, item, status) => ({
    from,
    to,
    subject: `Item Status Update: ${item.title}`,
    text: `The item "${item.title}" status has been updated to: ${status}`
});

/**
 * Sends a notification email about an item update
 * @async
 * @param {EmailConfig} config - Email configuration
 * @returns {Function} Configured notification sender function
 * @example
 * const notifier = sendNotification({
 *   host: 'smtp.example.com',
 *   port: 587,
 *   user: 'user@example.com',
 *   pass: 'password'
 * });
 * await notifier('recipient@example.com', { title: 'Item' }, 'sold');
 */
export const sendNotification = (config) => (to, item, status) => 
    handle(createTransporter(config).sendMail(
        createEmailPayload(config.user, to, item, status)
    ));

/**
 * Notifies all watchers about an item update
 * @async
 * @param {EmailConfig} config - Email configuration
 * @returns {Function} Configured bulk notification sender function
 * @example
 * const bulkNotifier = notifyWatchers({
 *   host: 'smtp.example.com',
 *   port: 587,
 *   user: 'user@example.com',
 *   pass: 'password'
 * });
 * await bulkNotifier([
 *   { email: 'watcher1@example.com' },
 *   { email: 'watcher2@example.com' }
 * ], { title: 'Item' }, 'price_reduced');
 */
export const notifyWatchers = (config) => (watchers, item, status) =>
    Promise.all(
        watchers.map(watcher => 
            sendNotification(config)(watcher.email, item, status)
        )
    ); 