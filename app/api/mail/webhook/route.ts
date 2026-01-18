import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { detectEmailType, parseAppleOrderEmail, parseAppleShippingEmail, formatDateForInput } from '@/lib/appleMailParser';
import { fetchOrderTokenViaRedirect } from '@/lib/appleOrderToken';

interface WebhookPayload {
    from: string;
    to: string;
    subject: string;
    rawEmail: string;
}

/**
 * Extract email body from MIME format raw email
 * Handles multipart messages, Base64 and quoted-printable encoding
 */
function extractEmailBody(rawEmail: string): string {
    try {
        console.log('🔍 Starting email body extraction...');

        // Split email into lines
        const lines = rawEmail.split(/\r?\n/);
        console.log('  Total lines:', lines.length);

        // Find Content-Type header
        let contentType = '';
        let boundary = '';
        let inHeaders = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Empty line marks end of headers
            if (line.trim() === '' && inHeaders) {
                inHeaders = false;
                console.log('  Headers ended at line:', i);
                continue;
            }

            if (inHeaders) {
                if (line.toLowerCase().startsWith('content-type:')) {
                    contentType = line.substring(13).trim();
                    console.log('  Content-Type found:', contentType);

                    // Extract boundary if multipart
                    const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);
                    if (boundaryMatch) {
                        boundary = boundaryMatch[1];
                        console.log('  Boundary found:', boundary);
                    }
                }
            }
        }

        // If multipart, extract parts
        if (boundary) {
            return extractMultipartBody(rawEmail, boundary);
        }

        // If not multipart, extract single part body
        return extractSinglePartBody(rawEmail);

    } catch (error) {
        console.error('Error extracting email body:', error);
        return rawEmail; // Fallback to raw email
    }
}

/**
 * Extract body from multipart MIME message
 */
function extractMultipartBody(rawEmail: string, boundary: string): string {
    const parts = rawEmail.split(`--${boundary}`);
    console.log('  📦 Multipart: Found', parts.length, 'parts');

    // Try to find text/plain part first, then text/html
    let plainTextPart = '';
    let htmlPart = '';

    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const part = parts[partIndex];
        console.log(`  \n  🔍 Processing part ${partIndex}/${parts.length - 1}`);

        // Skip empty parts or parts that are just the closing boundary
        if (part.trim() === '' || part.trim() === '--') {
            console.log('    ⏭️  Skipping empty/closing part');
            continue;
        }

        const lines = part.split(/\r?\n/);
        console.log('    📊 Total lines in part:', lines.length);
        console.log('    📝 First 10 lines of part:');
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const preview = lines[i].length > 80 ? lines[i].substring(0, 80) + '...' : lines[i];
            console.log(`      [${i}]: "${preview}"`);
        }

        let partContentType = '';
        let partEncoding = '';
        let bodyStartIndex = 0;
        let inHeaders = true;
        let headerStarted = false;

        // Parse part headers
        // Skip leading empty lines first
        let startLine = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                startLine = i;
                console.log('    🎯 Headers start at line:', startLine);
                break;
            }
        }

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];

            // Empty line marks end of headers (only after headers have started)
            if (line.trim() === '' && headerStarted) {
                bodyStartIndex = i + 1;
                inHeaders = false;
                console.log('    ✋ Part headers ended at line:', i);
                break;
            }

            if (inHeaders && line.trim() !== '') {
                headerStarted = true;
                const lowerLine = line.toLowerCase();

                if (lowerLine.startsWith('content-type:')) {
                    partContentType = line.substring(13).trim();
                    console.log('    📋 Part Content-Type:', partContentType);
                }

                if (lowerLine.startsWith('content-transfer-encoding:')) {
                    partEncoding = line.substring(26).trim().toLowerCase();
                    console.log('    🔐 Part Encoding:', partEncoding);
                }
            }
        }

        // Skip if no body found
        if (bodyStartIndex === 0) {
            console.log('    ⚠️  No body found in this part');
            continue;
        }

        // Extract body
        const bodyLines = lines.slice(bodyStartIndex);
        let body = bodyLines.join('\n').trim();
        console.log('    📏 Body length before decoding:', body.length);

        // Skip empty bodies
        if (body.length === 0) {
            console.log('    ⏭️  Skipping empty body');
            continue;
        }

        // Decode if needed
        if (partEncoding === 'base64') {
            try {
                const decoded = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
                console.log('    ✅ Decoded base64, length:', decoded.length);
                body = decoded;
            } catch (e) {
                console.error('    ❌ Error decoding base64:', e);
            }
        } else if (partEncoding === 'quoted-printable') {
            body = decodeQuotedPrintable(body);
            console.log('    ✅ Decoded quoted-printable, length:', body.length);
        }

        // Store based on content type (case-insensitive matching)
        const contentTypeLower = partContentType.toLowerCase();

        if (contentTypeLower.includes('text/plain')) {
            console.log('    ✅ Found text/plain part, length:', body.length);
            plainTextPart = body;
        } else if (contentTypeLower.includes('text/html')) {
            console.log('    ✅ Found text/html part, length:', body.length);
            htmlPart = body;
        } else if (partContentType) {
            console.log('    ℹ️  Other content type:', partContentType);
        }
    }

    // Prefer plain text, fallback to HTML (stripped)
    if (plainTextPart) {
        console.log('  ✅ Returning plain text part');
        return plainTextPart;
    } else if (htmlPart) {
        console.log('  ✅ Returning stripped HTML part');
        return stripHtmlTags(htmlPart);
    }

    console.log('  ⚠️ No text/plain or text/html part found');
    return '';
}

