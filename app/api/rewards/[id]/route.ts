import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;

        const { data: reward, error } = await supabase
            .from('rewards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!reward) {
            return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
        }

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error in GET /api/rewards/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;
        const body = await request.json();

        const { data: reward, error } = await supabase
            .from('rewards')
            .update({
                ...body,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error in PUT /api/rewards/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;

        const { error } = await supabase
            .from('rewards')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting reward:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/rewards/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
