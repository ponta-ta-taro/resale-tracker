import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // Format: YYYY-MM

        if (!month) {
            return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 });
        }

        const [year, monthNum] = month.split('-');
        const firstDay = `${year}-${monthNum}-01`;
        const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        const lastDayStr = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

        const { data: rewards, error } = await supabase
            .from('rewards')
            .select('type, amount, points, point_rate')
            .gte('earned_at', firstDay)
            .lte('earned_at', lastDayStr);

        if (error) {
            console.error('Error fetching rewards summary:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate totals
        const giftCardTotal = rewards
            ?.filter(r => r.type === 'gift_card')
            .reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

        const creditPointsTotal = rewards
            ?.filter(r => r.type === 'credit_card_points')
            .reduce((sum, r) => sum + (r.points || 0), 0) || 0;

        const creditPointsValue = rewards
            ?.filter(r => r.type === 'credit_card_points')
            .reduce((sum, r) => sum + ((r.points || 0) * (r.point_rate || 0)), 0) || 0;

        return NextResponse.json({
            gift_card_total: giftCardTotal,
            credit_points_total: creditPointsTotal,
            credit_points_value: Math.round(creditPointsValue),
            total: giftCardTotal + Math.round(creditPointsValue),
        });
    } catch (error) {
        console.error('Error in GET /api/rewards/summary:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