/**
 * Extract body from single-part MIME message
 */
function extractSinglePartBody(rawEmail: string): string {
    console.log('  📄 Extracting single-part body...');
    const lines = rawEmail.split(/\r?\n/);
    let encoding = '';
    let bodyStartIndex = 0;

    // Find headers
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim() === '') {
            bodyStartIndex = i + 1;
            console.log('    Body starts at line:', i + 1);
            break;
        }

        if (line.toLowerCase().startsWith('content-transfer-encoding:')) {
            encoding = line.substring(26).trim().toLowerCase();
            console.log('    Encoding:', encoding);
        }
    }

    // Extract body
    const bodyLines = lines.slice(bodyStartIndex);
    let body = bodyLines.join('\n').trim();
    console.log('    Body length before decoding:', body.length);

    // Decode if needed
    if (encoding === 'base64') {
        try {
            const decoded = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
            console.log('    Decoded base64, length:', decoded.length);
            body = decoded;
        } catch (e) {
            console.error('Error decoding base64:', e);
        }
    } else if (encoding === 'quoted-printable') {
        body = decodeQuotedPrintable(body);
        console.log('    Decoded quoted-printable, length:', body.length);
    }

    console.log('  ✅ Extracted body length:', body.length);

    return body;
}

/**
 * Decode quoted-printable encoding
 */
