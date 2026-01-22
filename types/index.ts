// Database types
export interface PriceHistory {
    id: string;
    source: string;
    model_name: string;
    storage: string;
    price: number;
    color_note: string | null;
    captured_at: string;
    created_at: string;
}

export interface Model {
    id: string;
    brand: string;
    series: string;
    storage: string;
    created_at: string;
}

export interface Inventory {
    id: string;
    user_id?: string;
    inventory_code?: string;
    order_number: string | null;
    item_index?: number;
    model_name: string;
    storage: string;
    color: string | null;
    serial_number: string | null;
    imei: string | null;
    status: 'ordered' | 'shipped' | 'arrived' | 'selling' | 'sold' | 'paid';
    purchase_price: number | null;
    expected_price: number | null;
    actual_price: number | null;
    order_date: string | null;
    expected_delivery_start: string | null;
    expected_delivery_end: string | null;
    original_delivery_start: string | null;
    original_delivery_end: string | null;
    delivered_at: string | null;
    carrier: string | null;
    tracking_number: string | null;
    purchase_source: string | null;
    apple_account_id: string | null;
    contact_email_id: string | null;
    contact_phone_id: string | null;
    payment_method_id: string | null;
    sold_to: string | null;
    buyer_carrier: string | null;
    buyer_tracking_number: string | null;
    shipped_to_buyer_at: string | null;
    sold_at: string | null;
    paid_at: string | null;
    receipt_received_at: string | null;
    shipment_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Legacy fields (for backward compatibility)
    arrived_at: string | null;
    payment_card: string | null;
    apple_account: string | null;
    credit_card_id: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    credit_card?: string | null;
    payment_method_name?: string | null;
    order_tracking_url: string | null;
}


export type InventoryStatus = 'ordered' | 'shipped' | 'arrived' | 'selling' | 'sold' | 'paid';

export interface InventoryInput {
    model_name: string;
    storage: string;
    color?: string;
    status: InventoryStatus;
    purchase_price?: number | null;
    expected_price?: number | null;
    actual_price?: number | null;
    purchase_source?: string;
    arrived_at?: string;
    sold_at?: string;
    paid_at?: string;
    notes?: string;
    order_number?: string;
    order_date?: string;
    expected_delivery_start?: string;
    expected_delivery_end?: string;
    payment_card?: string;
    sold_to?: string;
    tracking_number?: string;
    carrier?: string;
    shipment_id?: string | null;
    // 外部キー（支払い方法のみ）
    payment_method_id?: string;
    // 連絡先情報の外部キー
    contact_email_id?: string;
    contact_phone_id?: string;
    credit_card_id?: string;
    apple_account?: string;
    order_tracking_url?: string;
}

// V2 Inventory Types - Based on DATABASE.md
export const INVENTORY_STATUSES = [
    'ordered',
    'processing',
    'preparing_shipment',
    'shipped',
    'delivered',
    'sent_to_buyer',
    'buyer_completed',
    'paid',
    'receipt_received'
] as const;

export type InventoryV2Status = typeof INVENTORY_STATUSES[number];

