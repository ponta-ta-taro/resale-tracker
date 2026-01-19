import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: 連絡先メール一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('contact_emails')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching contact emails:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しい連絡先メールを作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // バリデーション
        if (!body.email) {
            return NextResponse.json(
                { error: 'メールアドレスは必須です' },
                { status: 400 }
            );
        }

        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 重複チェック
        const { data: existingEmail } = await supabase
            .from('contact_emails')
            .select('id')
            .eq('user_id', user.id)
            .eq('email', body.email)
            .maybeSingle();

        if (existingEmail) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('contact_emails')
            .insert({
                user_id: user.id,
                email: body.email,
                notes: body.notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating contact email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
