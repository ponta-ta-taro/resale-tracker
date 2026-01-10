import { ParsedAppleOrder } from '@/types';

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
    const deliveryMatch = emailText.match(/(\d{4}\/\d{1,2}\/\d{1,2})\s*[–-]\s*(\d{4}\/\d{1,2}\/\d{1,2})/);
    const deliveryStart = deliveryMatch ? deliveryMatch[1] : '';
    const deliveryEnd = deliveryMatch ? deliveryMatch[2] : '';

    // Extract payment method: Mastercard, Visa, etc.
    const paymentMatch = emailText.match(/(Mastercard|Visa|JCB|American Express)/i);
    const paymentCard = paymentMatch ? paymentMatch[1] : '';

    // Extract products - look for iPhone models with storage and color
    // Pattern: iPhone 17 Pro 256GB コズミックオレンジ
    const productPattern = /(iPhone\s+(?:17\s+)?(?:Pro\s+Max|Pro|Air|17)?)\s+(\d+GB)\s+([^\n\r¥]+?)(?:\s+|¥|$)/gi;
    let productMatch;

    while ((productMatch = productPattern.exec(emailText)) !== null) {
        const modelName = productMatch[1].trim();
        const storage = productMatch[2];
        const color = productMatch[3].trim();

        // Try to find price near this product
        // Look for price pattern after the product name
        const productIndex = productMatch.index;
        const textAfterProduct = emailText.substring(productIndex, productIndex + 200);
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

    // Handle "iPhone 17 Pro Max" format
    if (/iPhone\s+17\s+Pro\s+Max/i.test(normalized)) {
        return 'iPhone 17 Pro Max';
    }
    if (/iPhone\s+17\s+Pro/i.test(normalized)) {
        return 'iPhone 17 Pro';
    }
    if (/iPhone\s+Air/i.test(normalized)) {
        return 'iPhone Air';
    }
    if (/iPhone\s+17/i.test(normalized)) {
        return 'iPhone 17';
    }

    return normalized;
}
