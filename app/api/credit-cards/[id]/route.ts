import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: 単一のクレジットカードを取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching credit card:', error);
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: クレジットカードを更新
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // バリデーション
        if (!body.card_name) {
            return NextResponse.json(
                { error: 'カード名は必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('credit_cards')
            .update({
                card_name: body.card_name,
                notes: body.notes || null,
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating credit card:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: クレジットカードを削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('credit_cards')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting credit card:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
