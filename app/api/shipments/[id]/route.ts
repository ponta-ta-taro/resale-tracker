import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: shipment, error } = await supabase
            .from('shipments')
            .select(`
                *,
                inventory:inventory(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching shipment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }

        return NextResponse.json(shipment);
    } catch (error) {
        console.error('Error in GET /api/shipments/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();
        const { inventory_ids, ...shipmentData } = body;

        // Update shipment
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .update(shipmentData)
            .eq('id', id)
            .select()
            .single();

        if (shipmentError) {
            console.error('Error updating shipment:', shipmentError);
            return NextResponse.json({ error: shipmentError.message }, { status: 500 });
        }

        // Update inventory items
        if (inventory_ids !== undefined) {
            // First, clear existing links and reset all shipment-related fields
            await supabase
                .from('inventory')
                .update({
                    shipment_id: null,
                    shipped_to_buyer_at: null,
                    buyer_carrier: null,
                    buyer_tracking_number: null,
                    sold_to: null
                })
                .eq('shipment_id', id);

            // Then, set new links with all shipment data
            if (inventory_ids.length > 0) {
                const { error: updateError } = await supabase
                    .from('inventory')
                    .update({
                        shipment_id: id,
                        shipped_to_buyer_at: shipmentData.shipped_at,
                        buyer_carrier: shipmentData.carrier,
                        buyer_tracking_number: shipmentData.tracking_number,
                        sold_to: shipmentData.shipped_to
                    })
                    .in('id', inventory_ids);

                if (updateError) {
                    console.error('Error updating inventory:', updateError);
                }
            }
        } else if (shipmentData.shipped_at !== undefined || shipmentData.carrier !== undefined ||
            shipmentData.tracking_number !== undefined || shipmentData.shipped_to !== undefined) {
            // If shipment data changed (no inventory_ids in request),
            // update all corresponding fields for linked inventory
            const updateData: any = {};
            if (shipmentData.shipped_at !== undefined) updateData.shipped_to_buyer_at = shipmentData.shipped_at;
            if (shipmentData.carrier !== undefined) updateData.buyer_carrier = shipmentData.carrier;
            if (shipmentData.tracking_number !== undefined) updateData.buyer_tracking_number = shipmentData.tracking_number;
            if (shipmentData.shipped_to !== undefined) updateData.sold_to = shipmentData.shipped_to;

            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('inventory')
                    .update(updateData)
                    .eq('shipment_id', id);
            }
        }

        return NextResponse.json(shipment);
    } catch (error) {
        console.error('Error in PUT /api/shipments/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Clear inventory links first
        await supabase
            .from('inventory')
            .update({ shipment_id: null })
            .eq('shipment_id', id);

        // Delete shipment
        const { error } = await supabase
            .from('shipments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting shipment:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/shipments/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
