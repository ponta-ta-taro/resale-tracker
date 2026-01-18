import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const emailType = searchParams.get('email_type');

        console.log('📧 GET /api/emails - Params:', { startDate, endDate, emailType });

        let query = supabase
            .from('email_logs')
            .select('*')
            .order('received_at', { ascending: false });

        // Filter by date range if provided
        // Convert date to timestamp format for proper comparison
        if (startDate) {
            const startTimestamp = `${startDate}T00:00:00`;
            query = query.gte('received_at', startTimestamp);
            console.log('  Filter: received_at >=', startTimestamp);
        }
        if (endDate) {
            const endTimestamp = `${endDate}T23:59:59`;
            query = query.lte('received_at', endTimestamp);
            console.log('  Filter: received_at <=', endTimestamp);
        }

        // Filter by email type if provided
        if (emailType && emailType !== 'all') {
            query = query.eq('email_type', emailType);
            console.log('  Filter: email_type =', emailType);
        }

        const { data: emails, error } = await query;

        if (error) {
            console.error('❌ Error fetching email logs:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`✅ Found ${emails?.length || 0} email logs`);
        return NextResponse.json(emails || []);
    } catch (error) {
        console.error('❌ Error in GET /api/emails:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
