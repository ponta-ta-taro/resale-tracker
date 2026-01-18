export interface ParsedAmazonOrder {
    orderNumber: string;
    modelName: string;
    storage: string;
    color: string;
    price: number;
    deliveryStart: string; // ISO datetime with time
    deliveryEnd: string;   // ISO datetime with time
}

export interface ParsedAmazonShipping {
    orderNumber: string;
    carrier: string;
    trackingNumber?: string;
}

export interface ParsedAmazonDelivery {
    orderNumber: string;
    status: 'out_for_delivery' | 'arrived';
}

export type AmazonEmailType =
    | 'amazon_order'
    | 'amazon_shipped'
    | 'amazon_out_for_delivery'
    | 'amazon_delivered'
    | 'unknown';

/**
 * Detect the type of Amazon email based on sender and subject
 */
export function detectAmazonEmailType(from: string, subject: string): AmazonEmailType {
    const fromLower = from.toLowerCase();
    const subjectLower = subject.toLowerCase();

    // Check sender addresses first
    if (fromLower.includes('auto-confirm@amazon.co.jp')) {
        return 'amazon_order';
    }

    if (fromLower.includes('shipment-tracking@amazon.co.jp')) {
        // Distinguish between shipped and out for delivery by subject
        if (subjectLower.includes('配達中') || subjectLower.includes('out for delivery')) {
            return 'amazon_out_for_delivery';
        }
        if (subjectLower.includes('発送済み') || subjectLower.includes('shipped')) {
            return 'amazon_shipped';
        }
        if (subjectLower.includes('配達済み') || subjectLower.includes('delivered')) {
            return 'amazon_delivered';
        }
        return 'amazon_shipped'; // Default for shipment-tracking
    }

    if (fromLower.includes('order-update@amazon.co.jp')) {
        return 'amazon_delivered';
    }

    // Check subject patterns as fallback
    if (subjectLower.includes('注文済み')) {
        return 'amazon_order';
    }
    if (subjectLower.includes('発送済み')) {
        return 'amazon_shipped';
    }
    if (subjectLower.includes('配達中')) {
        return 'amazon_out_for_delivery';
    }
    if (subjectLower.includes('配達済み')) {
        return 'amazon_delivered';
    }

    return 'unknown';
}

/**
 * Parse Amazon order confirmation email
 */
