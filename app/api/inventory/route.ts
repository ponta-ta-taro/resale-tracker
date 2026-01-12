import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { InventoryInput } from '@/types';

// GET: Fetch all inventory items
export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Optional filters
        const status = searchParams.get('status');
        const model = searchParams.get('model');

        // RLS will automatically filter to user's data
        let query = supabase
            .from('inventory')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (model) {
            query = query.eq('model_name', model);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching inventory:', error);
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


// POST: Create new inventory item
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: InventoryInput = await request.json();

        // Automatically add user_id
        const { data, error } = await supabase
            .from('inventory')
            .insert([{ ...body, user_id: user.id }])
            .select()
            .single();

        if (error) {
            console.error('Error creating inventory:', error);
            return NextResponse.json(
                { error: 'Failed to create inventory' },
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
