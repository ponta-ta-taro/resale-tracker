import * as fs from 'fs';
import * as path from 'path';
import { simpleParser } from 'mailparser';
import {
    detectAmazonEmailType,
    parseAmazonOrderEmail,
    parseAmazonShippingEmail,
    parseAmazonDeliveryEmail,
} from '../lib/amazonMailParser';

async function testAmazonParser() {
    console.log('🧪 Testing Amazon Email Parser\n');
    console.log('='.repeat(60));

    // Read the .eml file
    const emlPath = path.join(__dirname, '../docs/email-samples/amazon/01_order_250-8477857-2415055.eml');
    console.log(`📂 Reading: ${emlPath}\n`);

    const emlContent = fs.readFileSync(emlPath, 'utf-8');

    // Parse the email
    const parsed = await simpleParser(emlContent);

    const from = parsed.from?.text || '';
    const subject = parsed.subject || '';
    const textBody = parsed.text || '';

    console.log('📧 Email Details:');
    console.log(`   From: ${from}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body length: ${textBody.length} characters\n`);

    // Detect email type
    const emailType = detectAmazonEmailType(from, subject);
    console.log(`🔍 Detected Type: ${emailType}\n`);

    // Parse based on type
    if (emailType === 'amazon_order') {
        console.log('📦 Parsing Order Confirmation...\n');
        const result = parseAmazonOrderEmail(textBody);

        if (result) {
            console.log('✅ Parse Result:');
            console.log('='.repeat(60));
            console.log(`📝 注文番号:        ${result.orderNumber}`);
            console.log(`📱 商品名:          ${result.modelName}`);
            console.log(`💾 容量:            ${result.storage}`);
            console.log(`🎨 色:              ${result.color || '(未検出)'}`);
            console.log(`💰 価格:            ¥${result.price.toLocaleString()}`);
            console.log(`📅 お届け開始:      ${result.deliveryStart || '(未検出)'}`);
            console.log(`📅 お届け終了:      ${result.deliveryEnd || '(未検出)'}`);
            console.log('='.repeat(60));
        } else {
            console.log('❌ Failed to parse order email');
        }
    } else if (emailType === 'amazon_shipped') {
        console.log('🚚 Parsing Shipping Notification...\n');
        const result = parseAmazonShippingEmail(textBody);

        if (result) {
            console.log('✅ Parse Result:');
            console.log('='.repeat(60));
            console.log(`📝 注文番号:        ${result.orderNumber}`);
            console.log(`🚛 配送業者:        ${result.carrier}`);
            console.log(`📦 追跡番号:        ${result.trackingNumber || '(未検出)'}`);
            console.log('='.repeat(60));
        } else {
            console.log('❌ Failed to parse shipping email');
        }
    } else if (emailType === 'amazon_out_for_delivery' || emailType === 'amazon_delivered') {
        console.log('📍 Parsing Delivery Status...\n');
        const result = parseAmazonDeliveryEmail(textBody, subject);

        if (result) {
            console.log('✅ Parse Result:');
            console.log('='.repeat(60));
            console.log(`📝 注文番号:        ${result.orderNumber}`);
            console.log(`📍 ステータス:      ${result.status}`);
            console.log('='.repeat(60));
        } else {
            console.log('❌ Failed to parse delivery email');
        }
    } else {
        console.log('❌ Unknown email type');
    }
}

testAmazonParser().catch(console.error);
