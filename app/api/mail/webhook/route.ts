import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { detectEmailType, parseAppleOrderEmail, parseAppleShippingEmail, formatDateForInput } from '@/lib/appleMailParser';

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
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
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
        console.log('📨 Raw email (first 1000 chars):', rawEmail?.substring(0, 1000));

        // Determine email type from subject
        let emailType: 'order' | 'shipping' | 'billing' | 'survey' | 'unknown' = 'unknown';

        if (subject.includes('ご注文の確認') || subject.includes('ご注文ありがとうございます')) {
            emailType = 'order';
            console.log('  Type: Order confirmation');
        } else if (subject.includes('お届け予定日') || subject.includes('発送のお知らせ') || subject.includes('配送中')) {
            emailType = 'shipping';
            console.log('  Type: Shipping notification');
        } else if (subject.includes('請求金額')) {
            emailType = 'billing';
            console.log('  Type: Billing');
        } else if (subject.includes('体験はいかがでしたか')) {
            emailType = 'survey';
            console.log('  Type: Survey');
        } else {
            console.log('  Type: Unknown');
        }

        // Process based on email type
        if (emailType === 'order') {
            await processOrderEmail(from, rawEmail);
        } else if (emailType === 'shipping') {
            await processShippingEmail(from, rawEmail);
        } else {
            console.log('  Skipping processing for this email type');
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

async function processOrderEmail(fromEmail: string, rawEmail: string) {
    try {
        console.log('  📦 Processing order email...');

        // Extract email body from MIME format
        const emailText = extractEmailBody(rawEmail);
        console.log('  📄 Extracted body (first 500 chars):', emailText.substring(0, 500));

        const orders = parseAppleOrderEmail(emailText);

        if (orders.length === 0) {
            console.log('  ⚠️  No orders found in email');
            return;
        }

        console.log(`  ✅ Found ${orders.length} order(s)`);

        // Create service role client to bypass RLS
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

        // Look up user from contact_emails table using sender email
        console.log('  🔍 Looking up user from contact_emails for:', fromEmail);
        const { data: contactEmail, error: lookupError } = await supabaseAdmin
            .from('contact_emails')
            .select('user_id')
            .eq('email', fromEmail)
            .limit(1)
            .single();

        if (lookupError || !contactEmail) {
            console.log('  ⚠️  No user found for email:', fromEmail);
            console.log('  ⚠️  Skipping database insert');
            return;
        }

        const userId = contactEmail.user_id;
        console.log('  ✅ Found user_id:', userId);

        for (const order of orders) {
            console.log(`  📝 Order: ${order.orderNumber} - ${order.modelName} ${order.storage}`);

            // Check if order already exists
            const { data: existing } = await supabaseAdmin
                .from('inventory')
                .select('id')
                .eq('order_number', order.orderNumber)
                .eq('model_name', order.modelName)
                .eq('storage', order.storage)
                .single();

            if (existing) {
                console.log(`  ℹ️  Order already exists, skipping`);
                continue;
            }

            // Insert new inventory item
            const { error } = await supabaseAdmin
                .from('inventory')
                .insert({
                    user_id: userId,
                    model_name: order.modelName,
                    storage: order.storage,
                    color: order.color,
                    status: 'ordered',
                    purchase_price: order.price,
                    expected_price: order.price, // Will be updated by price history lookup
                    order_number: order.orderNumber,
                    order_date: formatDateForInput(order.orderDate),
                    expected_delivery_start: formatDateForInput(order.deliveryStart),
                    expected_delivery_end: formatDateForInput(order.deliveryEnd),
                    payment_card: order.paymentCard,
                    purchase_source: 'Apple Store',
                });

            if (error) {
                console.error(`  ❌ Error inserting order:`, error);
            } else {
                console.log(`  ✅ Order inserted successfully`);
            }
        }
    } catch (error) {
        console.error('  ❌ Error processing order email:', error);
    }
}

async function processShippingEmail(fromEmail: string, rawEmail: string) {
    try {
        console.log('  📦 Processing shipping email...');

        // Extract email body from MIME format
        const emailText = extractEmailBody(rawEmail);
        console.log('  📄 Extracted body (first 500 chars):', emailText.substring(0, 500));

        const shippingInfo = parseAppleShippingEmail(emailText);

        if (!shippingInfo) {
            console.log('  ⚠️  No shipping info found in email');
            return;
        }

        console.log(`  ✅ Found shipping info for order: ${shippingInfo.orderNumber}`);
        console.log(`     Carrier: ${shippingInfo.carrier}`);
        console.log(`     Tracking: ${shippingInfo.trackingNumber}`);

        // Create service role client to bypass RLS
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

        // Look up user from contact_emails table using sender email
        console.log('  🔍 Looking up user from contact_emails for:', fromEmail);
        const { data: contactEmail, error: lookupError } = await supabaseAdmin
            .from('contact_emails')
            .select('user_id')
            .eq('email', fromEmail)
            .limit(1)
            .single();

        if (lookupError || !contactEmail) {
            console.log('  ⚠️  No user found for email:', fromEmail);
            console.log('  ⚠️  Skipping database update');
            return;
        }

        const userId = contactEmail.user_id;
        console.log('  ✅ Found user_id:', userId);

        // Find inventory item by order number
        const { data: inventory, error: fetchError } = await supabaseAdmin
            .from('inventory')
            .select('id, status')
            .eq('order_number', shippingInfo.orderNumber)
            .single();

        if (fetchError || !inventory) {
            console.log(`  ⚠️  Order not found in inventory: ${shippingInfo.orderNumber}`);
            return;
        }

        // Update with shipping information
        const { error: updateError } = await supabaseAdmin
            .from('inventory')
            .update({
                status: 'shipped',
                carrier: shippingInfo.carrier,
                tracking_number: shippingInfo.trackingNumber,
            })
            .eq('id', inventory.id);

        if (updateError) {
            console.error(`  ❌ Error updating shipping info:`, updateError);
        } else {
            console.log(`  ✅ Shipping info updated successfully`);
        }
    } catch (error) {
        console.error('  ❌ Error processing shipping email:', error);
    }
}
