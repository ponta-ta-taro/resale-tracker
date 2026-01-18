import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: 単一のApple IDを取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('apple_accounts')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching apple account:', error);
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Apple IDを更新
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // 認証ユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const body = await request.json();

        // バリデーション
        if (!body.name || !body.email) {
            return NextResponse.json(
                { error: '名前とメールアドレスは必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('apple_accounts')
            .update({
                name: body.name,
                email: body.email,
                notes: body.notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating apple account:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Apple IDを削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // 認証ユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { error } = await supabase
            .from('apple_accounts')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting apple account:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
