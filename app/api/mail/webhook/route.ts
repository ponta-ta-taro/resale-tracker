import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectEmailType, parseAppleOrderEmail, parseAppleShippingEmail, formatDateForInput } from '@/lib/appleMailParser';

interface WebhookPayload {
    from: string;
    to: string;
    subject: string;
    rawEmail: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: WebhookPayload = await request.json();
        const { from, to, subject, rawEmail } = body;

        console.log('📧 Received email webhook:');
        console.log('  From:', from);
        console.log('  To:', to);
        console.log('  Subject:', subject);

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
            await processOrderEmail(rawEmail);
        } else if (emailType === 'shipping') {
            await processShippingEmail(rawEmail);
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

async function processOrderEmail(emailText: string) {
    try {
        console.log('  📦 Processing order email...');

        const orders = parseAppleOrderEmail(emailText);

        if (orders.length === 0) {
            console.log('  ⚠️  No orders found in email');
            return;
        }

        console.log(`  ✅ Found ${orders.length} order(s)`);

        const supabase = await createClient();

        // Get the first user (since this is a webhook, we need to determine which user)
        // For now, we'll use a service role or get the first user
        // TODO: In production, you might want to map email addresses to users
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log('  ⚠️  No authenticated user found, skipping database insert');
            return;
        }

        for (const order of orders) {
            console.log(`  📝 Order: ${order.orderNumber} - ${order.modelName} ${order.storage}`);

            // Check if order already exists
            const { data: existing } = await supabase
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
            const { error } = await supabase
                .from('inventory')
                .insert({
                    user_id: user.id,
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

async function processShippingEmail(emailText: string) {
    try {
        console.log('  📦 Processing shipping email...');

        const shippingInfo = parseAppleShippingEmail(emailText);

        if (!shippingInfo) {
            console.log('  ⚠️  No shipping info found in email');
            return;
        }

        console.log(`  ✅ Found shipping info for order: ${shippingInfo.orderNumber}`);
        console.log(`     Carrier: ${shippingInfo.carrier}`);
        console.log(`     Tracking: ${shippingInfo.trackingNumber}`);

        const supabase = await createClient();

        // Find inventory item by order number
        const { data: inventory, error: fetchError } = await supabase
            .from('inventory')
            .select('id, status')
            .eq('order_number', shippingInfo.orderNumber)
            .single();

        if (fetchError || !inventory) {
            console.log(`  ⚠️  Order not found in inventory: ${shippingInfo.orderNumber}`);
            return;
        }

        // Update with shipping information
        const { error: updateError } = await supabase
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
