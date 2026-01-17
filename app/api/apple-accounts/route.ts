import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Apple ID一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('apple_accounts')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching apple accounts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しいApple IDを作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // バリデーション - 名前のみ必須、メールアドレスは任意
        if (!body.name) {
            return NextResponse.json(
                { error: '名前は必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('apple_accounts')
            .insert({
                name: body.name,
                email: body.email || null,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating apple account:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
