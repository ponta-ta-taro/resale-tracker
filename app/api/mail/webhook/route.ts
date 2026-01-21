import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { detectEmailType, parseAppleOrderEmail, parseAppleShippingEmail, formatDateForInput } from '@/lib/appleMailParser';
import { detectAmazonEmailType, parseAmazonOrderEmail, parseAmazonShippingEmail, parseAmazonDeliveryEmail } from '@/lib/amazonMailParser';
import { fetchOrderTokenViaRedirect } from '@/lib/appleOrderToken';

export const dynamic = 'force-dynamic';

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
 * Decode quoted-printable encoding with proper UTF-8 support
 */
function decodeQuotedPrintable(str: string): string {
    // Remove soft line breaks
    str = str.replace(/=\r?\n/g, '');

    // Convert =XX to byte array and decode as UTF-8
    const bytes: number[] = [];
    let i = 0;
    while (i < str.length) {
        if (str[i] === '=' && i + 2 < str.length) {
            const hex = str.substring(i + 1, i + 3);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
                bytes.push(parseInt(hex, 16));
                i += 3;
                continue;
            }
        }
        bytes.push(str.charCodeAt(i));
        i++;
    }

    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
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

                    console.log('  📧 HTML part encoding:', partEncoding);
                    console.log('  📏 HTML body length before decoding:', body.length);

                    // Decode if needed (case-insensitive check)
                    const encoding = partEncoding.toLowerCase();
                    if (encoding === 'base64') {
                        try {
                            body = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
                            console.log('  ✅ Decoded base64, new length:', body.length);
                        } catch (e) {
                            console.error('  ❌ Error decoding HTML base64:', e);
                        }
                    } else if (encoding === 'quoted-printable') {
                        const beforeLength = body.length;
                        body = decodeQuotedPrintable(body);
                        console.log('  ✅ Decoded quoted-printable, before:', beforeLength, 'after:', body.length);
                        // Log a sample of decoded content for debugging
                        const sample = body.substring(0, 200).replace(/\s+/g, ' ');
                        console.log('  📝 Decoded sample:', sample);
                    } else if (encoding) {
                        console.log('  ℹ️  Encoding not decoded:', encoding);
                    }

                    console.log('  ✅ Found HTML part, final length:', body.length);
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

        // Determine email type from sender and subject
        let emailType: 'order_confirmation' | 'order_thanks' | 'shipping_notification' | 'delivery_update' | 'invoice' | 'survey' | 'amazon_order_confirmation' | 'amazon_shipping_notification' | 'amazon_out_for_delivery' | 'amazon_delivered' | 'forwarding_confirmation' | 'unknown' = 'unknown';

        // Check for Gmail forwarding confirmation email first
        if (from.includes('forwarding-noreply@google.com') && subject.includes('Gmail の転送の確認')) {
            emailType = 'forwarding_confirmation';
            console.log('  Type: Gmail forwarding confirmation');
        }
        // Check for Amazon emails (by sender address)
        else if (detectAmazonEmailType(from, subject) !== 'unknown') {
            const amazonType = detectAmazonEmailType(from, subject);
            if (amazonType === 'amazon_order') {
                emailType = 'amazon_order_confirmation';
                console.log('  Type: Amazon order confirmation');
            } else if (amazonType === 'amazon_shipped') {
                emailType = 'amazon_shipping_notification';
                console.log('  Type: Amazon shipping notification');
            } else if (amazonType === 'amazon_out_for_delivery') {
                emailType = 'amazon_out_for_delivery';
                console.log('  Type: Amazon out for delivery');
            } else if (amazonType === 'amazon_delivered') {
                emailType = 'amazon_delivered';
                console.log('  Type: Amazon delivered');
            }
        }
        // Check for Apple emails (by subject patterns)
        else if (subject.includes('ご注文の確認')) {
            emailType = 'order_confirmation';
            console.log('  Type: Order confirmation');
        } else if (subject.includes('ご注文ありがとうございます')) {
            emailType = 'order_thanks';
            console.log('  Type: Order thanks');
        } else if (subject.includes('配送中') || subject.includes('お客様の商品は配送中です')) {
            emailType = 'shipping_notification';
            console.log('  Type: Shipping notification');
        } else if (subject.includes('ご注文に関するお知らせ')) {
            emailType = 'delivery_update';
            console.log('  Type: Delivery update');
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
        let processResult: 'success' | 'skipped_unsupported' | 'skipped_duplicate' | 'pending' | 'error' = 'skipped_unsupported';
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
        let parsedData: Record<string, any> | null = null;
        if (emailType === 'order_confirmation' && userId && contactEmail) {
            const result = await processOrderConfirmationEmail(contactEmailAddress, contactEmail.id, rawEmail, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if (emailType === 'amazon_order_confirmation' && userId && contactEmail) {
            const result = await processAmazonOrderEmail(contactEmailAddress, contactEmail.id, rawEmail, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if (emailType === 'shipping_notification' && userId) {
            const result = await processShippingNotificationEmail(rawEmail, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if (emailType === 'amazon_shipping_notification' && userId) {
            const result = await processAmazonShippingEmail(rawEmail, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if (emailType === 'delivery_update' && userId) {
            const result = await processDeliveryUpdateEmail(rawEmail, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if ((emailType === 'amazon_out_for_delivery' || emailType === 'amazon_delivered') && userId) {
            const result = await processAmazonDeliveryEmail(rawEmail, subject, userId, supabaseAdmin);
            if (result.success) {
                processResult = result.isDuplicate ? 'skipped_duplicate' : 'success';
            } else {
                processResult = 'error';
            }
            inventoryId = result.inventoryId || null;
            logNotes = result.notes || null;
            orderNumber = result.orderNumber || null;
            parsedData = result.parsedData || null;
        } else if (emailType === 'forwarding_confirmation') {
            // Process Gmail forwarding confirmation email
            console.log('  📧 Processing Gmail forwarding confirmation...');

            // Extract email address from subject: "Gmail の転送の確認 - xxx@gmail.com"
            const emailMatch = subject.match(/Gmail の転送の確認\s*-\s*([^\s]+@[^\s]+)/);
            const userEmail = emailMatch ? emailMatch[1] : null;

            console.log('  📧 Extracted user email from subject:', userEmail);

            if (userEmail) {
                // Look up user by email in contact_emails
                const { data: contactEmailData } = await supabaseAdmin
                    .from('contact_emails')
                    .select('user_id')
                    .eq('email', userEmail)
                    .limit(1)
                    .single();

                if (contactEmailData) {
                    userId = contactEmailData.user_id;
                    console.log('  ✅ Found user_id for forwarding confirmation:', userId);

                    // Decode email body first (Gmail sends base64-encoded content)
                    const emailBody = extractEmailBody(rawEmail);
                    console.log('  📄 Decoded email body length:', emailBody.length);
                    console.log('  📄 Email body preview (first 500 chars):', emailBody.substring(0, 500));

                    // Extract confirmation link from decoded email body
                    // Look for https://mail.google.com/mail/vf-... pattern
                    const linkMatch = emailBody.match(/(https:\/\/mail\.google\.com\/mail\/vf-[^\s<>"]+)/);
                    const confirmationLink = linkMatch ? linkMatch[1] : null;

                    console.log('  🔗 Extracted confirmation link:', confirmationLink ? 'Found' : 'Not found');
                    if (confirmationLink) {
                        console.log('  🔗 Link preview:', confirmationLink.substring(0, 100) + '...');
                    }

                    if (confirmationLink) {
                        parsedData = {
                            confirmation_link: confirmationLink,
                            user_email: userEmail
                        };
                        processResult = 'pending';
                        logNotes = `Forwarding confirmation for ${userEmail}`;
                    } else {
                        processResult = 'error';
                        logNotes = 'Could not extract confirmation link from email';
                    }
                } else {
                    console.log('  ⚠️  No user found for email:', userEmail);
                    logNotes = `User not found for email: ${userEmail}`;
                    processResult = 'error';
                }
            } else {
                console.log('  ⚠️  Could not extract email from subject');
                logNotes = 'Could not extract email address from subject';
                processResult = 'error';
            }
        } else {
            console.log('  Skipping processing for this email type');
            processResult = 'skipped_unsupported';
            logNotes = userId ? `Email type ${emailType} - no processing` : `User not found for ${contactEmailAddress}`;
        }


        // Map email type to database schema values
        let dbEmailType: 'order' | 'shipping' | 'delivery' | 'invoice' | 'unknown' = 'unknown';
        if (emailType === 'order_confirmation' || emailType === 'order_thanks' || emailType === 'amazon_order_confirmation') {
            dbEmailType = 'order';
        } else if (emailType === 'shipping_notification' || emailType === 'amazon_shipping_notification' || emailType === 'amazon_out_for_delivery') {
            dbEmailType = 'shipping';
        } else if (emailType === 'delivery_update' || emailType === 'amazon_delivered') {
            dbEmailType = 'delivery';
        } else if (emailType === 'invoice') {
            dbEmailType = 'invoice';
        } else if (emailType === 'survey') {
            dbEmailType = 'unknown';
        }

        // Log email to database if user was found
        if (userId) {
            try {
                const now = new Date().toISOString();

                // Build parsed_data - include partial data even on error/skip
                let finalParsedData = parsedData;
                if (!finalParsedData && orderNumber) {
                    // If no parsed data but we have order number, save at least that
                    finalParsedData = { order_number: orderNumber };
                }

                const logData = {
                    user_id: userId,
                    email_type: dbEmailType,
                    subject: subject,
                    sender: contactEmailAddress,
                    order_number: orderNumber,
                    raw_content: rawEmail,  // Save full raw email
                    status: processResult,
                    error_message: processResult === 'error' ? logNotes : null,
                    parsed_data: finalParsedData,  // Save detailed parsed data
                    received_at: now,
                    processed_at: now,
                };

                console.log('  📝 Logging email to database (raw_content length:', rawEmail?.length || 0, ')');

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
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
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

        // Process each product in the order
        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
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
                .select('id, model_name, storage, color, purchase_price, order_date, original_delivery_start, original_delivery_end')
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
            };

            if (existing) {
                // Debug: Output comparison values
                console.log('  🔍 Comparing existing vs new:');
                console.log('    model_name:', existing.model_name, 'vs', inventoryData.model_name);
                console.log('    storage:', existing.storage, 'vs', inventoryData.storage);
                console.log('    color:', existing.color, 'vs', inventoryData.color);
                console.log('    purchase_price:', existing.purchase_price, '(type:', typeof existing.purchase_price, ') vs', inventoryData.purchase_price, '(type:', typeof inventoryData.purchase_price, ')');
                console.log('    order_date:', existing.order_date, 'vs', inventoryData.order_date);
                console.log('    original_delivery_start:', existing.original_delivery_start, 'vs', inventoryData.original_delivery_start);
                console.log('    original_delivery_end:', existing.original_delivery_end, 'vs', inventoryData.original_delivery_end);

                // Check if data has changed (compare with original_delivery, not expected_delivery)
                const dataChanged =
                    existing.model_name !== inventoryData.model_name ||
                    existing.storage !== inventoryData.storage ||
                    existing.color !== inventoryData.color ||
                    existing.purchase_price !== inventoryData.purchase_price ||
                    existing.order_date !== inventoryData.order_date ||
                    existing.original_delivery_start !== inventoryData.original_delivery_start ||
                    existing.original_delivery_end !== inventoryData.original_delivery_end;

                console.log('    dataChanged:', dataChanged);

                if (dataChanged) {
                    // Update existing record
                    // Preserve expected_delivery_start/end (may have been updated by delivery update email)
                    // Only update original_expected_delivery if not already set
                    console.log(`  ℹ️  Updating existing inventory: ${existing.id}`);

                    const updateData: any = {
                        model_name: inventoryData.model_name,
                        storage: inventoryData.storage,
                        color: inventoryData.color,
                        purchase_price: inventoryData.purchase_price,
                        order_date: inventoryData.order_date,
                        purchase_source: inventoryData.purchase_source,
                        contact_email_id: inventoryData.contact_email_id,
                    };

                    // Only update original_expected_delivery if not already set
                    if (!existing.original_delivery_start) {
                        updateData.original_delivery_start = inventoryData.original_delivery_start;
                    }
                    if (!existing.original_delivery_end) {
                        updateData.original_delivery_end = inventoryData.original_delivery_end;
                    }

                    // DO NOT update expected_delivery_start/end - preserve values from delivery update emails

                    const { error } = await supabaseAdmin
                        .from('inventory')
                        .update(updateData)
                        .eq('id', existing.id);

                    if (error) {
                        console.error(`  ❌ Error updating inventory:`, error);
                        return { success: false, orderNumber, notes: `Error updating inventory: ${error.message}` };
                    } else {
                        console.log(`  ✅ Inventory updated successfully (preserved expected_delivery dates)`);
                        lastInventoryId = existing.id;
                        updatedCount++;
                    }
                } else {
                    console.log(`  ⏭️  Skipping duplicate: ${inventoryCode} (no changes)`);
                    lastInventoryId = existing.id;
                    skippedCount++;
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
                    createdCount++;
                }
            }
        }

        // Determine if this was a duplicate (all items skipped)
        const isDuplicate = createdCount === 0 && updatedCount === 0 && skippedCount > 0;

        return {
            success: true,
            isDuplicate,
            inventoryId: lastInventoryId || undefined,
            orderNumber,
            notes: isDuplicate
                ? `Skipped ${skippedCount} duplicate item(s) for order ${orderNumber}`
                : `Created ${createdCount}, updated ${updatedCount}, skipped ${skippedCount} for order ${orderNumber}`,
            parsedData: {
                inventory_id: lastInventoryId,
                order_number: orderNumber,
                model_name: orders[0].modelName,
                storage: orders[0].storage,
                color: orders[0].color,
                purchase_price: orders[0].price,
                expected_delivery_start: formatDateForInput(orders[0].deliveryStart),
                expected_delivery_end: formatDateForInput(orders[0].deliveryEnd),
                item_index: 1,
                items_count: orders.length,
                created_count: createdCount,
                updated_count: updatedCount,
                skipped_count: skippedCount,
            }
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
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
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
            .select('id, status, item_index, carrier, tracking_number')
            .eq('order_number', shippingInfo.orderNumber)
            .eq('user_id', userId);

        if (fetchError || !inventoryItems || inventoryItems.length === 0) {
            console.log(`  ⚠️  No inventory found for order: ${shippingInfo.orderNumber}`);
            return { success: false, orderNumber: shippingInfo.orderNumber, notes: `Order not found: ${shippingInfo.orderNumber}` };
        }

        console.log(`  📦 Found ${inventoryItems.length} inventory item(s) for this order`);

        // Check if data has changed
        const hasChanges = inventoryItems.some((item: any) =>
            item.status !== 'shipped' ||
            item.carrier !== shippingInfo.carrier ||
            item.tracking_number !== shippingInfo.trackingNumber
        );

        if (!hasChanges) {
            console.log(`  ℹ️  No changes detected for shipping info`);
            return {
                success: true,
                isDuplicate: true,
                inventoryId: inventoryItems[0].id,
                orderNumber: shippingInfo.orderNumber,
                notes: `No changes for order ${shippingInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: shippingInfo.orderNumber,
                    carrier: shippingInfo.carrier,
                    tracking_number: shippingInfo.trackingNumber,
                    items_updated: 0
                }
            };
        }

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
                isDuplicate: false,
                inventoryId: inventoryItems[0].id,
                orderNumber: shippingInfo.orderNumber,
                notes: `Updated ${inventoryItems.length} item(s) for order ${shippingInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: shippingInfo.orderNumber,
                    carrier: shippingInfo.carrier,
                    tracking_number: shippingInfo.trackingNumber,
                    items_updated: inventoryItems.length
                }
            };
        }
    } catch (error) {
        console.error('  ❌ Error processing shipping notification email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}


/**
 * Parse delivery update email from HTML
 * Extracts order number and updated delivery dates for each product
 * Works with Gmail forwarding (class attributes may be stripped)
 */
function parseDeliveryUpdateEmail(htmlContent: string): {
    orderNumber: string | null;
    products: Array<{
        modelName: string;
        storage: string;
        color: string;
        deliveryStart: string;
        deliveryEnd: string;
    }>;
} {
    console.log('  🔍 Parsing delivery update email, HTML length:', htmlContent.length);

    // Log a sample of the HTML for debugging
    const htmlSample = htmlContent.substring(0, 500).replace(/\s+/g, ' ');
    console.log('  📝 HTML sample:', htmlSample);

    // Extract order number from HTML (e.g., W1528936835)
    const orderMatch = htmlContent.match(/W\d{10}/);
    const orderNumber = orderMatch ? orderMatch[0] : null;
    console.log('  📦 Order number:', orderNumber);

    const products: Array<any> = [];

    // Find all product names (iPhone models in <strong> tags)
    // Pattern: <strong>iPhone ... </strong>
    const productNameMatches = Array.from(htmlContent.matchAll(/<strong>(iPhone[^<]+)<\/strong>/g));
    console.log('  📱 Found', productNameMatches.length, 'product name(s)');

    // Find all delivery dates
    // Pattern: お届け日： or お届け日: followed by dates
    const deliveryDateMatches = Array.from(htmlContent.matchAll(/お届け日[：:]\s*(\d{4})\/(\d{2})\/(\d{2})\s*-\s*(\d{4})\/(\d{2})\/(\d{2})/g));
    console.log('  📅 Found', deliveryDateMatches.length, 'delivery date(s)');

    // Match products with their delivery dates
    // Assumption: products and dates appear in the same order in the HTML
    const matchCount = Math.min(productNameMatches.length, deliveryDateMatches.length);

    for (let i = 0; i < matchCount; i++) {
        const fullName = productNameMatches[i][1].trim();
        const dateMatch = deliveryDateMatches[i];

        console.log(`  🔧 Processing product ${i + 1}: "${fullName}"`);

        // Parse model, storage, color
        // Example: "iPhone 17 Pro 256GB コズミックオレンジ"
        const parts = fullName.split(' ');
        let modelName = '';
        let storage = '';
        let color = '';

        for (let j = 0; j < parts.length; j++) {
            if (parts[j].match(/^\d+GB$/)) {
                storage = parts[j];
                modelName = parts.slice(0, j).join(' ');
                color = parts.slice(j + 1).join(' ');
                break;
            }
        }

        if (modelName && storage && dateMatch) {
            const deliveryStart = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            const deliveryEnd = `${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`;

            console.log(`  ✅ Extracted: ${modelName} ${storage} ${color}, ${deliveryStart} - ${deliveryEnd}`);

            products.push({
                modelName,
                storage,
                color,
                deliveryStart,
                deliveryEnd
            });
        } else {
            console.log(`  ⚠️  Failed to parse: modelName="${modelName}", storage="${storage}"`);
        }
    }

    console.log('  📊 Total products extracted:', products.length);
    return { orderNumber, products };
}


async function processDeliveryUpdateEmail(
    rawEmail: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
    try {
        console.log('  📦 Processing delivery update email...');

        // Extract HTML body
        const emailHtml = extractEmailHtmlBody(rawEmail);
        if (!emailHtml) {
            console.log('  ⚠️  No HTML body found');
            return { success: false, notes: 'No HTML body found' };
        }

        const parsed = parseDeliveryUpdateEmail(emailHtml);

        if (!parsed.orderNumber) {
            console.log('  ⚠️  No order number found');
            return { success: false, notes: 'No order number found' };
        }

        if (parsed.products.length === 0) {
            console.log('  ⚠️  No products found');
            return { success: false, notes: 'No products found in email' };
        }

        console.log(`  ✅ Found ${parsed.products.length} product(s) for order: ${parsed.orderNumber}`);

        let updatedCount = 0;
        let hasChanges = false;
        let firstInventoryId: string | null = null;

        for (const product of parsed.products) {
            console.log(`  📝 Processing: ${product.modelName} ${product.storage} ${product.color}`);
            console.log(`     New delivery: ${product.deliveryStart} - ${product.deliveryEnd}`);

            // Find matching inventory by order_number + model + storage + color
            const { data: inventoryItems, error: fetchError } = await supabaseAdmin
                .from('inventory')
                .select('id, expected_delivery_start, expected_delivery_end')
                .eq('order_number', parsed.orderNumber)
                .eq('user_id', userId)
                .eq('model_name', product.modelName)
                .eq('storage', product.storage)
                .eq('color', product.color);

            if (fetchError || !inventoryItems || inventoryItems.length === 0) {
                console.log(`  ⚠️  No matching inventory found`);
                continue;
            }

            // Update each matching item
            for (const item of inventoryItems) {
                if (!firstInventoryId) {
                    firstInventoryId = item.id;
                }

                // Check if dates have changed
                const dateChanged =
                    item.expected_delivery_start !== product.deliveryStart ||
                    item.expected_delivery_end !== product.deliveryEnd;

                if (dateChanged) {
                    const { error: updateError } = await supabaseAdmin
                        .from('inventory')
                        .update({
                            expected_delivery_start: product.deliveryStart,
                            expected_delivery_end: product.deliveryEnd
                        })
                        .eq('id', item.id);

                    if (updateError) {
                        console.error(`  ❌ Error updating inventory ${item.id}:`, updateError);
                    } else {
                        console.log(`  ✅ Updated inventory ${item.id}`);
                        updatedCount++;
                        hasChanges = true;
                    }
                } else {
                    console.log(`  ℹ️  No date change for inventory ${item.id}`);
                }
            }
        }

        return {
            success: true,
            isDuplicate: !hasChanges,
            inventoryId: firstInventoryId || undefined,
            orderNumber: parsed.orderNumber,
            notes: hasChanges ? `Updated ${updatedCount} item(s)` : `No changes needed`,
            parsedData: {
                order_number: parsed.orderNumber,
                products: parsed.products,
                updated_count: updatedCount
            }
        };

    } catch (error) {
        console.error('  ❌ Error processing delivery update email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Process Amazon order confirmation email
 */
async function processAmazonOrderEmail(
    contactEmail: string,
    contactEmailId: string,
    rawEmail: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
    try {
        console.log('  📦 Processing Amazon order confirmation email...');

        // Extract email body from MIME format
        const emailText = extractEmailBody(rawEmail);
        console.log('  📄 Extracted body (first 500 chars):', emailText.substring(0, 500));

        const order = parseAmazonOrderEmail(emailText);

        if (!order) {
            console.log('  ⚠️  No order found in email');
            return { success: false, notes: 'No order found in email' };
        }

        console.log(`  ✅ Found order: ${order.orderNumber}`);

        const orderNumber = order.orderNumber;
        const itemIndex = 1; // Amazon emails typically contain one product per email
        const inventoryCode = `A${orderNumber}-${itemIndex}`;

        console.log(`  📝 Processing item: ${inventoryCode}`);
        console.log(`     Model: ${order.modelName} ${order.storage} ${order.color}`);
        console.log(`     Price: ¥${order.price.toLocaleString()}`);
        console.log(`     Order Date: ${order.orderDate}`);

        // Check if inventory already exists (by order_number + item_index)
        const { data: existing } = await supabaseAdmin
            .from('inventory')
            .select('id, model_name, storage, color, purchase_price, original_delivery_start, original_delivery_end')
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
            expected_price: order.price,
            order_date: order.orderDate,
            expected_delivery_start: order.deliveryStart,
            expected_delivery_end: order.deliveryEnd,
            original_delivery_start: order.deliveryStart,
            original_delivery_end: order.deliveryEnd,
            purchase_source: 'Amazon',
            contact_email_id: contactEmailId,
        };

        if (existing) {
            // Check if data has changed
            const dataChanged =
                existing.model_name !== inventoryData.model_name ||
                existing.storage !== inventoryData.storage ||
                existing.color !== inventoryData.color ||
                existing.purchase_price !== inventoryData.purchase_price ||
                existing.original_delivery_start !== inventoryData.original_delivery_start ||
                existing.original_delivery_end !== inventoryData.original_delivery_end;

            if (dataChanged) {
                console.log(`  ℹ️  Updating existing inventory: ${existing.id}`);

                const updateData: any = {
                    model_name: inventoryData.model_name,
                    storage: inventoryData.storage,
                    color: inventoryData.color,
                    purchase_price: inventoryData.purchase_price,
                    order_date: inventoryData.order_date,
                    purchase_source: inventoryData.purchase_source,
                    contact_email_id: inventoryData.contact_email_id,
                };

                // Only update original_expected_delivery if not already set
                if (!existing.original_delivery_start) {
                    updateData.original_delivery_start = inventoryData.original_delivery_start;
                }
                if (!existing.original_delivery_end) {
                    updateData.original_delivery_end = inventoryData.original_delivery_end;
                }

                const { error } = await supabaseAdmin
                    .from('inventory')
                    .update(updateData)
                    .eq('id', existing.id);

                if (error) {
                    console.error(`  ❌ Error updating inventory:`, error);
                    return { success: false, orderNumber, notes: `Error updating inventory: ${error.message}` };
                } else {
                    console.log(`  ✅ Inventory updated successfully`);
                    return {
                        success: true,
                        isDuplicate: false,
                        inventoryId: existing.id,
                        orderNumber,
                        notes: `Updated item for order ${orderNumber}`,
                        parsedData: {
                            inventory_id: existing.id,
                            order_number: orderNumber,
                            model_name: order.modelName,
                            storage: order.storage,
                            color: order.color,
                            purchase_price: order.price,
                            expected_delivery_start: order.deliveryStart,
                            expected_delivery_end: order.deliveryEnd,
                        }
                    };
                }
            } else {
                console.log(`  ⏭️  Skipping duplicate: ${inventoryCode} (no changes)`);
                return {
                    success: true,
                    isDuplicate: true,
                    inventoryId: existing.id,
                    orderNumber,
                    notes: `Skipped duplicate item for order ${orderNumber}`,
                    parsedData: {
                        inventory_id: existing.id,
                        order_number: orderNumber,
                    }
                };
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
                return {
                    success: true,
                    isDuplicate: false,
                    inventoryId: newInventory.id,
                    orderNumber,
                    notes: `Created item for order ${orderNumber}`,
                    parsedData: {
                        inventory_id: newInventory.id,
                        order_number: orderNumber,
                        model_name: order.modelName,
                        storage: order.storage,
                        color: order.color,
                        purchase_price: order.price,
                        expected_delivery_start: order.deliveryStart,
                        expected_delivery_end: order.deliveryEnd,
                    }
                };
            }
        }
    } catch (error) {
        console.error('  ❌ Error processing Amazon order confirmation email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Process Amazon shipping notification email
 */
async function processAmazonShippingEmail(
    rawEmail: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
    try {
        console.log('  📦 Processing Amazon shipping notification email...');

        const emailText = extractEmailBody(rawEmail);
        const shippingInfo = parseAmazonShippingEmail(emailText);

        if (!shippingInfo) {
            console.log('  ⚠️  No shipping info found in email');
            return { success: false, notes: 'No shipping info found in email' };
        }

        console.log(`  ✅ Found shipping info for order: ${shippingInfo.orderNumber}`);
        console.log(`     Carrier: ${shippingInfo.carrier}`);
        if (shippingInfo.trackingNumber) {
            console.log(`     Tracking: ${shippingInfo.trackingNumber}`);
        }

        // Find all inventory items with this order number
        const { data: inventoryItems, error: fetchError } = await supabaseAdmin
            .from('inventory')
            .select('id, status, carrier, tracking_number')
            .eq('order_number', shippingInfo.orderNumber)
            .eq('user_id', userId);

        if (fetchError || !inventoryItems || inventoryItems.length === 0) {
            console.log(`  ⚠️  No inventory found for order: ${shippingInfo.orderNumber}`);
            return { success: false, orderNumber: shippingInfo.orderNumber, notes: `Order not found: ${shippingInfo.orderNumber}` };
        }

        console.log(`  📦 Found ${inventoryItems.length} inventory item(s) for this order`);

        // Check if data has changed
        const hasChanges = inventoryItems.some((item: any) =>
            item.status !== 'shipped' ||
            item.carrier !== shippingInfo.carrier ||
            (shippingInfo.trackingNumber && item.tracking_number !== shippingInfo.trackingNumber)
        );

        if (!hasChanges) {
            console.log(`  ℹ️  No changes detected for shipping info`);
            return {
                success: true,
                isDuplicate: true,
                inventoryId: inventoryItems[0].id,
                orderNumber: shippingInfo.orderNumber,
                notes: `No changes for order ${shippingInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: shippingInfo.orderNumber,
                    carrier: shippingInfo.carrier,
                    tracking_number: shippingInfo.trackingNumber,
                    items_updated: 0
                }
            };
        }

        // Update all items with shipping information
        const updateData: any = {
            status: 'shipped',
            carrier: shippingInfo.carrier,
        };

        if (shippingInfo.trackingNumber) {
            updateData.tracking_number = shippingInfo.trackingNumber;
        }

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
                isDuplicate: false,
                inventoryId: inventoryItems[0].id,
                orderNumber: shippingInfo.orderNumber,
                notes: `Updated ${inventoryItems.length} item(s) for order ${shippingInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: shippingInfo.orderNumber,
                    carrier: shippingInfo.carrier,
                    tracking_number: shippingInfo.trackingNumber,
                    items_updated: inventoryItems.length
                }
            };
        }
    } catch (error) {
        console.error('  ❌ Error processing Amazon shipping notification email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Process Amazon delivery status email (out for delivery or delivered)
 */
async function processAmazonDeliveryEmail(
    rawEmail: string,
    subject: string,
    userId: string,
    supabaseAdmin: any
): Promise<{ success: boolean; isDuplicate?: boolean; inventoryId?: string; orderNumber?: string; notes?: string; parsedData?: Record<string, any> }> {
    try {
        console.log('  📦 Processing Amazon delivery status email...');

        const emailText = extractEmailBody(rawEmail);
        const deliveryInfo = parseAmazonDeliveryEmail(emailText, subject);

        if (!deliveryInfo) {
            console.log('  ⚠️  No delivery info found in email');
            return { success: false, notes: 'No delivery info found in email' };
        }

        console.log(`  ✅ Found delivery info for order: ${deliveryInfo.orderNumber}`);
        console.log(`     Status: ${deliveryInfo.status}`);

        // Find all inventory items with this order number
        console.log('  🔍 Searching inventory - order_number:', deliveryInfo.orderNumber, 'user_id:', userId);
        const { data: inventoryItems, error: fetchError } = await supabaseAdmin
            .from('inventory')
            .select('id, status, delivered_at')
            .eq('order_number', deliveryInfo.orderNumber)
            .eq('user_id', userId);

        console.log('  📊 Search result - error:', fetchError, 'items found:', inventoryItems?.length || 0);
        if (inventoryItems && inventoryItems.length > 0) {
            console.log('  📦 Inventory items:', JSON.stringify(inventoryItems, null, 2));
        }

        if (fetchError || !inventoryItems || inventoryItems.length === 0) {
            console.log(`  ⚠️  No inventory found for order: ${deliveryInfo.orderNumber}`);
            if (fetchError) {
                console.error('  ❌ Database fetch error:', JSON.stringify(fetchError, null, 2));
            }
            return { success: false, orderNumber: deliveryInfo.orderNumber, notes: `Order not found: ${deliveryInfo.orderNumber}` };
        }

        console.log(`  📦 Found ${inventoryItems.length} inventory item(s) for this order`);

        // Determine target status based on delivery info
        // Note: Parser returns 'arrived' but DB uses 'delivered'
        const targetStatus = deliveryInfo.status === 'arrived' ? 'delivered' : 'shipped';
        const now = new Date().toISOString();

        // Check if data has changed
        const hasChanges = inventoryItems.some((item: any) =>
            item.status !== targetStatus ||
            (deliveryInfo.status === 'arrived' && !item.delivered_at)
        );

        if (!hasChanges) {
            console.log(`  ℹ️  No changes detected for delivery status`);
            return {
                success: true,
                isDuplicate: true,
                inventoryId: inventoryItems[0].id,
                orderNumber: deliveryInfo.orderNumber,
                notes: `No changes for order ${deliveryInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: deliveryInfo.orderNumber,
                    status: targetStatus,
                    items_updated: 0
                }
            };
        }

        // Update all items with delivery status
        const updateData: any = {
            status: targetStatus,
        };

        if (deliveryInfo.status === 'arrived') {
            updateData.delivered_at = now;
        }

        const { error: updateError } = await supabaseAdmin
            .from('inventory')
            .update(updateData)
            .eq('order_number', deliveryInfo.orderNumber)
            .eq('user_id', userId);

        if (updateError) {
            console.error(`  ❌ Error updating delivery status:`, updateError);
            return {
                success: false,
                orderNumber: deliveryInfo.orderNumber,
                notes: `Error updating: ${updateError.message}`
            };
        } else {
            console.log(`  ✅ Updated ${inventoryItems.length} item(s) with delivery status`);
            return {
                success: true,
                isDuplicate: false,
                inventoryId: inventoryItems[0].id,
                orderNumber: deliveryInfo.orderNumber,
                notes: `Updated ${inventoryItems.length} item(s) for order ${deliveryInfo.orderNumber}`,
                parsedData: {
                    inventory_id: inventoryItems[0].id,
                    order_number: deliveryInfo.orderNumber,
                    status: targetStatus,
                    delivered_at: deliveryInfo.status === 'arrived' ? now : null,
                    items_updated: inventoryItems.length
                }
            };
        }
    } catch (error) {
        console.error('  ❌ Error processing Amazon delivery status email:', error);
        return { success: false, notes: error instanceof Error ? error.message : 'Unknown error' };
    }
}
