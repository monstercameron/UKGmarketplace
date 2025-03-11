/**
 * @fileoverview RSS feed routes for marketplace items.
 * @module api/routes/v1/rss
 */

/**
 * @swagger
 * tags:
 *   name: RSS
 *   description: RSS feed for marketplace items
 */

import express from 'express';
import * as itemService from '../../../services/itemService.js';
import { Result } from '../../../utils/result.js';
import dotenv from 'dotenv';
import { allAsync, getAsync } from '../../../database/connection.js';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Express router for RSS feed operations.
 * Provides XML feeds of marketplace items.
 * 
 * @type {express.Router}
 */
const router = express.Router();

/**
 * @swagger
 * /api/v1/rss:
 *   get:
 *     summary: Get RSS feed of latest items
 *     tags: [RSS]
 *     responses:
 *       200:
 *         description: RSS feed of latest items
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 */
router.get('/', async (req, res) => {
    try {
        console.log('RSS feed requested - attempting to fetch items');
        
        try {
            // Try a direct database query to get items
            console.log('Performing direct database query for items');
            let items = [];
            
            try {
                // Query for all items instead of looking for a specific item ID
                items = await allAsync('SELECT * FROM items ORDER BY created_at DESC LIMIT 20');
                console.log(`Found ${items.length} items with simple query`);
                
                // Process each item
                for (const item of items) {
                    // Get category name
                    const category = await getAsync('SELECT name FROM categories WHERE id = ?', [item.category_id]);
                    item.category_name = category ? category.name : 'Unknown Category';
                    
                    // Check for payment methods
                    try {
                        const paymentMethods = await allAsync(
                            'SELECT pm.slug FROM item_payment_methods ipm ' +
                            'JOIN payment_methods pm ON ipm.payment_method_id = pm.id ' +
                            'WHERE ipm.item_id = ?', 
                            [item.id]
                        );
                        
                        item.paymentMethods = paymentMethods.map(pm => pm.slug);
                    } catch (pmError) {
                        console.error('Error getting payment methods:', pmError);
                        item.paymentMethods = [];
                    }
                    
                    // Check for images
                    try {
                        const images = await allAsync(
                            'SELECT url, is_primary FROM item_images WHERE item_id = ?',
                            [item.id]
                        );
                        
                        // Find primary image
                        const primaryImage = images.find(img => img.is_primary === 1);
                        if (primaryImage) {
                            item.primary_image = primaryImage.url;
                        }
                        
                        // Store all image URLs
                        item.image_urls = images.map(img => img.url).join(',');
                    } catch (imgError) {
                        console.error('Error getting images:', imgError);
                    }
                    
                    // Parse shipping JSON if it exists
                    if (item.shipping && typeof item.shipping === 'string') {
                        try {
                            item.shipping = JSON.parse(item.shipping);
                        } catch (jsonError) {
                            console.error('Error parsing shipping JSON:', jsonError);
                            item.shipping = [];
                        }
                    }
                }
                
                console.log(`Final items for RSS: ${items.length}`);
                if (items.length > 0) {
                    console.log('First item ID:', items[0].id);
                }
                
            } catch (dbQueryError) {
                console.error('Error in direct database query:', dbQueryError);
                // Continue with empty array
            }
            
            // Use HOST_URL from environment variables if available, otherwise fallback to request-based URL
            let siteUrl = process.env.HOST_URL;
            
            // If HOST_URL is not configured, use request protocol and host
            if (!siteUrl) {
                siteUrl = `${req.protocol}://${req.get('host')}`;
                console.log('HOST_URL not configured, using request-based URL:', siteUrl);
            } else {
                console.log('Using configured HOST_URL:', siteUrl);
            }
            
            // Generate RSS XML (will handle empty items array)
            const rssXml = generateRssXml(items, siteUrl);
            
            // Set content type and send response
            res.setHeader('Content-Type', 'application/xml');
            res.send(rssXml);
        } catch (dbError) {
            console.error('Database or service error:', dbError);
            return res.status(500).send(`Error generating RSS feed: Database error: ${dbError.message}`);
        }
    } catch (error) {
        console.error('RSS feed generation error:', error);
        res.status(500).send(`Error generating RSS feed: ${error.message || error}`);
    }
});

