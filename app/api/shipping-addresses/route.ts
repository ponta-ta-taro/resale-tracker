import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ShippingAddressInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET: 配送先住所一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('shipping_addresses')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching shipping addresses:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しい配送先住所を作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body: ShippingAddressInput = await request.json();

        if (!body.name || !body.address) {
            return NextResponse.json(
                { error: '宛名と住所は必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('shipping_addresses')
            .insert({
                name: body.name,
                postal_code: body.postal_code || null,
                address: body.address,
                address_variant: body.address_variant || null,
                phone_number: body.phone_number || null,
                is_active: body.is_active ?? true,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating shipping address:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
