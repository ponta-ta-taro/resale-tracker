const fs = require('fs');
const path = require('path');

// Read the email sample
const emailPath = path.join(__dirname, '..', 'docs', 'email-samples', 'amazon', '01_order_250-8477857-2415055.eml');
const rawEmail = fs.readFileSync(emailPath, 'utf-8');

// Find the base64 text/plain part
const lines = rawEmail.split(/\r?\n/);
let inBase64 = false;
let base64Content = '';

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Content-Type: text/plain') && lines[i + 1].includes('base64')) {
        inBase64 = true;
        i += 2; // Skip the Content-Type and Content-Transfer-Encoding lines
        continue;
    }

    if (inBase64) {
        if (lines[i].startsWith('------=_Part')) {
            break;
        }
        base64Content += lines[i].trim();
    }
}

// Decode base64
const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');

console.log('=== Decoded Text/Plain Content ===\n');
console.log(decoded);
console.log('\n\n=== Searching for Color ===\n');

// Search for color keywords
const colorPattern = /(シルバー|ブラック|ゴールド|ホワイト|レッド|ブルー|グリーン|パープル|ピンク|イエロー|オレンジ|グレー|スペースグレイ|ミッドナイト|スターライト)/;
const colorMatch = decoded.match(colorPattern);

if (colorMatch) {
    console.log('✅ Color found:', colorMatch[1]);
} else {
    console.log('❌ No color found in text/plain part');
}

// Check if color is in product name
const productPattern = /Apple iPhone \d+(?:\s+Pro(?:\s+Max)?|\s+Air)?\s+\d+GB/i;
const productMatch = decoded.match(productPattern);

if (productMatch) {
    console.log('\n✅ Product name found:', productMatch[0]);
    console.log('   (No color in product name)');
}
