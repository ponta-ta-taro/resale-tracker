import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || 'all';
        const emailType = searchParams.get('email_type') || 'all';
        const days = parseInt(searchParams.get('days') || '7', 10);

        // Build query
        let query = supabase
            .from('email_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('received_at', { ascending: false });

        // Apply status filter
        if (status !== 'all') {
            query = query.eq('status', status);
        }

        // Apply email_type filter
        if (emailType !== 'all') {
            query = query.eq('email_type', emailType);
        }

        // Apply date filter (past N days)
        if (days > 0 && days < 9999) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            query = query.gte('received_at', startDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching email logs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, count: data?.length || 0 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
