import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET: Search inventory by order number
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderNumber = searchParams.get('order_number');

        if (!orderNumber) {
            return NextResponse.json(
                { error: 'order_number parameter is required' },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('order_number', orderNumber)
            .maybeSingle();

        if (error) {
            console.error('Error searching inventory:', error);
            return NextResponse.json(
                { error: 'Failed to search inventory' },
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