export interface InventoryV2 {
    id: string;
    user_id: string;
    inventory_code: string;
    order_number: string;
    item_index: number;
    model_name: string | null;
    storage: string | null;
    color: string | null;
    serial_number: string | null;
    imei: string | null;
    status: InventoryV2Status;
    purchase_price: number | null;
    expected_price: number | null;
    actual_price: number | null;
    order_date: string | null;
    expected_delivery_start: string | null;
    expected_delivery_end: string | null;
    original_delivery_start: string | null;
    original_delivery_end: string | null;
    delivered_at: string | null;
    carrier: string | null;
    tracking_number: string | null;
    order_token: string | null;
    contact_email: string | null;
    purchase_source: string | null;
    apple_account_id: string | null;
    contact_email_id: string | null;
    contact_phone_id: string | null;
    payment_method_id: string | null;
    sold_to: string | null;
    buyer_carrier: string | null;
    buyer_tracking_number: string | null;
    shipped_to_buyer_at: string | null;
    sold_at: string | null;
    paid_at: string | null;
    receipt_received_at: string | null;
    shipment_id: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InventoryV2Input {
    order_number: string;
    item_index?: number;
    model_name?: string;
    storage?: string;
    color?: string;
    serial_number?: string;
    imei?: string;
    status?: InventoryV2Status;
    purchase_price?: number | null;
    expected_price?: number | null;
    actual_price?: number | null;
    order_date?: string;
    expected_delivery_start?: string;
    expected_delivery_end?: string;
    original_delivery_start?: string;
    original_delivery_end?: string;
    delivered_at?: string;
    carrier?: string;
    tracking_number?: string;
    purchase_source?: string;
    apple_account_id?: string;
    contact_email_id?: string;
    contact_phone_id?: string;
    payment_method_id?: string;
    sold_to?: string;
    buyer_carrier?: string;
    buyer_tracking_number?: string;
    shipped_to_buyer_at?: string;
    sold_at?: string;
    paid_at?: string;
    receipt_received_at?: string;
    shipment_id?: string;
    notes?: string;
}


// Status labels and colors
export const STATUS_LABELS: Record<InventoryStatus, string> = {
    ordered: '発注済み',
    shipped: '出荷済み',
    arrived: '納品済み',
    selling: '販売中',
    sold: '売却済み',
    paid: '入金済み',
};


export const STATUS_COLORS: Record<InventoryStatus, string> = {
    ordered: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    arrived: 'bg-purple-100 text-purple-800',
    selling: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-green-100 text-green-800',
    paid: 'bg-gray-100 text-gray-800',
};

// V2 Status labels and colors
export const STATUS_V2_LABELS: Record<InventoryV2Status, string> = {
    ordered: '注文確定',
    processing: '処理中',
    preparing_shipment: '配送準備中',
    shipped: '出荷完了',
    delivered: '配送済み',
    sent_to_buyer: '買取発送済み',
    buyer_completed: '買取手続完了',
    paid: '入金済み',
    receipt_received: '領収書受領',
};

export const STATUS_V2_COLORS: Record<InventoryV2Status, string> = {
    ordered: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-yellow-100 text-yellow-800',
    preparing_shipment: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    sent_to_buyer: 'bg-purple-100 text-purple-800',
    buyer_completed: 'bg-purple-100 text-purple-800',
    paid: 'bg-gray-100 text-gray-800',
    receipt_received: 'bg-gray-100 text-gray-800',
};


// 詳細ページ用のステータス色（枠線付き）
export const STATUS_COLORS_DETAIL: Record<InventoryStatus, string> = {
    ordered: 'bg-blue-100 border-blue-500 text-blue-700',
    shipped: 'bg-orange-100 border-orange-500 text-orange-700',
    arrived: 'bg-green-100 border-green-500 text-green-700',
    selling: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    sold: 'bg-purple-100 border-purple-500 text-purple-700',
    paid: 'bg-gray-100 border-gray-500 text-gray-700',
};

// Payment card options (legacy - will be replaced by payment_methods)
export const PAYMENT_CARDS = [
    'Mastercard',
    'Visa',
    'JCB',
    'American Express',
    'その他',
] as const;

// Payment method types
export type PaymentMethodType = 'credit' | 'debit' | 'cash';

export const PAYMENT_METHOD_TYPES: Record<PaymentMethodType, string> = {
    credit: 'クレジットカード',
    debit: 'デビットカード',
    cash: '現金',
};

export interface PaymentMethod {
    id: string;
    name: string;
    type: PaymentMethodType;
    closing_day: number | null;
    payment_day: number | null;
    payment_month_offset: number | null;
    credit_limit: number | null;
    is_active: boolean;
    last_used_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodInput {
    name: string;
    type: PaymentMethodType;
    closing_day?: number | null;
    payment_day?: number | null;
    payment_month_offset?: number | null;
    credit_limit?: number | null;
    is_active?: boolean;
    notes?: string | null;
}

export interface EarlyRepayment {
    id: string;
    payment_method_id: string;
    amount: number;
    repayment_date: string;
    target_month: string | null;
    notes: string | null;
    created_at: string;
}

export interface EarlyRepaymentInput {
    payment_method_id: string;
    amount: number;
    repayment_date: string;
    target_month?: string | null;
    notes?: string | null;
}

// Apple Account types
export interface AppleAccount {
    id: string;
    user_id: string;
    name: string;
    email: string | null;
    is_guest: boolean;
    notes: string | null;
    created_at: string;
}

export interface AppleAccountInput {
    name: string;
    email?: string | null;
    is_guest?: boolean;
    notes?: string | null;
}

// Contact Email types
export interface ContactEmail {
    id: string;
    user_id: string;
    email: string;
    label: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ContactEmailInput {
    email: string;
    label?: string | null;
    is_active?: boolean;
}

// Contact Phone types
export interface ContactPhone {
    id: string;
    user_id: string;
    phone_number: string;
    label: string | null;
    is_active: boolean;
    created_at: string;
}

export interface ContactPhoneInput {
    phone_number: string;
    label?: string | null;
    is_active?: boolean;
}

// Purchase source options (仕入先)
export const PURCHASE_SOURCE_OPTIONS = [
    'Apple Store',
    'Amazon',
] as const;

// Sales destination options
export const SOLD_TO_OPTIONS = [
    'モバイルミックス',
    'その他',
] as const;

// Shipment destination options
export const SHIPPED_TO_OPTIONS: string[] = [
    'モバイルミックス',
    'イオシス',
    'じゃんぱら',
    'ゲオ',
];

// Carrier options (DEPRECATED - use BUYER_CARRIERS instead)
// @deprecated Use BUYER_CARRIERS for consistent code-based carrier handling
export const CARRIER_OPTIONS: string[] = [
    'ヤマト運輸',
    '佐川急便',
    '日本郵便',
];

// Buyer carrier types (for tracking shipments to buyback companies)
export type BuyerCarrierCode = 'japan_post' | 'yamato' | 'sagawa';

export interface CarrierConfig {
    code: BuyerCarrierCode;
    name: string;
    trackingUrl: string;
}

export const BUYER_CARRIERS: Record<BuyerCarrierCode, CarrierConfig> = {
    japan_post: {
        code: 'japan_post',
        name: '日本郵便',
        trackingUrl: 'https://trackings.post.japanpost.jp/services/srv/search/input'
    },
    yamato: {
        code: 'yamato',
        name: 'ヤマト運輸',
        trackingUrl: 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number01='
    },
    sagawa: {
        code: 'sagawa',
        name: '佐川急便',
        trackingUrl: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo='
    }
};

export function getCarrierName(code: BuyerCarrierCode | string | null): string {
    if (!code) return '-';
    const carrier = BUYER_CARRIERS[code as BuyerCarrierCode];
    return carrier ? carrier.name : code;
}

export function getTrackingUrl(carrier: BuyerCarrierCode | string | null, trackingNumber: string | null): string | null {
    if (!carrier || !trackingNumber) return null;
    const carrierConfig = BUYER_CARRIERS[carrier as BuyerCarrierCode];
    if (!carrierConfig) return null;

    // Japan Post uses input form page without tracking number parameter
    if (carrier === 'japan_post') {
        return carrierConfig.trackingUrl;
    }

    // Other carriers append tracking number to URL
    return carrierConfig.trackingUrl + encodeURIComponent(trackingNumber);
}

// Shipment types
export interface Shipment {
    id: string;
    user_id: string;
    shipping_cost: number;
    shipped_to: string;
    carrier: string;
    tracking_number: string | null;
    shipped_at: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ShipmentInput {
    shipping_cost: number;
    shipped_to: string;
    carrier: string;
    tracking_number?: string | null;
    shipped_at: string;
    notes?: string | null;
}

// Reward types
export type RewardType = 'gift_card' | 'credit_card_points';

export const REWARD_TYPES: Record<RewardType, string> = {
    gift_card: 'ギフトカード還元',
    credit_card_points: 'クレカポイント',
};

export interface Reward {
    id: string;
    user_id: string;
    inventory_id: string | null;
    type: RewardType;
    description: string;
    amount: number | null;
    points: number | null;
    point_rate: number | null;
    earned_at: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface RewardInput {
    inventory_id?: string | null;
    type: RewardType;
    description: string;
    amount?: number | null;
    points?: number | null;
    point_rate?: number | null;
    earned_at: string;
    notes?: string | null;
}

// Email log types - Based on DATABASE.md email_logs table
export type EmailLogType = 'order_confirmation' | 'order_thanks' | 'shipping_notification' | 'delivery_update' | 'invoice' | 'survey' | 'amazon_order_confirmation' | 'amazon_shipping_notification' | 'amazon_out_for_delivery' | 'amazon_delivered' | 'forwarding_confirmation' | 'unknown';
export type EmailLogStatus = 'success' | 'skipped_unsupported' | 'skipped_duplicate' | 'pending' | 'error';

export const EMAIL_LOG_TYPES: Record<EmailLogType, string> = {
    order_confirmation: '注文確認',
    order_thanks: '注文ありがとう',
    shipping_notification: '出荷通知',
    delivery_update: 'お届け日変更',
    invoice: '請求書',
    survey: 'アンケート',
    amazon_order_confirmation: 'Amazon注文確認',
    amazon_shipping_notification: 'Amazon発送済み',
    amazon_out_for_delivery: 'Amazon配達中',
    amazon_delivered: 'Amazon配達済み',
    forwarding_confirmation: '転送確認',
    unknown: '不明',
};

export const EMAIL_LOG_STATUSES: Record<EmailLogStatus, string> = {
    success: '✅ 成功',
    skipped_unsupported: '⏭️ スキップ（未対応）',
    skipped_duplicate: '⏭️ スキップ（重複）',
    pending: '⏳ 承認待ち',
    error: '❌ エラー',
};

export const EMAIL_LOG_STATUS_COLORS: Record<EmailLogStatus, string> = {
    success: 'bg-green-100 text-green-800',
    skipped_unsupported: 'bg-yellow-100 text-yellow-800',
    skipped_duplicate: 'bg-blue-100 text-blue-800',
    pending: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
};

export interface EmailLog {
    id: string;
    user_id: string;
    email_type: EmailLogType;
    subject: string | null;
    sender: string | null;
    order_number: string | null;
    raw_content: string | null;
    parsed_data: Record<string, any> | null;
    status: EmailLogStatus;
    error_message: string | null;
    received_at: string;
    processed_at: string;
    created_at: string;
}

export interface EmailLogInput {
    email_type: EmailLogType;
    subject?: string | null;
    sender?: string | null;
    order_number?: string | null;
    raw_content?: string | null;
    parsed_data?: Record<string, any> | null;
    status: EmailLogStatus;
    error_message?: string | null;
    received_at: string;
    processed_at: string;
}

// Legacy email types (kept for backward compatibility)
export type EmailType = 'order' | 'shipping' | 'delivery' | 'invoice' | 'unknown';
export type ProcessResult = 'success' | 'skipped' | 'error';

export const EMAIL_TYPES: Record<EmailType, string> = {
    order: '注文確認',
    shipping: '出荷通知',
    delivery: '配達完了',
    invoice: '請求書',
    unknown: 'その他',
};

export const PROCESS_RESULTS: Record<ProcessResult, string> = {
    success: '成功',
    skipped: 'スキップ',
    error: 'エラー',
};

// Parsed Apple order data
export interface ParsedAppleOrder {
    orderNumber: string;
    orderDate: string;
    modelName: string;
    storage: string;
    color: string;
    price: number;
    deliveryStart: string;
    deliveryEnd: string;
    paymentCard: string;
}

// Utility functions
export function calculateProfit(purchasePrice: number | null, actualPrice: number | null): number | null {
    if (purchasePrice === null || actualPrice === null) return null;
    return actualPrice - purchasePrice;
}

export function calculateProfitRate(purchasePrice: number | null, actualPrice: number | null): number | null {
    if (purchasePrice === null || actualPrice === null || purchasePrice === 0) return null;
    return ((actualPrice - purchasePrice) / purchasePrice) * 100;
}
