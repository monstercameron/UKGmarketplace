import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import morganJson from 'morgan-json';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Create write streams
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'api.log'),
    { flags: 'a' }
);

// Create structured format for morgan
const format = morganJson({
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    timestamp: ':date[iso]',
    contentLength: ':res[content-length]',
    userAgent: ':user-agent'
});

// Console logger for structured application logs
export const logger = {
    info: (message, meta = {}) => {
        console.log(JSON.stringify({
            level: 'info',
            timestamp: new Date().toISOString(),
            message,
            ...meta
        }));
    },
    error: (message, error = null, meta = {}) => {
        console.error(JSON.stringify({
            level: 'error',
            timestamp: new Date().toISOString(),
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            ...meta
        }));
    },
    warn: (message, meta = {}) => {
        console.warn(JSON.stringify({
            level: 'warn',
            timestamp: new Date().toISOString(),
            message,
            ...meta
        }));
    },
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(JSON.stringify({
                level: 'debug',
                timestamp: new Date().toISOString(),
                message,
                ...meta
            }));
        }
    }
};

// Morgan middleware for HTTP request logging
export const requestLogger = morgan(format, {
    stream: accessLogStream
});

// Morgan middleware for console logging
export const consoleLogger = morgan(format);

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
    logger.error('Unhandled error', err, {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body,
        params: req.params,
        headers: req.headers
    });
    next(err);
}; 