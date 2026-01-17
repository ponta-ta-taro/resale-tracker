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
        const shipmentId = searchParams.get('shipment_id');

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

        if (shipmentId !== null) {
            if (shipmentId === 'null') {
                query = query.is('shipment_id', null);
            } else {
                query = query.eq('shipment_id', shipmentId);
            }
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

        // Convert all empty strings to null (prevents UUID errors)
        const sanitizedData = Object.fromEntries(
            Object.entries(body).map(([key, value]) => [
                key,
                value === '' ? null : value
            ])
        );

        // Also convert "なし" to null for apple_id_used
        if (sanitizedData.apple_id_used === 'なし') {
            sanitizedData.apple_id_used = null;
        }

        // Add user_id
        sanitizedData.user_id = user.id;

        const { data, error } = await supabase
            .from('inventory')
            .insert([sanitizedData])
            .select()
            .single();

        if (error) {
            console.error('Error creating inventory:', error);
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
