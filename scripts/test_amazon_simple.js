const fs = require('fs');
const path = require('path');

// Simple email body extractor
function extractEmailBody(rawEmail) {
    // Decode quoted-printable
    const decoded = rawEmail.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
    return decoded;
}

// Read the email sample
const emailPath = path.join(__dirname, '..', 'docs', 'email-samples', 'amazon', '01_order_250-8477857-2415055.eml');
const rawEmail = fs.readFileSync(emailPath, 'utf-8');

console.log('=== Amazon Order Email Parser Test ===\n');

const emailText = extractEmailBody(rawEmail);

// Extract order number
const orderNumberMatch = emailText.match(/(\d{3}-\d{7}-\d{7})/);
const orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;

// Extract product name
const productPattern1 = /Apple\s+iPhone\s+(\d+(?:\s+Pro(?:\s+Max)?|\s+Air)?)\s+(\d+GB)/i;
const productMatch1 = emailText.match(productPattern1);

let modelName = '';
let storage = '';

if (productMatch1) {
    modelName = `iPhone ${productMatch1[1].trim()}`;
    storage = productMatch1[2];
}

// Extract color
const colorPattern = /(シルバー|ブラック|ゴールド|ホワイト|レッド|ブルー|グリーン|パープル|ピンク|イエロー)/;
const colorMatch = emailText.match(colorPattern);
const color = colorMatch ? colorMatch[1] : null;

// Extract price
let price = 0;
const amountMatch = emailText.match(/amount=(\d+)/);
if (amountMatch) {
    price = parseInt(amountMatch[1]);
} else {
    const priceMatch = emailText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:円|JPY)/);
    if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
    }
}

// Extract delivery date
const deliveryPattern = /(明日|本日)\s*(\d{1,2}):(\d{2})\s*(午前|午後)\s*[～〜~-]\s*(\d{1,2}):(\d{2})\s*(午前|午後)/;
const deliveryMatch = emailText.match(deliveryPattern);

let deliveryStart = '';
let deliveryEnd = '';

if (deliveryMatch) {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();

    if (deliveryMatch[1] === '明日') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        year = tomorrow.getFullYear();
        month = tomorrow.getMonth() + 1;
        day = tomorrow.getDate();
    }

    let startHour = parseInt(deliveryMatch[2]);
    const startMinute = parseInt(deliveryMatch[3]);
    const startPeriod = deliveryMatch[4];

    if (startPeriod === '午後' && startHour !== 12) {
        startHour += 12;
    } else if (startPeriod === '午前' && startHour === 12) {
        startHour = 0;
    }

    let endHour = parseInt(deliveryMatch[5]);
    const endMinute = parseInt(deliveryMatch[6]);
    const endPeriod = deliveryMatch[7];

    if (endPeriod === '午後' && endHour !== 12) {
        endHour += 12;
    } else if (endPeriod === '午前' && endHour === 12) {
        endHour = 0;
    }

    deliveryStart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
    deliveryEnd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;
}

console.log('Parse Results:');
console.log('==============\n');
console.log('Order Number:', orderNumber || 'NOT FOUND');
console.log('Model Name:', modelName || 'NOT FOUND');
console.log('Storage:', storage || 'NOT FOUND');
console.log('Color:', color || 'NOT FOUND');
console.log('Price:', price ? `${price} JPY` : 'NOT FOUND');
console.log('Delivery Start:', deliveryStart || 'NOT FOUND');
console.log('Delivery End:', deliveryEnd || 'NOT FOUND');

console.log('\n\nExpected vs Actual:');
console.log('===================\n');

const expected = {
    orderNumber: '250-8477857-2415055',
    modelName: 'iPhone 17 Pro',
    storage: '256GB',
    color: 'シルバー',
    price: 179800,
};

const results = {
    orderNumber: orderNumber === expected.orderNumber,
    modelName: modelName === expected.modelName,
    storage: storage === expected.storage,
    color: color === expected.color,
    price: price === expected.price,
};

console.log('Order Number:', results.orderNumber ? 'PASS' : 'FAIL', `(${orderNumber} vs ${expected.orderNumber})`);
console.log('Model Name:', results.modelName ? 'PASS' : 'FAIL', `(${modelName} vs ${expected.modelName})`);
console.log('Storage:', results.storage ? 'PASS' : 'FAIL', `(${storage} vs ${expected.storage})`);
console.log('Color:', results.color ? 'PASS' : 'FAIL', `(${color} vs ${expected.color})`);
console.log('Price:', results.price ? 'PASS' : 'FAIL', `(${price} vs ${expected.price})`);

const allPass = Object.values(results).every(r => r);
console.log('\n' + (allPass ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED'));

process.exit(allPass ? 0 : 1);
