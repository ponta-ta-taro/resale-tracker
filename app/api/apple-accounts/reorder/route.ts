import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        // Update sort_order for each item
        const updates = ids.map((id: string, index: number) =>
            supabase
                .from('apple_accounts')
                .update({ sort_order: index })
                .eq('id', id)
                .eq('user_id', user.id)
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reordering apple accounts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
