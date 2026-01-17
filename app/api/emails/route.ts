import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const emailType = searchParams.get('email_type');

        let query = supabase
            .from('email_logs')
            .select('*')
            .order('received_at', { ascending: false });

        // Filter by date range if provided
        if (startDate) {
            query = query.gte('received_at', startDate);
        }
        if (endDate) {
            query = query.lte('received_at', endDate);
        }

        // Filter by email type if provided
        if (emailType && emailType !== 'all') {
            query = query.eq('email_type', emailType);
        }

        const { data: emails, error } = await query;

        if (error) {
            console.error('Error fetching email logs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(emails || []);
    } catch (error) {
        console.error('Error in GET /api/emails:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
