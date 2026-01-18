import fs from 'fs';
import path from 'path';
import { parseAmazonOrderEmail } from '../lib/amazonMailParser';

// Read the email sample
const emailPath = path.join(process.cwd(), 'docs', 'email-samples', 'amazon', '01_order_250-8477857-2415055.eml');
const rawEmail = fs.readFileSync(emailPath, 'utf-8');

console.log('📧 Testing Amazon Order Email Parser');
console.log('=====================================\n');

// Extract body (simplified version - just get the text after headers)
const lines = rawEmail.split(/\r?\n/);
let bodyStartIndex = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') {
        bodyStartIndex = i + 1;
        break;
    }
}

// For this test, we'll extract the HTML part manually
// Look for the HTML content between multipart boundaries
const emailText = rawEmail;

console.log('📄 Parsing email...\n');

const result = parseAmazonOrderEmail(emailText);

console.log('\n📊 Parse Results:');
console.log('=================\n');

if (result) {
    console.log('✅ Successfully parsed!\n');
    console.log('注文番号:', result.orderNumber);
    console.log('商品名:', result.modelName);
    console.log('容量:', result.storage);
    console.log('色:', result.color || '❌ 未抽出');
    console.log('価格:', result.price ? `¥${result.price.toLocaleString()}` : '❌ 未抽出');
    console.log('お届け予定（開始）:', result.deliveryStart || '❌ 未抽出');
    console.log('お届け予定（終了）:', result.deliveryEnd || '❌ 未抽出');

    console.log('\n📋 期待値との比較:');
    console.log('==================\n');

    const expected = {
        orderNumber: '250-8477857-2415055',
        modelName: 'iPhone 17 Pro',
        storage: '256GB',
        color: 'シルバー',
        price: 179800,
    };

    let allMatch = true;

    if (result.orderNumber !== expected.orderNumber) {
        console.log('❌ 注文番号不一致:', result.orderNumber, 'vs', expected.orderNumber);
        allMatch = false;
    } else {
        console.log('✅ 注文番号一致');
    }

    if (result.modelName !== expected.modelName) {
        console.log('❌ 商品名不一致:', result.modelName, 'vs', expected.modelName);
        allMatch = false;
    } else {
        console.log('✅ 商品名一致');
    }

    if (result.storage !== expected.storage) {
        console.log('❌ 容量不一致:', result.storage, 'vs', expected.storage);
        allMatch = false;
    } else {
        console.log('✅ 容量一致');
    }

    if (result.color !== expected.color) {
        console.log('❌ 色不一致:', result.color, 'vs', expected.color);
        allMatch = false;
    } else {
        console.log('✅ 色一致');
    }

    if (result.price !== expected.price) {
        console.log('❌ 価格不一致:', result.price, 'vs', expected.price);
        allMatch = false;
    } else {
        console.log('✅ 価格一致');
    }

    if (allMatch) {
        console.log('\n🎉 全ての項目が期待値と一致しました！');
    } else {
        console.log('\n⚠️  一部の項目が期待値と異なります。');
    }

} else {
    console.log('❌ パース失敗: 結果がnullです');
    process.exit(1);
}
