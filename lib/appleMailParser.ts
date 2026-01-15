import { ParsedAppleOrder } from '@/types';

export interface ParsedShippingInfo {
    orderNumber: string;
    carrier: string;
    trackingNumber: string;
}

export type EmailType = 'order' | 'shipping' | 'unknown';

/**
 * Detect the type of Apple email
 */
export function detectEmailType(emailText: string): EmailType {
    if (emailText.includes('お客様の商品は出荷されました') || emailText.includes('shipped')) {
        return 'shipping';
    }
    if (emailText.includes('ご注文内容をご確認ください') || emailText.includes('ご注文ありがとうございます')) {
        return 'order';
    }
    return 'unknown';
}

/**
 * Parse Apple shipping notification email
 */
export function parseAppleShippingEmail(emailText: string): ParsedShippingInfo | null {
    // Extract order number
    const orderNumberMatch = emailText.match(/ご注文番号[:\s：]+([A-Z0-9]+)/i) ||
        emailText.match(/Order Number[:\s]+([A-Z0-9]+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    if (!orderNumber) return null;

    // Extract tracking number
    const trackingMatch = emailText.match(/配送伝票番号[:\s：]+(\d+)/i) ||
        emailText.match(/Tracking Number[:\s]+(\d+)/i) ||
        emailText.match(/(\d{12,})/); // Fallback: 12+ digit number
    const trackingNumber = trackingMatch ? trackingMatch[1] : '';

    // Extract carrier and normalize
    let carrier = '';
    if (emailText.includes('YAMATO TRANSPORT') || emailText.includes('ヤマト運輸')) {
        carrier = 'ヤマト運輸';
    } else if (emailText.includes('SAGAWA') || emailText.includes('佐川急便')) {
        carrier = '佐川急便';
    } else if (emailText.includes('JAPAN POST') || emailText.includes('日本郵便')) {
        carrier = '日本郵便';
    } else {
        const carrierMatch = emailText.match(/配送業者[:\s：]+([^\n\r]+)/i);
        carrier = carrierMatch ? carrierMatch[1].trim() : 'その他';
    }

    return {
        orderNumber,
        carrier,
        trackingNumber,
    };
}

/**
 * Parse Apple order confirmation email to extract order details
 * @param emailText - Raw email text from Apple order confirmation
 * @returns Array of parsed order data (one per product)
 */
export function parseAppleOrderEmail(emailText: string): ParsedAppleOrder[] {
    const orders: ParsedAppleOrder[] = [];

    // Extract order number: ご注文番号: W1515122271
    const orderNumberMatch = emailText.match(/ご注文番号[:\s：]+([A-Z0-9]+)/i);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

    // Extract order date: ご注文日 : 2026/01/10
    const orderDateMatch = emailText.match(/ご注文日[:\s：]+(\d{4}\/\d{1,2}\/\d{1,2})/);
    const orderDate = orderDateMatch ? orderDateMatch[1] : '';

    // Extract delivery date range: 2026/01/12 – 2026/01/14
    // Also handle single date format: 日 2026/01/11
    let deliveryStart = '';
    let deliveryEnd = '';

    // Try date range format first
    const deliveryRangeMatch = emailText.match(/(\d{4}\/\d{1,2}\/\d{1,2})\s*[–-]\s*(\d{4}\/\d{1,2}\/\d{1,2})/);
    if (deliveryRangeMatch) {
        deliveryStart = deliveryRangeMatch[1];
        deliveryEnd = deliveryRangeMatch[2];
    } else {
        // Try single date format with "日" prefix
        const singleDateMatch = emailText.match(/日\s*(\d{4}\/\d{1,2}\/\d{1,2})/);
        if (singleDateMatch) {
            deliveryStart = singleDateMatch[1];
            deliveryEnd = singleDateMatch[1]; // Use same date for both start and end
        }
    }

    // Extract payment method: Mastercard, Visa, etc.
    const paymentMatch = emailText.match(/(Mastercard|Visa|JCB|American Express)/i);
    const paymentCard = paymentMatch ? paymentMatch[1] : '';

    // Extract products - look for iPhone models with storage and color
    // Pattern: iPhone 17 Pro 256GB コズミックオレンジ
    const productPattern = /(iPhone\s+(?:17\s+)?(?:Pro\s+Max|Pro|Air|17)?)\s+(\d+GB)\s+([^\n\r]+?)(?=\n|$)/gi;
    let productMatch;

    while ((productMatch = productPattern.exec(emailText)) !== null) {
        const modelName = productMatch[1].trim();
        const storage = productMatch[2];
        const color = productMatch[3].trim();

        // Try to find price near this product
        // Look for price pattern after the product name
        const productIndex = productMatch.index;
        const textAfterProduct = emailText.substring(productIndex, productIndex + 300);
        const priceMatch = textAfterProduct.match(/¥?([\d,]+)円/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

        orders.push({
            orderNumber,
            orderDate,
            modelName,
            storage,
            color,
            price,
            deliveryStart,
            deliveryEnd,
            paymentCard,
        });
    }

    return orders;
}

/**
 * Format date from YYYY/MM/DD to YYYY-MM-DD for input fields
 */
export function formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.replace(/\//g, '-');
}

/**
 * Normalize model name to match standard format
 */
export function normalizeModelName(modelName: string): string {
    // Ensure consistent spacing and format
    let normalized = modelName.trim();

    // Handle \"iPhone 17 Pro Max\" format
    if (/iPhone\\s+17\\s+Pro\\s+Max/i.test(normalized)) {
        return 'iPhone 17 Pro Max';
    }
    if (/iPhone\\s+17\\s+Pro/i.test(normalized)) {
        return 'iPhone 17 Pro';
    }
    if (/iPhone\\s+Air/i.test(normalized)) {
        return 'iPhone Air';
    }
    if (/iPhone\\s+17/i.test(normalized)) {
        return 'iPhone 17';
    }

    return normalized;
}

// Carrier options
export const CARRIER_OPTIONS = [
    'ヤマト運輸',
    '佐川急便',
    '日本郵便',
    'その他',
] as const;
