import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { MobileLineInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET: 携帯回線一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('mobile_lines')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching mobile lines:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しい携帯回線を作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body: MobileLineInput = await request.json();

        if (!body.name) {
            return NextResponse.json(
                { error: '識別名は必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('mobile_lines')
            .insert({
                name: body.name,
                carrier: body.carrier || null,
                phone_number: body.phone_number || null,
                is_active: body.is_active ?? true,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating mobile line:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
