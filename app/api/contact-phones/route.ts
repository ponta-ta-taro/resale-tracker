import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: 連絡先電話番号一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('contact_phones')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching contact phones:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しい連絡先電話番号を作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // バリデーション
        if (!body.phone) {
            return NextResponse.json(
                { error: '電話番号は必須です' },
                { status: 400 }
            );
        }

        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('contact_phones')
            .insert({
                user_id: user.id,
                phone: body.phone,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating contact phone:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
