import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { AppleAccountInput } from '@/types';

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
        const body: AppleAccountInput = await request.json();

        if (!body.email) {
            return NextResponse.json(
                { error: 'メールアドレスは必須です' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('apple_accounts')
            .insert({
                email: body.email,
                name: body.name || null,
                phone_number: body.phone_number || null,
                is_active: body.is_active ?? true,
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
