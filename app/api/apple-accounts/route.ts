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
            .order('sort_order', { ascending: true });

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

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 認証ユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const body = await request.json();

        // バリデーション - 名前のみ必須、メールアドレスは任意
        if (!body.name) {
            return NextResponse.json(
                { error: '名前は必須です' },
                { status: 400 }
            );
        }

        // 重複チェック（emailがある場合のみ）
        if (body.email) {
            const { data: existingAccount } = await supabase
                .from('apple_accounts')
                .select('id')
                .eq('user_id', user.id)
                .eq('email', body.email)
                .maybeSingle();

            if (existingAccount) {
                return NextResponse.json(
                    { error: 'このApple IDは既に登録されています' },
                    { status: 400 }
                );
            }
        }

        const { data, error } = await supabase
            .from('apple_accounts')
            .insert({
                name: body.name,
                email: body.email || null,
                notes: body.notes || null,
                user_id: user.id,
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
