/**
 * @fileoverview Express application setup and configuration module.
 * @module api/app
 * 
 * Main application configuration that:
 * - Sets up security middleware
 * - Configures request parsing
 * - Enables CORS and compression
 * - Mounts API routes
 * - Handles global errors
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger.js';
import routes from './routes/v1/index.js';
import { requestLogger, consoleLogger, errorLogger, logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Express application instance.
 * Configured with security, logging, and API handling middleware.
 * 
 * Security features:
 * - Helmet for HTTP headers
 * - CORS for cross-origin requests
 * - Body parsing limits
 * 
 * Performance features:
 * - Response compression
 * - Body parsing
 * - Request logging
 * 
 * @type {express.Application}
 */
const app = express();

// Log application startup
logger.info('Initializing application', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT || 3000,
    swaggerEnabled: process.env.SWAGGER_ENABLED === 'true'
});

// Generate nonce for CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

/** Configure security middleware */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com",
                (req, res) => `'nonce-${res.locals.nonce}'`
            ],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
        },
    },
}));
logger.info('Security middleware configured', { middleware: ['helmet'] });

app.use(cors());
logger.info('CORS enabled');

app.use(compression());
logger.info('Response compression enabled');

/** Configure request logging middleware */
app.use(requestLogger);  // File logging
app.use(consoleLogger);  // Console logging
logger.info('Request logging configured', { 
    logFile: 'logs/api.log',
    consoleLogging: true 
});

/** Configure request parsing middleware */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
logger.info('Request parsing configured', { 
    bodyLimit: '10mb',
    urlEncoded: true 
});

/** Mount API routes first */
app.use('/api/v1', routes);
logger.info('API routes mounted at /api/v1 prefix');

/** Serve static files */
app.use(express.static('public', {
    index: false // Disable automatic serving of index.html
}));
logger.info('Static file serving enabled', { directory: 'public' });

/** Handle client-side routes by serving index.html */
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            error: 'Not Found',
            message: 'The requested API endpoint was not found'
        });
    }
    
    // Serve index.html for all other routes
    res.sendFile('index.html', { root: 'public' });
});

/** Setup Swagger documentation */
if (process.env.SWAGGER_ENABLED === 'true') {
    const swaggerPath = process.env.SWAGGER_PATH || '/api-docs';
    app.use(
        swaggerPath,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'UKG Marketplace API Documentation'
        })
    );
    logger.info('Swagger documentation enabled', { path: swaggerPath });
}

/** Error handling middleware */
app.use(errorLogger);
app.use((err, req, res, next) => {
    // Log error details for debugging
    console.error(err.stack);

    // Send generic error response to client
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on our end'
    });
});
logger.info('Error handling middleware configured');

// Log successful initialization
logger.info('Application initialization complete', {
    features: [
        'Security middleware',
        'Request logging',
        'Response compression',
        'API routes',
        'Error handling'
    ]
});

export default app; 