function decodeQuotedPrintable(text: string): string {
    return text
        .replace(/=\r?\n/g, '') // Remove soft line breaks
        .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
    return html
        .replace(/\u003cstyle[^\u003e]*\u003e[\s\S]*?\u003c\/style\u003e/gi, '')
        .replace(/\u003cscript[^\u003e]*\u003e[\s\S]*?\u003c\/script\u003e/gi, '')
        .replace(/\u003c[^\u003e]+\u003e/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '\u003c')
        .replace(/&gt;/g, '\u003e')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract HTML body from MIME format email (for order_token extraction)
 * Returns the raw HTML content without stripping tags
 */
function extractEmailHtmlBody(rawEmail: string): string {
    try {
        console.log('🔍 Extracting HTML body for order_token...');

        const lines = rawEmail.split(/\r?\n/);

        // Find Content-Type header
        let contentType = '';
        let boundary = '';
        let inHeaders = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trim() === '' && inHeaders) {
                inHeaders = false;
                continue;
            }

            if (inHeaders) {
                if (line.toLowerCase().startsWith('content-type:')) {
                    contentType = line.substring(13).trim();
                    const boundaryMatch = contentType.match(/boundary=["']?([^"';]+)["']?/i);
                    if (boundaryMatch) {
                        boundary = boundaryMatch[1];
                    }
                }
            }
        }

        // If multipart, extract HTML part
        if (boundary) {
            const parts = rawEmail.split(`--${boundary}`);

            for (const part of parts) {
                if (part.trim() === '' || part.trim() === '--') continue;

                const partLines = part.split(/\r?\n/);
                let partContentType = '';
                let partEncoding = '';
                let bodyStartIndex = 0;
                let inPartHeaders = true;
                let headerStarted = false;

                // Skip leading empty lines
                let startLine = 0;
                for (let i = 0; i < partLines.length; i++) {
                    if (partLines[i].trim() !== '') {
                        startLine = i;
                        break;
                    }
                }

                // Parse part headers
                for (let i = startLine; i < partLines.length; i++) {
                    const line = partLines[i];

                    if (line.trim() === '' && headerStarted) {
                        bodyStartIndex = i + 1;
                        inPartHeaders = false;
                        break;
                    }

                    if (inPartHeaders && line.trim() !== '') {
                        headerStarted = true;
                        const lowerLine = line.toLowerCase();

                        if (lowerLine.startsWith('content-type:')) {
                            partContentType = line.substring(13).trim();
                        }

                        if (lowerLine.startsWith('content-transfer-encoding:')) {
                            partEncoding = line.substring(26).trim().toLowerCase();
                        }
                    }
                }

                // Check if this is HTML part
                if (partContentType.toLowerCase().includes('text/html')) {
                    const bodyLines = partLines.slice(bodyStartIndex);
                    let body = bodyLines.join('\n').trim();

                    // Decode if needed
                    if (partEncoding === 'base64') {
                        try {
                            body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
                        } catch (e) {
                            console.error('Error decoding HTML base64:', e);
                        }
                    } else if (partEncoding === 'quoted-printable') {
                        body = decodeQuotedPrintable(body);
                    }

                    console.log('  ✅ Found HTML part, length:', body.length);
                    return body;
                }
            }
        }

        console.log('  ⚠️ No HTML part found');
        return '';

    } catch (error) {
        console.error('Error extracting HTML body:', error);
        return '';
    }
}


