import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PaymentScheduleItem {
    paymentMethodId: string;
    paymentMethodName: string;
    type: string;
    closingDay: number | null;
    paymentDay: number | null;
    paymentMonthOffset: number | null;
    creditLimit: number | null;
    // 今月締め分（来月支払い予定）
    currentMonthAmount: number;
    currentMonthCount: number;
    // 利用中の合計（未払い分）
    totalUsed: number;
    totalCount: number;
    // 次回支払日
    nextPaymentDate: string | null;
}

function getNextPaymentDate(closingDay: number, paymentDay: number, paymentMonthOffset: number): string {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let paymentMonth: number;
    let paymentYear: number;

    // 締め日を過ぎているかどうかで判定
    if (currentDay > closingDay) {
        // 締め日を過ぎている → 次回支払いは offset ヶ月後
        paymentMonth = currentMonth + paymentMonthOffset;
        paymentYear = currentYear;
    } else {
        // 締め日前 → 今月締め分の支払いは offset ヶ月後
        paymentMonth = currentMonth + paymentMonthOffset;
        paymentYear = currentYear;
    }

    // 月が12を超えた場合の処理
    while (paymentMonth > 11) {
        paymentMonth -= 12;
        paymentYear += 1;
    }

    const paymentDate = new Date(paymentYear, paymentMonth, paymentDay);
    return paymentDate.toISOString().split('T')[0];
}

function getClosingPeriod(closingDay: number): { start: Date; end: Date } {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let periodStart: Date;
    let periodEnd: Date;

    if (currentDay > closingDay) {
        // 今月の締め日を過ぎている → 今月締め日+1 から 来月締め日まで
        periodStart = new Date(currentYear, currentMonth, closingDay + 1);
        const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth + 1 > 11 ? currentYear + 1 : currentYear;
        periodEnd = new Date(nextYear, nextMonth, closingDay);
    } else {
        // まだ締め日前 → 先月締め日+1 から 今月締め日まで
        const prevMonth = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth - 1 < 0 ? currentYear - 1 : currentYear;
        periodStart = new Date(prevYear, prevMonth, closingDay + 1);
        periodEnd = new Date(currentYear, currentMonth, closingDay);
    }

    return { start: periodStart, end: periodEnd };
}

export async function GET() {
    try {
        const supabase = await createClient();

        // 支払い方法を取得
        const { data: paymentMethods, error: pmError } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (pmError) {
            console.error('Error fetching payment methods:', pmError);
            return NextResponse.json({ error: pmError.message }, { status: 500 });
        }

        // 在庫を取得（入金済み以外）
        const { data: inventory, error: invError } = await supabase
            .from('inventory')
            .select('*')
            .neq('status', 'paid');

        if (invError) {
            console.error('Error fetching inventory:', invError);
            return NextResponse.json({ error: invError.message }, { status: 500 });
        }

        // 各支払い方法ごとに集計
        const schedule: PaymentScheduleItem[] = [];

        for (const pm of paymentMethods || []) {
            // この支払い方法で購入した在庫を抽出（payment_method_idで外部キーマッチング）
            const pmInventory = inventory?.filter(inv => inv.payment_method_id === pm.id) || [];

            let currentMonthAmount = 0;
            let currentMonthCount = 0;
            let totalUsed = 0;
            let totalCount = pmInventory.length;

            // 合計を計算
            pmInventory.forEach(inv => {
                totalUsed += inv.purchase_price || 0;
            });

            // クレジットカードの場合、今月締め分を計算
            if (pm.type === 'credit' && pm.closing_day && pm.payment_day) {
                const { start, end } = getClosingPeriod(pm.closing_day);

                pmInventory.forEach(inv => {
                    if (inv.order_date) {
                        const orderDate = new Date(inv.order_date);
                        if (orderDate >= start && orderDate <= end) {
                            currentMonthAmount += inv.purchase_price || 0;
                            currentMonthCount++;
                        }
                    }
                });
            }

            const nextPaymentDate = pm.type === 'credit' && pm.closing_day && pm.payment_day && pm.payment_month_offset !== null
                ? getNextPaymentDate(pm.closing_day, pm.payment_day, pm.payment_month_offset)
                : null;

            schedule.push({
                paymentMethodId: pm.id,
                paymentMethodName: pm.name,
                type: pm.type,
                closingDay: pm.closing_day,
                paymentDay: pm.payment_day,
                paymentMonthOffset: pm.payment_month_offset,
                creditLimit: pm.credit_limit,
                currentMonthAmount,
                currentMonthCount,
                totalUsed,
                totalCount,
                nextPaymentDate,
            });
        }

        return NextResponse.json({ data: schedule });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
