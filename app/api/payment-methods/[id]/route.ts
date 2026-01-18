import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PaymentMethodInput } from '@/types';

export const dynamic = 'force-dynamic';

// GET: 特定の支払い方法を取得
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            console.error('Error fetching payment method:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: 支払い方法を更新
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body: Partial<PaymentMethodInput> = await request.json();

        // Get user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 重複チェック（名前で判定、自分以外）
        if (body.name) {
            const { data: existingPayment } = await supabase
                .from('payment_methods')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', body.name)
                .neq('id', id)
                .maybeSingle();

            if (existingPayment) {
                return NextResponse.json(
                    { error: 'この名前の支払い方法は既に登録されています' },
                    { status: 400 }
                );
            }
        }

        // 現金の場合は締め日・支払日をnullに
        const updateData: Record<string, unknown> = { ...body };
        if (body.type === 'cash') {
            updateData.closing_day = null;
            updateData.payment_day = null;
            updateData.payment_month_offset = null;
            updateData.credit_limit = null;
        }

        const { data, error } = await supabase
            .from('payment_methods')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            console.error('Error updating payment method:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: 支払い方法を削除
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting payment method:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
