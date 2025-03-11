/**
 * @fileoverview Admin-specific API routes.
 * @module api/routes/v1/admin
 * @requires express
 * @requires ../../../database/schema
 */

import express from 'express';
import { db, runAsync, allAsync } from '../../../database/schema.js';

const router = express.Router();

/**
 * Truncate the entire database.
 * This is a dangerous operation that requires the correct admin password.
 * POST /api/v1/admin/truncate-database
 */
router.post('/truncate-database', async (req, res) => {
    try {
        const { password } = req.body;
        
        // Verify the admin password
        if (password !== 'password123') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid admin password'
            });
        }
        
        // Get all table names from the database
        const tables = await allAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            []
        );
        
        // Start a transaction
        await runAsync('BEGIN TRANSACTION', []);
        
        try {
            // Delete all data from each table
            for (const table of tables) {
                await runAsync(`DELETE FROM ${table.name}`, []);
            }
            
            // Commit the transaction
            await runAsync('COMMIT', []);
            
            res.status(200).json({
                success: true,
                message: 'Database truncated successfully',
                tables_affected: tables.length
            });
        } catch (error) {
            // Rollback the transaction if an error occurs
            await runAsync('ROLLBACK', []);
            throw error;
        }
    } catch (error) {
        console.error('Error truncating database:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to truncate database'
        });
    }
});

export default router; 