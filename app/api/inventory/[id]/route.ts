import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { InventoryV2Input } from '@/types';

// GET /api/inventory/[id] - 在庫詳細取得
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
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
                order_token,
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
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            console.error('Error fetching inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/inventory/[id] - 在庫更新
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: Partial<InventoryV2Input> = await request.json();

        // 更新データ準備（undefined を除外）
        const updateData: Record<string, any> = {};

        if (body.model_name !== undefined) updateData.model_name = body.model_name || null;
        if (body.storage !== undefined) updateData.storage = body.storage || null;
        if (body.color !== undefined) updateData.color = body.color || null;
        if (body.serial_number !== undefined) updateData.serial_number = body.serial_number || null;
        if (body.imei !== undefined) updateData.imei = body.imei || null;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.purchase_price !== undefined) updateData.purchase_price = body.purchase_price;
        if (body.expected_price !== undefined) updateData.expected_price = body.expected_price;
        if (body.actual_price !== undefined) updateData.actual_price = body.actual_price;
        if (body.order_date !== undefined) updateData.order_date = body.order_date || null;
        if (body.expected_delivery_start !== undefined) updateData.expected_delivery_start = body.expected_delivery_start || null;
        if (body.expected_delivery_end !== undefined) updateData.expected_delivery_end = body.expected_delivery_end || null;
        if (body.original_delivery_start !== undefined) updateData.original_delivery_start = body.original_delivery_start || null;
        if (body.original_delivery_end !== undefined) updateData.original_delivery_end = body.original_delivery_end || null;
        if (body.delivered_at !== undefined) updateData.delivered_at = body.delivered_at || null;
        if (body.carrier !== undefined) updateData.carrier = body.carrier || null;
        if (body.tracking_number !== undefined) updateData.tracking_number = body.tracking_number || null;
        if (body.purchase_source !== undefined) updateData.purchase_source = body.purchase_source || null;
        if (body.apple_account_id !== undefined) updateData.apple_account_id = body.apple_account_id || null;
        if (body.contact_email_id !== undefined) updateData.contact_email_id = body.contact_email_id || null;
        if (body.contact_phone_id !== undefined) updateData.contact_phone_id = body.contact_phone_id || null;
        if (body.payment_method_id !== undefined) updateData.payment_method_id = body.payment_method_id || null;
        if (body.sold_to !== undefined) updateData.sold_to = body.sold_to || null;
        if (body.buyer_carrier !== undefined) updateData.buyer_carrier = body.buyer_carrier || null;
        if (body.buyer_tracking_number !== undefined) updateData.buyer_tracking_number = body.buyer_tracking_number || null;
        if (body.shipped_to_buyer_at !== undefined) updateData.shipped_to_buyer_at = body.shipped_to_buyer_at || null;
        if (body.sold_at !== undefined) updateData.sold_at = body.sold_at || null;
        if (body.paid_at !== undefined) updateData.paid_at = body.paid_at || null;
        if (body.receipt_received_at !== undefined) updateData.receipt_received_at = body.receipt_received_at || null;
        if (body.shipment_id !== undefined) updateData.shipment_id = body.shipment_id || null;
        if (body.notes !== undefined) updateData.notes = body.notes || null;

        // updated_at を自動更新
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('inventory')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
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
                order_token,
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
            console.error('Error updating inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/inventory/[id] - 在庫削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // 認証チェック
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting inventory:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
