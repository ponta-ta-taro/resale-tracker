import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { InventoryV2Input } from '@/types';

// GET: Fetch all inventory_v2 items
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // RLS will automatically filter to user's data
        let query = supabase
            .from('inventory_v2')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching inventory_v2:', error);
            return NextResponse.json(
                { error: 'Failed to fetch inventory' },
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

// POST: Create new inventory_v2 item
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: InventoryV2Input = await request.json();

        // Convert all empty strings to null
        const sanitizedData = Object.fromEntries(
            Object.entries(body).map(([key, value]) => [
                key,
                value === '' ? null : value
            ])
        );

        // Generate inventory_code
        const item_index = sanitizedData.item_index || 1;
        const inventory_code = `${sanitizedData.order_number}-${item_index}`;

        // Prepare data for insertion
        const insertData = {
            ...sanitizedData,
            inventory_code,
            item_index,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from('inventory_v2')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('Error creating inventory_v2:', error);
            return NextResponse.json(
                { error: 'Failed to create inventory', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
