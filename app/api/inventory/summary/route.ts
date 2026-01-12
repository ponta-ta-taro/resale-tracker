import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { calculateProfit, Inventory } from '@/types';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all inventory items (RLS will filter to user's data)
        const { data: inventory, error } = await supabase
            .from('inventory')
            .select('*');

        if (error) {
            console.error('Error fetching inventory:', error);
            return NextResponse.json(
                { error: 'Failed to fetch inventory summary' },
                { status: 500 }
            );
        }

        const items = (inventory || []) as Inventory[];

        // Calculate summary statistics
        const summary = {
            total: items.length,
            byStatus: {
                ordered: items.filter((i: Inventory) => i.status === 'ordered').length,
                arrived: items.filter((i: Inventory) => i.status === 'arrived').length,
                selling: items.filter((i: Inventory) => i.status === 'selling').length,
                sold: items.filter((i: Inventory) => i.status === 'sold').length,
                paid: items.filter((i: Inventory) => i.status === 'paid').length,
            },
            totalInvestment: items.reduce((sum: number, item: Inventory) =>
                sum + (item.purchase_price || 0), 0
            ),
            totalRevenue: items
                .filter((i: Inventory) => i.status === 'sold' || i.status === 'paid')
                .reduce((sum: number, item: Inventory) => sum + (item.actual_price || 0), 0),
            totalProfit: items
                .filter((i: Inventory) => i.status === 'sold' || i.status === 'paid')
                .reduce((sum: number, item: Inventory) => {
                    const profit = calculateProfit(item.purchase_price, item.actual_price);
                    return sum + (profit || 0);
                }, 0),
            expectedRevenue: items
                .filter((i: Inventory) => i.status !== 'sold' && i.status !== 'paid')
                .reduce((sum: number, item: Inventory) => sum + (item.expected_price || 0), 0),
        };

        return NextResponse.json(summary);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
