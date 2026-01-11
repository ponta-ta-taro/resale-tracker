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
    imei: string | null;
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
    created_at: string;
    updated_at: string;
}


export type InventoryStatus = 'ordered' | 'shipped' | 'arrived' | 'selling' | 'sold' | 'paid';

export interface InventoryInput {
    model_name: string;
    storage: string;
    color?: string;
    imei?: string;
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

// Payment card options
export const PAYMENT_CARDS = [
    'Mastercard',
    'Visa',
    'JCB',
    'American Express',
    'その他',
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
