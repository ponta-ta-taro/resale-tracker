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
    status: 'ordered' | 'arrived' | 'selling' | 'sold' | 'paid';
    purchase_price: number | null;
    expected_price: number | null;
    actual_price: number | null;
    purchase_source: string | null;
    ordered_at: string | null;
    arrived_at: string | null;
    sold_at: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}