/**
 * @swagger
 * /api/v1/rss/debug:
 *   get:
 *     summary: Get RSS feed debugging information
 *     tags: [RSS]
 *     responses:
 *       200:
 *         description: RSS feed debugging information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/debug', async (req, res) => {
    try {
        console.log('RSS debug endpoint requested');
        
        // Get network info
        const networkInfo = {
            requestHost: req.get('host'),
            requestProtocol: req.protocol,
            requestOriginalUrl: req.originalUrl,
            requestIp: req.ip,
            configuredHost: process.env.HOST_URL,
            serverPort: process.env.PORT
        };
        
        // Try to fetch items directly from the database
        let items = [];
        
        try {
            items = await allAsync('SELECT * FROM items ORDER BY created_at DESC LIMIT 5');
            console.log(`Direct database query found ${items.length} items`);
            
            // Process items with associated data if any found
            if (items.length > 0) {
                for (const item of items) {
                    // Get category name
                    const category = await getAsync('SELECT name FROM categories WHERE id = ?', [item.category_id]);
                    item.category_name = category ? category.name : 'Unknown Category';
                    
                    // Check for primary image
                    const primaryImage = await getAsync('SELECT url FROM item_images WHERE item_id = ? AND is_primary = 1 LIMIT 1', [item.id]);
                    if (primaryImage) {
                        item.primary_image = primaryImage.url;
                    }
                }
            }
        } catch (dbError) {
            console.error('Error in direct database query for debug endpoint:', dbError);
        }
        
        // Construct full feed URL
        const siteUrl = process.env.HOST_URL || `${req.protocol}://${req.get('host')}`;
        const feedUrl = `${siteUrl}/api/v1/rss`;
        
        // Send debug info
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            networkInfo,
            itemCount: items.length,
            sampleItem: items.length > 0 ? {
                id: items[0].id,
                title: items[0].title,
                created_at: items[0].created_at,
                category: items[0].category_name,
                hasImages: !!items[0].primary_image
            } : null,
            rssLinks: {
                feedUrl,
                feedWithActualIp: `http://${req.ip.replace('::ffff:', '')}:${process.env.PORT}/api/v1/rss`,
                debugEndpoint: `${siteUrl}/api/v1/rss/debug`
            },
            helpMessage: "If the feed isn't working, make sure you have at least one item in your database and check your .env configuration."
        });
    } catch (error) {
        console.error('RSS debug endpoint error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error in RSS debug endpoint',
            error: error.message
        });
    }
});

/**
 * Test endpoint to check if a specific item exists
 */