export function parseAmazonOrderEmail(emailText: string): ParsedAmazonOrder | null {
    console.log('📧 parseAmazonOrderEmail called');
    console.log('📏 Email text length:', emailText.length);

    // Extract order number: xxx-xxxxxxx-xxxxxxx format
    const orderNumberMatch = emailText.match(/(\d{3}-\d{7}-\d{7})/);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';
    console.log('🔢 Order number:', orderNumber || '❌ NOT FOUND');

    if (!orderNumber) {
        console.log('⚠️  No order number found');
        return null;
    }

    // Extract product name: Look for "Apple iPhone 17 Pro 256GB" pattern
    // Try multiple patterns to catch different formats
    let modelName = '';
    let storage = '';
    let color = '';

    // Pattern 1: Look for "Apple iPhone" followed by model and storage
    const productPattern1 = /Apple\s+iPhone\s+(\d+(?:\s+Pro(?:\s+Max)?|\s+Air)?)\s+(\d+GB)/i;
    const productMatch1 = emailText.match(productPattern1);

    if (productMatch1) {
        modelName = `iPhone ${productMatch1[1].trim()}`;
        storage = productMatch1[2];
        console.log('📱 Product (pattern 1):', modelName, storage);
    }

    // Pattern 2: Try simpler pattern
    if (!modelName) {
        const productPattern2 = /iPhone\s+(\d+(?:\s+Pro(?:\s+Max)?|\s+Air)?)\s+(\d+GB)/i;
        const productMatch2 = emailText.match(productPattern2);
        if (productMatch2) {
            modelName = `iPhone ${productMatch2[1].trim()}`;
            storage = productMatch2[2];
            console.log('📱 Product (pattern 2):', modelName, storage);
        }
    }

    // Extract color: Look for common iPhone colors in Japanese
    // Common colors: シルバー, ブラック, ゴールド, ホワイト, etc.
    const colorPattern = /(シルバー|ブラック|ゴールド|ホワイト|レッド|ブルー|グリーン|パープル|ピンク|イエロー|オレンジ|グレー|スペースグレイ|ミッドナイト|スターライト|コズミックオレンジ)/;
    const colorMatch = emailText.match(colorPattern);
    if (colorMatch) {
        color = colorMatch[1];
        console.log('🎨 Color:', color);
    }

    // Extract price: Look for amount parameter or formatted price
    let price = 0;

    // Try amount= parameter first
    const amountMatch = emailText.match(/amount=(\d+)/);
    if (amountMatch) {
        price = parseInt(amountMatch[1]);
        console.log('💰 Price (amount param):', price);
    }

    // Try formatted price - handle both comma-separated and non-comma formats
    if (!price) {
        // Match both "179,800 円" and "179800 JPY" formats
        const priceMatches = Array.from(emailText.matchAll(/(\d{1,3}(?:,\d{3})+|\d{5,})\s*(?:円|JPY)/g));
        if (priceMatches.length > 0) {
            // If multiple matches, take the largest value (likely the actual price)
            const prices = priceMatches.map(m => parseInt(m[1].replace(/,/g, '')));
            price = Math.max(...prices);
            console.log('💰 Price (formatted):', price);
        }
    }

    // Extract delivery date and time
    // Pattern: "明日5:00 午前～11:59 午前に到着予定" or "本日..."
    let deliveryStart = '';
    let deliveryEnd = '';

    // Look for delivery time pattern
    const deliveryPattern = /(明日|本日|(\d{4})\/(\d{1,2})\/(\d{1,2}))\s*(\d{1,2}):(\d{2})\s*(午前|午後)\s*[～〜~-]\s*(\d{1,2}):(\d{2})\s*(午前|午後)/;
    const deliveryMatch = emailText.match(deliveryPattern);

    if (deliveryMatch) {
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let day = now.getDate();

        // Handle relative dates
        if (deliveryMatch[1] === '明日') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            year = tomorrow.getFullYear();
            month = tomorrow.getMonth() + 1;
            day = tomorrow.getDate();
        } else if (deliveryMatch[1] === '本日') {
            // Use current date
        } else if (deliveryMatch[2]) {
            // Absolute date provided
            year = parseInt(deliveryMatch[2]);
            month = parseInt(deliveryMatch[3]);
            day = parseInt(deliveryMatch[4]);
        }

        // Parse start time
        let startHour = parseInt(deliveryMatch[5]);
        const startMinute = parseInt(deliveryMatch[6]);
        const startPeriod = deliveryMatch[7];

        if (startPeriod === '午後' && startHour !== 12) {
            startHour += 12;
        } else if (startPeriod === '午前' && startHour === 12) {
            startHour = 0;
        }

        // Parse end time
        let endHour = parseInt(deliveryMatch[8]);
        const endMinute = parseInt(deliveryMatch[9]);
        const endPeriod = deliveryMatch[10];

        if (endPeriod === '午後' && endHour !== 12) {
            endHour += 12;
        } else if (endPeriod === '午前' && endHour === 12) {
            endHour = 0;
        }

        // Format as ISO datetime
        deliveryStart = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
        deliveryEnd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

        console.log('🚚 Delivery window:', deliveryStart, '~', deliveryEnd);
    } else {
        console.log('🚚 Delivery date: ❌ NOT FOUND');
    }

    if (!modelName || !storage) {
        console.log('⚠️  Product information incomplete');
        return null;
    }

    return {
        orderNumber,
        modelName,
        storage,
        color,
        price,
        deliveryStart,
        deliveryEnd,
    };
}

/**
 * Parse Amazon shipping notification email
 */
export function parseAmazonShippingEmail(emailText: string): ParsedAmazonShipping | null {
    console.log('📧 parseAmazonShippingEmail called');

    // Extract order number
    const orderNumberMatch = emailText.match(/(\d{3}-\d{7}-\d{7})/);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';
    console.log('🔢 Order number:', orderNumber || '❌ NOT FOUND');

    if (!orderNumber) {
        return null;
    }

    // Amazon typically uses their own delivery service
    const carrier = 'Amazon';

    // Try to extract tracking number from URL if present
    // Pattern: packageIndex=0 or similar tracking identifiers
    let trackingNumber: string | undefined;
    const trackingMatch = emailText.match(/shipmentId=([A-Z0-9]+)/i);
    if (trackingMatch) {
        trackingNumber = trackingMatch[1];
        console.log('📦 Tracking:', trackingNumber);
    }

    return {
        orderNumber,
        carrier,
        trackingNumber,
    };
}

/**
 * Parse Amazon delivery status email
 */
export function parseAmazonDeliveryEmail(emailText: string, subject: string): ParsedAmazonDelivery | null {
    console.log('📧 parseAmazonDeliveryEmail called');

    // Extract order number from subject or body
    // Subject pattern: "配達済み 1点の商品 - 注文番号 xxx-xxxxxxx-xxxxxxx"
    let orderNumber = '';

    const subjectMatch = subject.match(/(\d{3}-\d{7}-\d{7})/);
    if (subjectMatch) {
        orderNumber = subjectMatch[1];
    } else {
        const bodyMatch = emailText.match(/(\d{3}-\d{7}-\d{7})/);
        if (bodyMatch) {
            orderNumber = bodyMatch[1];
        }
    }

    console.log('🔢 Order number:', orderNumber || '❌ NOT FOUND');

    if (!orderNumber) {
        return null;
    }

    // Determine status from subject
    let status: 'out_for_delivery' | 'arrived' = 'arrived';
    if (subject.includes('配達中') || subject.toLowerCase().includes('out for delivery')) {
        status = 'out_for_delivery';
    }

    console.log('📍 Status:', status);

    return {
        orderNumber,
        status,
    };
}
