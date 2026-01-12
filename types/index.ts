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
    serial_number: string | null;
    // 外部キー（支払い方法のみ）
    payment_method_id: string | null;
    // JOINで取得する支払い方法名
    payment_method_name?: string | null;
    // シンプルなテキストフィールド
    apple_id_used: string | null;
    created_at: string;
    updated_at: string;
}


export type InventoryStatus = 'ordered' | 'shipped' | 'arrived' | 'selling' | 'sold' | 'paid';

export interface InventoryInput {
    model_name: string;
    storage: string;
    color?: string;
    status: InventoryStatus;
    purchase_price?: number;
    expected_price?: number;
    actual_price?: number;
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
    serial_number?: string;
    // 外部キー（支払い方法のみ）
    payment_method_id?: string;
    // シンプルなテキストフィールド
    apple_id_used?: string;
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
    shipped: 'bg-cyan-100 text-cyan-800',
    arrived: 'bg-purple-100 text-purple-800',
    selling: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-green-100 text-green-800',
    paid: 'bg-gray-100 text-gray-800',
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
