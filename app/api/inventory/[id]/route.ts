import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { InventoryInput } from '@/types';

// GET: Fetch single inventory item
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching inventory:', error);
            return NextResponse.json(
                { error: 'Inventory not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT: Update inventory item
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const body: any = await request.json();

        console.log('PUT /api/inventory/[id] - Received body:', JSON.stringify(body, null, 2));

        // Sanitize the data - remove fields that shouldn't be updated
        const { id, created_at, updated_at, ...updateData } = body;

        // Convert empty strings to null for optional fields
        const sanitizedData: any = {};

        for (const [key, value] of Object.entries(updateData)) {
            if (value === '' || value === undefined) {
                sanitizedData[key] = null;
            } else {
                sanitizedData[key] = value;
            }
        }

        console.log('PUT /api/inventory/[id] - Sanitized data:', JSON.stringify(sanitizedData, null, 2));

        const { data, error } = await supabase
            .from('inventory')
            .update(sanitizedData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating inventory - Supabase error:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });
            return NextResponse.json(
                {
                    error: 'Failed to update inventory',
                    details: error.message,
                    supabaseError: error
                },
                { status: 500 }
            );
        }

        console.log('PUT /api/inventory/[id] - Update successful');
        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in PUT:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE: Delete inventory item
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting inventory:', error);
            return NextResponse.json(
                { error: 'Failed to delete inventory' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
