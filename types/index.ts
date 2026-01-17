// Database types
export interface PriceHistory {
    id: string;
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
    model_name: string;
    storage: string;
    color: string | null;
    status: 'ordered' | 'shipped' | 'arrived' | 'selling' | 'sold' | 'paid';
    purchase_price: number | null;
    expected_price: number | null;
    actual_price: number | null;
    purchase_source: string | null;
    arrived_at: string | null;
    sold_at: string | null;
    paid_at: string | null;
    notes: string | null;
    order_number: string | null;
    order_date: string | null;
    expected_delivery_start: string | null;
    expected_delivery_end: string | null;
    payment_card: string | null;
    sold_to: string | null;
    tracking_number: string | null;
    carrier: string | null;
    shipment_id: string | null;
    // 外部キー（支払い方法のみ）
    payment_method_id: string | null;
    // JOINで取得する支払い方法名
    payment_method_name?: string | null;
    // シンプルなテキストフィールド
    apple_id_used: string | null;
    // 連絡先情報の外部キー
    contact_email_id: string | null;
    contact_phone_id: string | null;
    credit_card_id: string | null;
    apple_account: string | null;
    // 直接保存される連絡先情報（テキストフィールド）
    contact_email?: string | null;
    contact_phone?: string | null;
    // JOINで取得する連絡先情報（外部キー経由）
    credit_card?: string | null;
    created_at: string;
    updated_at: string;
    // Apple配送情報
    apple_tracking_number: string | null;
    apple_carrier: string | null;
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
    // シンプルなテキストフィールド
    apple_id_used?: string;
    // 連絡先情報の外部キー
    contact_email_id?: string;
    contact_phone_id?: string;
    credit_card_id?: string;
    apple_account?: string;
    // Apple配送情報
    apple_tracking_number?: string;
    apple_carrier?: string;
    order_tracking_url?: string;
}

// V2 Inventory Types
export type InventoryV2Status =
    | 'ordered'
    | 'shipped'
    | 'delivered'
    | 'sent_to_buyer'
    | 'buyer_completed'
    | 'paid'
    | 'receipt_received';

export interface InventoryV2 {
    id: string;
    user_id: string;
    inventory_code: string;
    order_number: string;
    item_index: number;
    model_name: string;
    storage: string;
    color: string | null;
    purchase_source: string | null;
    payment_method_id: string | null;
    apple_id_used: string | null;
    contact_email_id: string | null;
    status: InventoryV2Status;
    order_date: string | null;
    expected_delivery_date: string | null;
    original_expected_date: string | null;
    delivered_at: string | null;
    carrier: string | null;
    tracking_number: string | null;
    purchase_price: number | null;
    expected_price: number | null;
    actual_price: number | null;
    sold_to: string | null;
    buyer_carrier: string | null;
    buyer_tracking_number: string | null;
    sent_to_buyer_at: string | null;
    sold_at: string | null;
    paid_at: string | null;
    receipt_received_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InventoryV2Input {
    order_number: string;
    item_index?: number;
    model_name: string;
    storage: string;
    color?: string;
    purchase_source?: string;
    payment_method_id?: string;
    apple_id_used?: string;
    contact_email_id?: string;
    status: InventoryV2Status;
    order_date?: string;
    expected_delivery_date?: string;
    original_expected_date?: string;
    delivered_at?: string;
    carrier?: string;
    tracking_number?: string;
    purchase_price?: number | null;
    expected_price?: number | null;
    actual_price?: number | null;
    sold_to?: string;
    buyer_carrier?: string;
    buyer_tracking_number?: string;
    sent_to_buyer_at?: string;
    sold_at?: string;
    paid_at?: string;
    receipt_received_at?: string;
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
    shipped: '出荷完了',
    delivered: '配送済み',
    sent_to_buyer: '買取発送済み',
    buyer_completed: '買取手続完了',
    paid: '入金済み',
    receipt_received: '領収書受領',
};

export const STATUS_V2_COLORS: Record<InventoryV2Status, string> = {
    ordered: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-purple-100 text-purple-800',
    sent_to_buyer: 'bg-yellow-100 text-yellow-800',
    buyer_completed: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
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
    name: string;
    email: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppleAccountInput {
    name: string;
    email: string;
    notes?: string | null;
}

// Contact Email types
export interface ContactEmail {
    id: string;
    user_id: string;
    email: string;
    notes: string | null;
    created_at: string;
}

export interface ContactEmailInput {
    email: string;
    notes?: string | null;
}

// Contact Phone types
export interface ContactPhone {
    id: string;
    user_id: string;
    phone: string;
    notes: string | null;
    created_at: string;
}

export interface ContactPhoneInput {
    phone: string;
    notes?: string | null;
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
export const SHIPPED_TO_OPTIONS = [
    'モバイルミックス',
    'イオシス',
    'じゃんぱら',
    'ゲオ',
] as const;

// Carrier options
export const CARRIER_OPTIONS = [
    'ヤマト運輸',
    '佐川急便',
    '日本郵便',
] as const;

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

// Email log types
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

export interface EmailLog {
    id: string;
    user_id: string;
    inventory_id: string | null;
    from_email: string;
    to_email: string;
    subject: string;
    email_type: EmailType;
    process_result: ProcessResult;
    notes: string | null;
    received_at: string;
    created_at: string;
}

export interface EmailLogInput {
    inventory_id?: string | null;
    from_email: string;
    to_email: string;
    subject: string;
    email_type: EmailType;
    process_result: ProcessResult;
    notes?: string | null;
}

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
