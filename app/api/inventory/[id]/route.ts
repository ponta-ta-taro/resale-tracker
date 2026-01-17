import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { InventoryV2Input } from '@/types';

// GET: Fetch single inventory_v2 item
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('inventory_v2')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching inventory_v2:', error);
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

// PUT: Update inventory_v2 item
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: any = await request.json();

        // Remove fields that shouldn't be updated
        const {
            id,
            created_at,
            updated_at,
            user_id,
            inventory_code, // Don't allow manual update
            ...updateData
        } = body;

        // Convert empty strings to null
        const sanitizedData: any = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (value === '' || value === undefined) {
                sanitizedData[key] = null;
            } else {
                sanitizedData[key] = value;
            }
        }

        const { data, error } = await supabase
            .from('inventory_v2')
            .update(sanitizedData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating inventory_v2:', error);
            return NextResponse.json(
                { error: 'Failed to update inventory', details: error.message },
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

// DELETE: Delete inventory_v2 item
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('inventory_v2')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting inventory_v2:', error);
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