export async function POST(request: NextRequest) {
    try {
        const body: WebhookPayload = await request.json();
        const { from, to, subject, rawEmail } = body;

        console.log('📧 Received email webhook:');
        console.log('  From:', from);
        console.log('  To:', to);
        console.log('  Subject:', subject);
        console.log('📨 Raw email length:', rawEmail?.length || 0);

        // Determine email type from subject
        let emailType: 'order_confirmation' | 'order_thanks' | 'shipping_notification' | 'invoice' | 'survey' | 'unknown' = 'unknown';

        if (subject.includes('ご注文の確認')) {
            emailType = 'order_confirmation';
            console.log('  Type: Order confirmation');
        } else if (subject.includes('ご注文ありがとうございます')) {
            emailType = 'order_thanks';
            console.log('  Type: Order thanks');
        } else if (subject.includes('配送中') || subject.includes('お客様の商品は配送中です')) {
            emailType = 'shipping_notification';
            console.log('  Type: Shipping notification');
        } else if (subject.includes('請求金額のお知らせ')) {
            emailType = 'invoice';
            console.log('  Type: Invoice');
        } else if (subject.includes('ご購入時の体験はいかがでしたか')) {
            emailType = 'survey';
            console.log('  Type: Survey');
        } else {
            console.log('  Type: Unknown');
        }

        // Variables for logging
        let processResult: 'success' | 'skipped' | 'error' = 'skipped';
        let inventoryId: string | null = null;
        let logNotes: string | null = null;
        let userId: string | null = null;
        let orderNumber: string | null = null;

        // Create service role client (bypass RLS)
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Extract To email from header (連絡先メール) - kept for processOrderConfirmationEmail
        const toEmail = to;

        // Extract From email (Gmail転送の場合、Fromが連絡先メール)
        const contactEmailAddress = from;
        console.log('  🔍 Looking up user from contact_emails for From:', contactEmailAddress);

        const { data: contactEmail } = await supabaseAdmin
            .from('contact_emails')
            .select('user_id, id')
            .eq('email', contactEmailAddress)
            .limit(1)
            .single();

        if (contactEmail) {
            userId = contactEmail.user_id;
            console.log('  ✅ Found user_id:', userId);
        } else {
            console.log('  ⚠️  No user found for email:', contactEmailAddress);
            logNotes = `User not found for email: ${contactEmailAddress}`;
        }

        // Process based on email type
        if (emailType === 'order_confirmation' && userId && contactEmail) {
            const result = await processOrderConfirmationEmail(contactEmailAddress, contactEmail.id, rawEmail, userId, supabaseAdmin);
            processResult = result.success ? 'success' : 'error';
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
        } else if (emailType === 'shipping_notification' && userId) {
            const result = await processShippingNotificationEmail(rawEmail, userId, supabaseAdmin);
            processResult = result.success ? 'success' : 'error';
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
        } else {
            console.log('  Skipping processing for this email type');
            logNotes = userId ? `Email type ${emailType} - no processing` : `User not found for ${contactEmailAddress}`;
        }


        // Map email type to database schema values
        let dbEmailType: 'order' | 'shipping' | 'delivery' | 'invoice' | 'unknown' = 'unknown';
        if (emailType === 'order_confirmation' || emailType === 'order_thanks') {
            dbEmailType = 'order';
        } else if (emailType === 'shipping_notification') {
            dbEmailType = 'shipping';
        } else if (emailType === 'invoice') {
            dbEmailType = 'invoice';
        } else if (emailType === 'survey') {
            dbEmailType = 'unknown';
        }

        // Log email to database if user was found
        if (userId) {
            try {
                const now = new Date().toISOString();
                const logData = {
                    user_id: userId,
                    email_type: dbEmailType,
                    subject: subject,
                    sender: contactEmailAddress,
                    order_number: orderNumber,
                    status: processResult,
                    error_message: logNotes,
                    parsed_data: inventoryId ? { inventory_id: inventoryId } : null,
                    received_at: now,
                    processed_at: now,
                };

                console.log('  📝 Logging email to database:', logData);

                const { error: logError } = await supabaseAdmin
                    .from('email_logs')
                    .insert(logData);

                if (logError) {
                    console.error('  ❌ Error logging email:', logError);
                } else {
                    console.log('  ✅ Email logged to database');
                }
            } catch (logError) {
                console.error('  ❌ Exception logging email:', logError);
            }
        }

        // Always return 200 to prevent Cloudflare from retrying
        return NextResponse.json({
            success: true,
            message: 'Email received',
            emailType
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Still return 200 to prevent retries
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 200 });
    }
}

