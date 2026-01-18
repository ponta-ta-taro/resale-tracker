/**
 * Apple Order Token Retrieval
 * 
 * Fetches order token by following Apple's redirect URL.
 * The order confirmation email contains a URL without the token:
 *   https://store.apple.com/xc/jp/vieworder/{orderNumber}/{email}/
 * 
 * This URL redirects to:
 *   https://secure*.store.apple.com/jp/shop/order/guest/{orderNumber}/{token}
 * 
 * We extract the token from the redirect Location header.
 */

/**
 * Fetch order token via Apple's redirect URL
 * 
 * @param orderNumber - Apple order number (e.g., "W1234567890")
 * @param contactEmail - Contact email address used for the order
 * @returns Order token string, or null if extraction fails
 */
export async function fetchOrderTokenViaRedirect(
    orderNumber: string,
    contactEmail: string
): Promise<string | null> {
    try {
        console.log('🔑 Fetching order token via redirect...');
        console.log(`   Order: ${orderNumber}`);
        console.log(`   Email: ${contactEmail}`);

        // Construct the initial URL
        const initialUrl = `https://store.apple.com/xc/jp/vieworder/${orderNumber}/${contactEmail}/`;
        console.log(`   URL: ${initialUrl}`);

        // Make request with manual redirect handling
        const response = await fetch(initialUrl, {
            method: 'GET',
            redirect: 'manual', // Don't follow redirects automatically
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        console.log(`   Response status: ${response.status}`);

        // Check if we got a redirect response (3xx status codes)
        if (response.status < 300 || response.status >= 400) {
            console.log('   ⚠️ No redirect received');
            return null;
        }

        // Get the Location header
        const location = response.headers.get('Location');
        if (!location) {
            console.log('   ⚠️ No Location header in redirect response');
            return null;
        }

        console.log(`   Redirect URL: ${location}`);

        // Extract token from redirect URL using regex
        // Pattern: /shop/order/guest/W{digits}/{token}
        const tokenMatch = location.match(/\/shop\/order\/guest\/W\d+\/([a-f0-9]+)/i);

        if (!tokenMatch || !tokenMatch[1]) {
            console.log('   ⚠️ Could not extract token from redirect URL');
            return null;
        }

        const token = tokenMatch[1];
        console.log(`   ✅ Got order token from redirect: ${token.substring(0, 20)}...`);

        return token;

    } catch (error) {
        console.error('   ❌ Error fetching order token via redirect:', error);
        if (error instanceof Error) {
            console.error('   Error message:', error.message);
        }
        return null;
    }
}
