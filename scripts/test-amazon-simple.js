const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');

async function testAmazonParser() {
    const output = [];
    const log = (msg) => {
        console.log(msg);
        output.push(msg);
    };

    log('🧪 Testing Amazon Email Parser\n');
    log('='.repeat(60));

    // Read the .eml file
    const emlPath = path.join(__dirname, '../docs/email-samples/amazon/01_order_250-8477857-2415055.eml');
    log(`📂 Reading: ${emlPath}\n`);

    const emlContent = fs.readFileSync(emlPath, 'utf-8');

    // Parse the email
    const parsed = await simpleParser(emlContent);

    const from = parsed.from?.text || '';
    const subject = parsed.subject || '';
    const textBody = parsed.text || '';

    log('📧 Email Details:');
    log(`   From: ${from}`);
    log(`   Subject: ${subject}`);
    log(`   Body length: ${textBody.length} characters\n`);

    // For testing, let's manually check what we can extract
    log('🔍 Manual Pattern Testing:\n');

    // Test order number extraction
    const orderNumberMatch = textBody.match(/(\d{3}-\d{7}-\d{7})/);
    log(`📝 注文番号: ${orderNumberMatch ? orderNumberMatch[1] : '❌ NOT FOUND'}`);

    // Test product extraction
    const productPattern = /Apple\s+iPhone\s+(\d+(?:\s+Pro(?:\s+Max)?|\s+Air)?)\s+(\d+GB)/i;
    const productMatch = textBody.match(productPattern);
    log(`📱 商品名: ${productMatch ? `iPhone ${productMatch[1]} ${productMatch[2]}` : '❌ NOT FOUND'}`);

    // Test color extraction
    const colorPattern = /(シルバー|ブラック|ゴールド|ホワイト|レッド|ブルー|グリーン|パープル|ピンク|イエロー|オレンジ|グレー|スペースグレイ|ミッドナイト|スターライト|コズミックオレンジ)/;
    const colorMatch = textBody.match(colorPattern);
    log(`🎨 色: ${colorMatch ? colorMatch[1] : '❌ NOT FOUND'}`);

    // Test price extraction
    const priceMatch = textBody.match(/(\d{1,3}(?:,\d{3})*)\s*(?:円|JPY)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    log(`💰 価格: ${priceMatch ? `¥${price.toLocaleString()}` : '❌ NOT FOUND'}`);

    // Test delivery time extraction
    const deliveryPattern = /(明日|本日|(\d{4})\/(\d{1,2})\/(\d{1,2}))\s*(\d{1,2}):(\d{2})\s*(午前|午後)\s*[～〜~-]\s*(\d{1,2}):(\d{2})\s*(午前|午後)/;
    const deliveryMatch = textBody.match(deliveryPattern);
    log(`📅 お届け予定: ${deliveryMatch ? deliveryMatch[0] : '❌ NOT FOUND'}`);

    log('\n' + '='.repeat(60));
    log('\n✅ テスト完了\n');

    if (orderNumberMatch && productMatch) {
        log('📊 抽出結果サマリー:');
        log('='.repeat(60));
        log(`注文番号:     ${orderNumberMatch[1]}`);
        log(`商品名:       iPhone ${productMatch[1]}`);
        log(`容量:         ${productMatch[2]}`);
        log(`色:           ${colorMatch ? colorMatch[1] : '(未検出)'}`);
        log(`価格:         ¥${price.toLocaleString()}`);
        log(`お届け予定:   ${deliveryMatch ? deliveryMatch[0] : '(未検出)'}`);
        log('='.repeat(60));
    }

    // Write to file
    fs.writeFileSync(path.join(__dirname, '../test-result.txt'), output.join('\n'), 'utf-8');
    log('\n📝 結果を test-result.txt に保存しました');
}

testAmazonParser().catch(console.error);
