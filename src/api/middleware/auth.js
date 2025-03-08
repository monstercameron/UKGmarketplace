/**
 * @fileoverview Authentication and authorization middleware for securing API endpoints.
 * @module api/middleware/auth
 * @requires jsonwebtoken
 * @requires ../../../utils/result
 * @requires ../../../services/userService
 */

import jwt from 'jsonwebtoken';
import { Result, httpError } from '../../../utils/result.js';
import * as userService from '../../../services/userService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** Verify JWT token and attach user to request */
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const [user, error] = await userService.findUserById(decoded.id);
        if (error || !user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error authenticating user'
        });
    }
};

/** Check if authenticated user has admin privileges */
export const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }
    next();
};

/** Validate token and update user's last login time */
export const validateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const [user, error] = await userService.findUserById(decoded.id);

        if (error || !user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        // Update last login
        await userService.updateLastLogin(user.id);

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Error validating token'
        });
    }
}; 