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
            // First, clear existing links and reset shipped_to_buyer_at
            await supabase
                .from('inventory')
                .update({
                    shipment_id: null,
                    shipped_to_buyer_at: null
                })
                .eq('shipment_id', id);

            // Then, set new links with shipped_to_buyer_at
            if (inventory_ids.length > 0) {
                const { error: updateError } = await supabase
                    .from('inventory')
                    .update({
                        shipment_id: id,
                        shipped_to_buyer_at: shipmentData.shipped_at
                    })
                    .in('id', inventory_ids);

                if (updateError) {
                    console.error('Error updating inventory:', updateError);
                }
            }
        } else if (shipmentData.shipped_at !== undefined) {
            // If only shipment date changed (no inventory_ids in request),
            // update shipped_to_buyer_at for all linked inventory
            await supabase
                .from('inventory')
                .update({ shipped_to_buyer_at: shipmentData.shipped_at })
                .eq('shipment_id', id);
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
