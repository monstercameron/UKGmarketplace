/**
 * @fileoverview Messaging system routes for marketplace communication.
 * @module api/routes/v1/messages
 */

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: User messaging and communication
 */

import express from 'express';
import { Result, validate, validateAsync, httpError } from '../../../utils/result.js';
import * as messageService from '../../../services/messageService.js';

/**
 * Express router for messaging operations.
 * Handles all messaging functionality, including:
 * - Message sending and receiving
 * - Conversation management
 * - Read status tracking
 * - Message deletion
 * - Unread counts
 * 
 * @type {express.Router}
 */
const router = express.Router();

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderEmail
 *               - receiverEmail
 *               - itemId
 *               - message
 *             properties:
 *               senderEmail:
 *                 type: string
 *                 format: email
 *               receiverEmail:
 *                 type: string
 *                 format: email
 *               itemId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.post('/', async (req, res) => {
    const { senderEmail, receiverEmail, itemId, message } = req.body;
    const [result, error] = await validateAsync(
        messageService.sendMessage(senderEmail, receiverEmail, itemId, message),
        httpError(400, 'Failed to send message')
    );
    if (error) return res.status(error.status).json(error);
    res.status(201).json(result);
});

/**
 * @swagger
 * /api/v1/messages/conversation/{itemId}/{email}:
 *   get:
 *     summary: Get conversation with a user about an item
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Item ID
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Other user's email
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Current user's email
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/conversation/:itemId/:email', async (req, res) => {
    const { itemId, email } = req.params;
    const currentEmail = req.query.email;
    const [result, error] = await validateAsync(
        messageService.getConversation(currentEmail, email, itemId),
        httpError(400, 'Failed to fetch conversation')
    );
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     summary: Get all conversations for a user
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   itemId:
 *                     type: integer
 *                   otherUserEmail:
 *                     type: string
 *                     format: email
 *                   lastMessage:
 *                     $ref: '#/components/schemas/Message'
 *                   unreadCount:
 *                     type: integer
 *       400:
 *         $ref: '#/components/responses/Error400'
 */
router.get('/conversations', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Email is required'
        });
    }
    const [result, error] = await validateAsync(
        messageService.getConversations(email),
        httpError(400, 'Failed to fetch conversations')
    );
    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/** Mark single message as read */
router.put('/:messageId/read', async (req, res) => {
    const { messageId } = req.params;
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Email is required'
        });
    }

    const [result, error] = await validateAsync(
        messageService.markMessageAsRead(messageId, email),
        httpError(400, 'Failed to mark message as read')
    );

    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/** Mark all messages in a conversation as read */
router.put('/conversation/:itemId/:email/read', async (req, res) => {
    // Extract conversation identifiers
    const { itemId, email } = req.params;
    const { currentEmail } = req.query;

    if (!currentEmail) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Current email is required'
        });
    }

    const [result, error] = await validateAsync(
        messageService.markConversationAsRead(itemId, currentEmail, email),
        httpError(400, 'Failed to mark conversation as read')
    );

    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/** Get count of unread messages for a user */
router.get('/unread/count', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Email is required'
        });
    }

    const [result, error] = await validateAsync(
        messageService.getUnreadCount(email),
        httpError(400, 'Failed to get unread count')
    );

    if (error) return res.status(error.status).json(error);
    res.json(result);
});

/** Delete a single message */
router.delete('/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Email is required'
        });
    }

    const [result, error] = await validateAsync(
        messageService.deleteMessage(messageId, email),
        httpError(400, 'Failed to delete message')
    );

    if (error) return res.status(error.status).json(error);
    res.status(204).send();
});

/** Delete entire conversation between users */
router.delete('/conversation/:itemId/:email', async (req, res) => {
    const { itemId, email } = req.params;
    const { currentEmail } = req.query;

    if (!currentEmail) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Current email is required'
        });
    }

    const [result, error] = await validateAsync(
        messageService.deleteConversation(itemId, currentEmail, email),
        httpError(400, 'Failed to delete conversation')
    );

    if (error) return res.status(error.status).json(error);
    res.status(204).send();
});

// Basic messages routes placeholder
router.get('/', (req, res) => {
    res.status(501).json({ message: 'Get messages endpoint not implemented yet' });
});

router.post('/', (req, res) => {
    res.status(501).json({ message: 'Send message endpoint not implemented yet' });
});

export default router; 