router.get('/test', async (req, res) => {
    try {
        console.log('Testing direct item access');
        
        try {
            // Try to get the item with ID 91 directly
            const item = await getAsync('SELECT * FROM items WHERE id = ?', [91]);
            
            if (item) {
                console.log('Item found:', item.id, item.title);
                return res.json({
                    success: true,
                    item: {
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        category_id: item.category_id
                    }
                });
            } else {
                console.log('Item with ID 91 not found');
                
                // Check what items exist
                const allItems = await allAsync('SELECT id, title FROM items LIMIT 10');
                console.log(`Found ${allItems.length} items:`, allItems.map(i => i.id));
                
                return res.json({
                    success: false,
                    message: 'Item not found',
                    availableItems: allItems
                });
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                success: false,
                error: dbError.message
            });
        }
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Generate an RSS XML feed from items
 * 
 * @param {Array} items - The marketplace items to include in the feed
 * @param {string} siteUrl - The base URL of the site
 * @returns {string} The RSS XML document
 */
function generateRssXml(items, siteUrl) {
    if (!Array.isArray(items)) {
        console.error('Items is not an array:', typeof items);
        items = []; // Convert to empty array instead of throwing
    }

    // Debug item data
    console.log(`Generating RSS for ${items.length} items`);
    if (items.length > 0) {
        console.log('Sample item data:', JSON.stringify({
            id: items[0].id,
            title: items[0].title,
            category: items[0].category_name,
            hasImage: !!items[0].primary_image || !!items[0].image_urls
        }));
    }

    if (!siteUrl) {
        console.error('Missing site URL');
        siteUrl = 'http://localhost:3001'; // Provide a fallback URL
    }

    const feedUrl = `${siteUrl}/api/v1/rss`;
    const lastBuildDate = new Date().toUTCString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>UKG Marketplace - Latest Items</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>The latest items available on the UKG Marketplace</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(siteUrl)}/image/logo.png</url>
      <title>UKG Marketplace</title>
      <link>${escapeXml(siteUrl)}</link>
    </image>
`;

    // Check if items array is empty, if so add a placeholder message
    if (items.length === 0) {
        xml += `
    <item>
      <title>No Items Currently Available</title>
      <link>${escapeXml(siteUrl)}</link>
      <guid isPermaLink="true">${escapeXml(siteUrl)}/no-items</guid>
      <pubDate>${lastBuildDate}</pubDate>
      <category>Announcement</category>
      <description><![CDATA[
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #026ab2; margin-bottom: 20px;">No Items Currently Available</h2>
        <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
          There are currently no items listed in the marketplace. Please check back later as new items are added regularly.
        </p>
        <p style="margin-top: 30px;">
          <a href="${siteUrl}" style="background-color: #026ab2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Visit Marketplace
          </a>
        </p>
      </div>
      ]]></description>
    </item>`;
    } else {
        // Add each item to the feed
        items.forEach(item => {
            try {
                if (!item || typeof item !== 'object') {
                    console.warn('Skipping invalid item:', item);
                    return; // Skip this item
                }

                // Handle date in created_at format (from database)
                const itemDate = item.created_at ? new Date(item.created_at).toUTCString() : new Date().toUTCString();
                const itemId = item.id || Math.random().toString(36).substring(2, 15);
                
                // Use the correct URL format with the hash (#) for item links
                const itemLink = `${siteUrl}/#/item/${itemId}`;
                
                // Make sure title exists and is properly escaped
                const itemTitle = item.title 
                    ? escapeXml(item.title)
                    : 'Untitled Item';
                    
                // Process markdown description if available
                let processedDescription = '';
                if (item.description) {
                    // Just do basic escaping for now, we'll keep markdown intact
                    processedDescription = escapeXml(item.description);
                }
                    
                // Handle potentially missing or invalid images
                let itemImage = '';
                let itemImageUrl = '';
                
                // First check for primary_image field
                if (item.primary_image) {
                    itemImageUrl = `${siteUrl}${item.primary_image}`;
                    itemImage = `<img src="${itemImageUrl}" alt="${itemTitle}" />`;
                } 
                // Then check image_urls
                else if (item.image_urls) {
                    const firstImage = item.image_urls.split(',')[0];
                    if (firstImage) {
                        itemImageUrl = `${siteUrl}${firstImage}`;
                        itemImage = `<img src="${itemImageUrl}" alt="${itemTitle}" />`;
                    }
                }
                
                // Payment methods display
                let paymentMethodsHtml = '';
                if (item.paymentMethods && item.paymentMethods.length > 0) {
                    paymentMethodsHtml = `
    <p style="margin-bottom: 10px;">
        <strong>Payment:</strong> ${item.paymentMethods.join(', ')}
    </p>`;
                }
                
                // Shipping options display
                let shippingHtml = '';
                if (item.shipping && item.shipping.length > 0) {
                    let shippingOptions = [];
                    if (Array.isArray(item.shipping)) {
                        shippingOptions = item.shipping;
                    }
                    
                    shippingHtml = `
    <p style="margin-bottom: 10px;">
        <strong>Shipping:</strong> ${shippingOptions.join(', ')}
    </p>`;
                }
                
                // Create a rich HTML description
                const richDescription = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    ${itemImage ? `
    <div style="margin-bottom: 15px; text-align: center;">
        ${itemImage}
    </div>` : ''}
    
    <h2 style="color: #026ab2; margin-bottom: 10px;">${itemTitle}</h2>
    
    ${item.price ? `
    <p style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px;">
        Price: $${parseFloat(item.price).toFixed(2)} ${item.negotiable ? '(Negotiable)' : ''}
    </p>` : ''}
    
    ${item.condition ? `
    <p style="margin-bottom: 10px;">
        <strong>Condition:</strong> ${escapeXml(item.condition)}
    </p>` : ''}
    
    ${item.location ? `
    <p style="margin-bottom: 10px;">
        <strong>Location:</strong> ${escapeXml(item.location)}
    </p>` : ''}
    
    ${paymentMethodsHtml}
    ${shippingHtml}
    
    ${processedDescription ? `
    <div style="margin-top: 15px; line-height: 1.5; white-space: pre-line;">
        <h3 style="color: #333; margin-bottom: 5px;">Description:</h3>
        <p>${processedDescription}</p>
    </div>` : ''}
    
    <p style="margin-top: 20px;">
        <a href="${itemLink}" style="background-color: #026ab2; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Item
        </a>
    </p>
</div>`;
                
                // Handle potentially missing category
                const itemCategory = item.category_name || item.category || 'Uncategorized';
                
                // Debug individual item
                console.log(`Adding item ${item.id} to RSS feed: ${item.title}`);
                    
                xml += `
    <item>
      <title>${itemTitle}</title>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="true">${escapeXml(itemLink)}</guid>
      <pubDate>${itemDate}</pubDate>
      <category>${escapeXml(itemCategory)}</category>
      <description><![CDATA[${richDescription}]]></description>
      ${itemImageUrl ? `<enclosure url="${escapeXml(itemImageUrl)}" type="image/jpeg" />` : ''}
      ${item.price ? `<price>$${parseFloat(item.price).toFixed(2)}</price>` : ''}
      ${item.condition ? `<condition>${escapeXml(item.condition)}</condition>` : ''}
    </item>`;
            } catch (itemError) {
                console.warn('Error processing RSS item:', itemError, item);
                // Continue with next item
            }
        });
    }

    // Close the XML document
    xml += `
  </channel>
</rss>`;

    return xml;
}

/**
 * Escape XML special characters
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export default router; 