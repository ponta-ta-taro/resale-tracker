import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { InventoryV2Input } from '@/types';

// GET /api/inventory - 在庫一覧取得
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // クエリパラメータ
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // クエリ構築
        let query = supabase
            .from('inventory')
            .select(`
                id,
                user_id,
                inventory_code,
                order_number,
                item_index,
                status,
                model_name,
                storage,
                color,
                serial_number,
                imei,
                purchase_price,
                expected_price,
                actual_price,
                order_date,
                expected_delivery_start,
                expected_delivery_end,
                original_delivery_start,
                original_delivery_end,
                delivered_at,
                shipped_to_buyer_at,
                sold_at,
                paid_at,
                receipt_received_at,
                carrier,
                tracking_number,
                buyer_carrier,
                buyer_tracking_number,
                purchase_source,
                sold_to,
                notes,
                apple_account_id,
                contact_email_id,
                contact_phone_id,
                payment_method_id,
                shipment_id,
                created_at,
                updated_at
            `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // ステータスフィルター
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, count });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/inventory - 在庫新規登録
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: InventoryV2Input = await request.json();

        // 必須フィールドチェック
        if (!body.order_number) {
            return NextResponse.json({ error: 'order_number is required' }, { status: 400 });
        }

        // item_indexのデフォルト値
        const item_index = body.item_index || 1;

        // inventory_code を自動生成
        const inventory_code = `${body.order_number}-${item_index}`;

        // データ準備
        const insertData = {
            user_id: user.id,
            inventory_code,
            order_number: body.order_number,
            item_index,
            model_name: body.model_name || null,
            storage: body.storage || null,
            color: body.color || null,
            serial_number: body.serial_number || null,
            imei: body.imei || null,
            status: body.status || 'ordered',
            purchase_price: body.purchase_price || null,
            expected_price: body.expected_price || null,
            actual_price: body.actual_price || null,
            order_date: body.order_date || null,
            expected_delivery_start: body.expected_delivery_start || null,
            expected_delivery_end: body.expected_delivery_end || null,
            original_delivery_start: body.original_delivery_start || null,
            original_delivery_end: body.original_delivery_end || null,
            delivered_at: body.delivered_at || null,
            carrier: body.carrier || null,
            tracking_number: body.tracking_number || null,
            purchase_source: body.purchase_source || null,
            apple_account_id: body.apple_account_id || null,
            contact_email_id: body.contact_email_id || null,
            contact_phone_id: body.contact_phone_id || null,
            payment_method_id: body.payment_method_id || null,
            sold_to: body.sold_to || null,
            buyer_carrier: body.buyer_carrier || null,
            buyer_tracking_number: body.buyer_tracking_number || null,
            shipped_to_buyer_at: body.shipped_to_buyer_at || null,
            sold_at: body.sold_at || null,
            paid_at: body.paid_at || null,
            receipt_received_at: body.receipt_received_at || null,
            shipment_id: body.shipment_id || null,
            notes: body.notes || null,
        };

        const { data, error } = await supabase
            .from('inventory')
            .insert(insertData)
            .select(`
                id,
                user_id,
                inventory_code,
                order_number,
                item_index,
                status,
                model_name,
                storage,
                color,
                serial_number,
                imei,
                purchase_price,
                expected_price,
                actual_price,
                order_date,
                expected_delivery_start,
                expected_delivery_end,
                original_delivery_start,
                original_delivery_end,
                delivered_at,
                shipped_to_buyer_at,
                sold_at,
                paid_at,
                receipt_received_at,
                carrier,
                tracking_number,
                buyer_carrier,
                buyer_tracking_number,
                purchase_source,
                sold_to,
                notes,
                apple_account_id,
                contact_email_id,
                contact_phone_id,
                payment_method_id,
                shipment_id,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            console.error('Error creating inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
