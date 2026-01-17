import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month'); // Format: YYYY-MM

        let query = supabase
            .from('rewards')
            .select('*')
            .order('earned_at', { ascending: false });

        // Filter by month if provided
        if (month) {
            const [year, monthNum] = month.split('-');
            const firstDay = `${year}-${monthNum}-01`;
            const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            const lastDayStr = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

            query = query
                .gte('earned_at', firstDay)
                .lte('earned_at', lastDayStr);
        }

        const { data: rewards, error } = await query;

        if (error) {
            console.error('Error fetching rewards:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(rewards || []);
    } catch (error) {
        console.error('Error in GET /api/rewards:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Insert reward
        const { data: reward, error: rewardError } = await supabase
            .from('rewards')
            .insert({
                ...body,
                user_id: user.id,
            })
            .select()
            .single();

        if (rewardError) {
            console.error('Error creating reward:', rewardError);
            return NextResponse.json({ error: rewardError.message }, { status: 500 });
        }

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error in POST /api/rewards:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
