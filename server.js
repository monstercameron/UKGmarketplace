/**
 * @fileoverview Main server entry point that initializes and starts the Express application.
 * @module server
 * @requires dotenv
 * @requires ./src/api/app
 */

import app from './src/api/app.js';
import dotenv from 'dotenv';
import { logger } from './src/api/utils/logger.js';

// Load environment variables
dotenv.config();
logger.info('Environment variables loaded');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Start server
const server = app.listen(PORT, () => {
    logger.info('Server started successfully', {
        port: PORT,
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        pid: process.pid,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
    });
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error('Port is already in use', err, {
            port: PORT,
            code: err.code
        });
        process.exit(1);
    } else {
        logger.error('Server startup error', err);
        process.exit(1);
    }
});

// Handle process events
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Performing graceful shutdown...');
    server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received. Performing graceful shutdown...');
    server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    server.close(() => {
        process.exit(1);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', null, {
        reason,
        promise
    });
}); 