async function processOrderConfirmationEmail(
    contactEmail: string,
    contactEmailId: string,
    rawEmail: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; inventoryId?: string; orderNumber?: string; notes?: string }> {
    try {
        console.log('  📦 Processing order confirmation email...');

        // Extract email body from MIME format
        const emailText = extractEmailBody(rawEmail);
        console.log('  📄 Extracted body (first 500 chars):', emailText.substring(0, 500));

        const orders = parseAppleOrderEmail(emailText);

        if (orders.length === 0) {
            console.log('  ⚠️  No orders found in email');
            return { success: false, notes: 'No orders found in email' };
        }

        console.log(`  ✅ Found ${orders.length} order(s)`);

        const orderNumber = orders[0].orderNumber;
        let lastInventoryId: string | null = null;

        // Extract order token from guest order URL
        // Example: https://secure8.store.apple.com/jp/shop/order/guest/W1528936835/d5bd9f4c1e7d2c409086923e2bddbfc216cf689dcfd86ba0b59f9182c4aecae926838df27f3f72c7d3629e9e3e8d46b69ee81b2600fc3e49d074b294f1eaa4734a5eedbafd8dab1affd60f1ed8c8848f706519a8091d795aa4be8b26b8a75c19?e=true
        let orderToken: string | null = null;

        // Try to find token in plain text first
        let tokenMatch = emailText.match(/\/shop\/order\/guest\/W\d+\/([a-f0-9]+)\?/i);
        if (tokenMatch) {
            orderToken = tokenMatch[1];
            console.log(`  🔑 Extracted order token from plain text: ${orderToken.substring(0, 20)}...`);
        } else {
            // If not found in plain text, try HTML part
            console.log('  ⚠️  No order token found in plain text, trying HTML part...');
            const emailHtml = extractEmailHtmlBody(rawEmail);
            if (emailHtml) {
                tokenMatch = emailHtml.match(/\/shop\/order\/guest\/W\d+\/([a-f0-9]+)\?/i);
                if (tokenMatch) {
                    orderToken = tokenMatch[1];
                    console.log(`  🔑 Extracted order token from HTML: ${orderToken.substring(0, 20)}...`);
                } else {
                    console.log('  ⚠️  No order token found in HTML either');
                }
            } else {
                console.log('  ⚠️  No HTML part available');
            }
        }

        // If token still not found, try fetching via redirect
        if (!orderToken) {
            console.log('  🔄 Attempting to fetch order token via redirect...');

            // Get the contact email address from contact_emails table
            const { data: contactEmailData } = await supabaseAdmin
                .from('contact_emails')
                .select('email')
                .eq('id', contactEmailId)
                .single();

            if (contactEmailData?.email) {
                const fetchedToken = await fetchOrderTokenViaRedirect(orderNumber, contactEmailData.email);
                if (fetchedToken) {
                    orderToken = fetchedToken;
                    console.log(`  ✅ Got order token from redirect: ${orderToken.substring(0, 20)}...`);
                } else {
                    console.log('  ⚠️  Failed to get order token from redirect');
                }
            } else {
                console.log('  ⚠️  Could not retrieve contact email for redirect fetch');
            }
        }


        // Process each product in the order
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const itemIndex = i + 1;
            const inventoryCode = `${order.orderNumber}-${itemIndex}`;

            console.log(`  📝 Processing item ${itemIndex}/${orders.length}: ${inventoryCode}`);
            console.log(`     Model: ${order.modelName} ${order.storage} ${order.color}`);
            console.log(`     Price: ¥${order.price.toLocaleString()}`);

            // Check if inventory already exists (by order_number + item_index)
            const { data: existing } = await supabaseAdmin
                .from('inventory')
                .select('id')
                .eq('order_number', order.orderNumber)
                .eq('item_index', itemIndex)
                .single();

            const inventoryData = {
                user_id: userId,
                inventory_code: inventoryCode,
                order_number: order.orderNumber,
                item_index: itemIndex,
                model_name: order.modelName,
                storage: order.storage,
                color: order.color,
                status: 'ordered',
                purchase_price: order.price,
                expected_price: order.price, // Will be updated by price history lookup
                order_date: formatDateForInput(order.orderDate),
                expected_delivery_start: formatDateForInput(order.deliveryStart),
                expected_delivery_end: formatDateForInput(order.deliveryEnd),
                original_delivery_start: formatDateForInput(order.deliveryStart),
                original_delivery_end: formatDateForInput(order.deliveryEnd),
                purchase_source: 'Apple Store',
                contact_email_id: contactEmailId,
                order_token: orderToken, // Add extracted token
            };

            if (existing) {
                // Update existing record
                console.log(`  ℹ️  Updating existing inventory: ${existing.id}`);
                const { error } = await supabaseAdmin
                    .from('inventory')
                    .update(inventoryData)
                    .eq('id', existing.id);

                if (error) {
                    console.error(`  ❌ Error updating inventory:`, error);
                    return { success: false, orderNumber, notes: `Error updating inventory: ${error.message}` };
                } else {
                    console.log(`  ✅ Inventory updated successfully`);
                    lastInventoryId = existing.id;
                }
            } else {
                // Insert new record
                const { data: newInventory, error } = await supabaseAdmin
                    .from('inventory')
                    .insert(inventoryData)
                    .select('id')
                    .single();

                if (error) {
                    console.error(`  ❌ Error inserting inventory:`, error);
                    return { success: false, orderNumber, notes: `Error inserting inventory: ${error.message}` };
                } else {
                    console.log(`  ✅ Inventory created successfully: ${newInventory.id}`);
                    lastInventoryId = newInventory.id;
                }
            }
        }

        return {
            success: true,
            inventoryId: lastInventoryId || undefined,
            orderNumber,
            notes: `Processed ${orders.length} item(s) for order ${orderNumber}`
        };
    } catch (error) {
        console.error('  ❌ Error processing order confirmation email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}


async function processShippingNotificationEmail(
    rawEmail: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; inventoryId?: string; orderNumber?: string; notes?: string }> {
    try {
        console.log('  📦 Processing shipping notification email...');

        // Extract email body from MIME format
        const emailText = extractEmailBody(rawEmail);
        console.log('  📄 Extracted body (first 500 chars):', emailText.substring(0, 500));

        const shippingInfo = parseAppleShippingEmail(emailText);

        if (!shippingInfo) {
            console.log('  ⚠️  No shipping info found in email');
            return { success: false, notes: 'No shipping info found in email' };
        }

        console.log(`  ✅ Found shipping info for order: ${shippingInfo.orderNumber}`);
        console.log(`     Carrier: ${shippingInfo.carrier}`);
        console.log(`     Tracking: ${shippingInfo.trackingNumber}`);

        // Find all inventory items with this order number (can be multiple)
        const { data: inventoryItems, error: fetchError } = await supabaseAdmin
            .from('inventory')
            .select('id, status, item_index')
            .eq('order_number', shippingInfo.orderNumber)
            .eq('user_id', userId);

        if (fetchError || !inventoryItems || inventoryItems.length === 0) {
            console.log(`  ⚠️  No inventory found for order: ${shippingInfo.orderNumber}`);
            return { success: false, orderNumber: shippingInfo.orderNumber, notes: `Order not found: ${shippingInfo.orderNumber}` };
        }

        console.log(`  📦 Found ${inventoryItems.length} inventory item(s) for this order`);

        // Update all items with shipping information
        const updateData = {
            status: 'shipped',
            carrier: shippingInfo.carrier,
            tracking_number: shippingInfo.trackingNumber,
        };

        const { error: updateError } = await supabaseAdmin
            .from('inventory')
            .update(updateData)
            .eq('order_number', shippingInfo.orderNumber)
            .eq('user_id', userId);

        if (updateError) {
            console.error(`  ❌ Error updating shipping info:`, updateError);
            return {
                success: false,
                orderNumber: shippingInfo.orderNumber,
                notes: `Error updating: ${updateError.message}`
            };
        } else {
            console.log(`  ✅ Updated ${inventoryItems.length} item(s) with shipping info`);
            return {
                success: true,
                inventoryId: inventoryItems[0].id,
                orderNumber: shippingInfo.orderNumber,
                notes: `Updated ${inventoryItems.length} item(s) for order ${shippingInfo.orderNumber}`
            };
        }
    } catch (error) {
        console.error('  ❌ Error processing shipping notification email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}
