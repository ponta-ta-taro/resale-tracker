import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;

        const { data: email, error } = await supabase
            .from('email_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching email log:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Email log not found' }, { status: 404 });
        }

        return NextResponse.json(email);
    } catch (error) {
        console.error('Error in GET /api/emails/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
