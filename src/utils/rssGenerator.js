/**
 * @fileoverview RSS feed generation utilities
 * @module utils/rssGenerator
 */

/**
 * Generate an RSS XML feed from marketplace items
 * 
 * @param {Array} items - The marketplace items to include in the feed
 * @param {string} siteUrl - The base URL of the site
 * @returns {string} The RSS XML document
 */
export function generateRssXml(items, siteUrl) {
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
    <title>UKG Classifieds - Latest Items</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>The latest items available on the UKG Classifieds</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(siteUrl)}/image/logo.png</url>
      <title>UKG Classifieds</title>
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
export function escapeXml(text) {
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