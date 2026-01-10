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
        const body: Partial<InventoryInput> = await request.json();

        const { data, error } = await supabase
            .from('inventory')
            .update(body)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating inventory:', error);
            return NextResponse.json(
                { error: 'Failed to update inventory' },
                { status: 500 }
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
