import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: 単一の連絡先電話番号を取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('contact_phones')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching contact phone:', error);
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: 連絡先電話番号を更新
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // バリデーション
        if (!body.phone_number) {
            return NextResponse.json(
                { error: '電話番号は必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('contact_phones')
            .update({
                phone_number: body.phone_number,
                label: body.label || null,
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating contact phone:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 連絡先電話番号を削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('contact_phones')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting contact phone:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
