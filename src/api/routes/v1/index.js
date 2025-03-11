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
 * @requires ./rss
 */

import express from 'express';
import authRoutes from './auth.js';
import itemRoutes from './items.js';
import messageRoutes from './messages.js';
import categoryRoutes from './categories.js';
import imageRoutes from './images.js';
import searchRoutes from './search.js';
import adminRoutes from './admin.js';
import rssRoutes from './rss.js';
import { getAsync } from '../../../database/connection.js';

const router = express.Router();

/** API health check endpoint */
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Database diagnostic endpoint */
router.get('/diagnostic', async (req, res) => {
    try {
        let dbInfo = { connected: false, version: null, items: null };
        let itemsTest = { attempted: false, success: false, count: 0, error: null };
        
        try {
            // Test database connection by doing a simple query
            const dbResult = await getAsync('SELECT sqlite_version() as version');
            dbInfo.connected = true;
            dbInfo.version = dbResult ? dbResult.version : 'unknown';
            
            // Test if items table exists and has content
            try {
                itemsTest.attempted = true;
                const itemsCount = await getAsync('SELECT COUNT(*) as count FROM items');
                itemsTest.success = true;
                itemsTest.count = itemsCount ? itemsCount.count : 0;
            } catch (itemsError) {
                itemsTest.error = `${itemsError.message}`;
            }
        } catch (dbError) {
            dbInfo.error = `${dbError.message}`;
        }
        
        // Get server info
        const serverInfo = {
            nodeVersion: process.version,
            env: process.env.NODE_ENV,
            host: req.get('host'),
            configuredHost: process.env.HOST_URL || 'Not configured',
            port: process.env.PORT
        };
        
        res.json({
            status: dbInfo.connected ? 'ok' : 'database_error', 
            timestamp: new Date().toISOString(),
            databaseInfo: dbInfo,
            itemsTest,
            serverInfo,
            help: itemsTest.count === 0 ? 
                "Your database doesn't have any items yet. The RSS feed will show a 'No Items' message." : 
                undefined
        });
    } catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            databaseConnected: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/** Mount route modules */
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/messages', messageRoutes);
router.use('/categories', categoryRoutes);
router.use('/images', imageRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/rss', rssRoutes);

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