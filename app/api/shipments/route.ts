import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get shipments with inventory count
        const { data: shipments, error } = await supabase
            .from('shipments')
            .select(`
                *,
                inventory:inventory(count)
            `)
            .order('shipped_at', { ascending: false });

        if (error) {
            console.error('Error fetching shipments:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform the data to include item count
        const shipmentsWithCount = shipments?.map(shipment => ({
            ...shipment,
            item_count: shipment.inventory?.[0]?.count || 0,
        })) || [];

        return NextResponse.json(shipmentsWithCount);
    } catch (error) {
        console.error('Error in GET /api/shipments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { inventory_ids, ...shipmentData } = body;

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Insert shipment
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .insert({
                ...shipmentData,
                user_id: user.id,
            })
            .select()
            .single();

        if (shipmentError) {
            console.error('Error creating shipment:', shipmentError);
            return NextResponse.json({ error: shipmentError.message }, { status: 500 });
        }

        // Update inventory items with shipment_id and shipped_to_buyer_at
        if (inventory_ids && inventory_ids.length > 0) {
            const { error: updateError } = await supabase
                .from('inventory')
                .update({
                    shipment_id: shipment.id,
                    shipped_to_buyer_at: shipmentData.shipped_at
                })
                .in('id', inventory_ids);

            if (updateError) {
                console.error('Error updating inventory:', updateError);
                // Don't fail the whole operation, just log the error
            }
        }

        return NextResponse.json(shipment);
    } catch (error) {
        console.error('Error in POST /api/shipments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
