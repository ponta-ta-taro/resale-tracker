const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');

async function inspectEmail() {
    const emlPath = path.join(__dirname, '../docs/email-samples/amazon/01_order_250-8477857-2415055.eml');
    const emlContent = fs.readFileSync(emlPath, 'utf-8');
    const parsed = await simpleParser(emlContent);

    const textBody = parsed.text || '';

    // Write full body to file
    fs.writeFileSync(path.join(__dirname, '../email-body.txt'), textBody, 'utf-8');
    console.log('✅ Email body saved to email-body.txt');
    console.log(`📏 Body length: ${textBody.length} characters\n`);

    // Search for all numbers that could be prices
    console.log('=== SEARCHING FOR PRICES ===');
    const priceMatches = [...textBody.matchAll(/(\d{1,3}(?:,\d{3})*)\s*(?:円|JPY)/g)];
    console.log(`Found ${priceMatches.length} price patterns:`);
    for (const match of priceMatches) {
        const value = parseInt(match[1].replace(/,/g, ''));
        console.log(`  - ${match[0]} (value: ¥${value.toLocaleString()})`);
    }

    // Also look for standalone numbers that could be prices
    console.log('\n=== LARGE NUMBERS (5-6 digits, potential prices) ===');
    const numberMatches = [...textBody.matchAll(/(?:^|\s)(\d{5,6})(?:\s|$)/gm)];
    console.log(`Found ${numberMatches.length} large numbers:`);
    for (const match of numberMatches) {
        const value = parseInt(match[1]);
        console.log(`  - ${match[1]} (¥${value.toLocaleString()})`);
    }
}

inspectEmail().catch(console.error);
