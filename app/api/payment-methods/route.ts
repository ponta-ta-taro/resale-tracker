import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PaymentMethodInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET: 支払い方法一覧を取得
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching payment methods:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: 新しい支払い方法を作成
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 認証ユーザーを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const body: PaymentMethodInput = await request.json();

        // バリデーション
        if (!body.name || !body.type) {
            return NextResponse.json(
                { error: '名前と種別は必須です' },
                { status: 400 }
            );
        }

        // クレジットカードの場合、締め日と支払日は必須
        if (body.type === 'credit') {
            if (!body.closing_day || !body.payment_day) {
                return NextResponse.json(
                    { error: 'クレジットカードの場合、締め日と支払日は必須です' },
                    { status: 400 }
                );
            }
        }

        // 重複チェック（名前で判定）
        const { data: existingPayment } = await supabase
            .from('payment_methods')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', body.name)
            .maybeSingle();

        if (existingPayment) {
            return NextResponse.json(
                { error: 'この名前の支払い方法は既に登録されています' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .insert({
                name: body.name,
                type: body.type,
                closing_day: body.type === 'cash' ? null : body.closing_day,
                payment_day: body.type === 'cash' ? null : body.payment_day,
                payment_month_offset: body.type === 'cash' ? null : (body.payment_month_offset ?? 1),
                credit_limit: body.type === 'cash' ? null : body.credit_limit,
                is_active: body.is_active ?? true,
                notes: body.notes,
                user_id: user.id,  // ← RLS対策で追加
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment method:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
