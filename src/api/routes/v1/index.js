/**
 * @fileoverview Main router configuration that mounts all API route modules and handles errors.
 * @module api/routes/v1
 * @requires express
 * @requires ./auth
 * @requires ./items
 * @requires ./messages
 * @requires ./categories
 * @requires ./images
 * @requires ./admin
 */

import express from 'express';
import authRoutes from './auth.js';
import itemRoutes from './items.js';
import messageRoutes from './messages.js';
import categoryRoutes from './categories.js';
import imageRoutes from './images.js';
import searchRoutes from './search.js';
import adminRoutes from './admin.js';

const router = express.Router();

/** API health check endpoint */
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Mount route modules */
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/messages', messageRoutes);
router.use('/categories', categoryRoutes);
router.use('/images', imageRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);

/** Handle 404 errors */
router.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found on this server'
    });
});

/** Global error handler */
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on our end'
    });
});

export default router; 