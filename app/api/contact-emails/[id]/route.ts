import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: 単一の連絡先メールを取得
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('contact_emails')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching contact email:', error);
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: 連絡先メールを更新
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Check for duplicate email (excluding current record)
        const { data: existing } = await supabase
            .from('contact_emails')
            .select('id')
            .eq('user_id', user.id)
            .eq('email', body.email)
            .neq('id', params.id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('contact_emails')
            .update({
                email: body.email,
                notes: body.notes || null,
            })
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating contact email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 連絡先メールを削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('contact_emails')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting contact email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
