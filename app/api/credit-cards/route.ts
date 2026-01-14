import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: クレジットカード一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching credit cards:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しいクレジットカードを作成
export async function POST(request: NextRequest) {
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

        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('credit_cards')
            .insert({
                user_id: user.id,
                card_name: body.card_name,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating credit card:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
