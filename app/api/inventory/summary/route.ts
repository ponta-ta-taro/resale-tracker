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

        // Get current month's shipments for shipping cost
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: shipments } = await supabase
            .from('shipments')
            .select('shipping_cost')
            .gte('shipped_at', firstDayOfMonth.toISOString().split('T')[0])
            .lte('shipped_at', lastDayOfMonth.toISOString().split('T')[0]);

        const totalShippingCost = (shipments || []).reduce((sum, s) => sum + (s.shipping_cost || 0), 0);

        // Calculate summary statistics
        const totalInvestment = items.reduce((sum: number, item: Inventory) =>
            sum + (item.purchase_price || 0), 0
        );

        const totalRevenue = items
            .filter((i: Inventory) => i.status === 'sold' || i.status === 'paid')
            .reduce((sum: number, item: Inventory) => sum + (item.actual_price || 0), 0);

        const grossProfit = items
            .filter((i: Inventory) => i.status === 'sold' || i.status === 'paid')
            .reduce((sum: number, item: Inventory) => {
                const profit = calculateProfit(item.purchase_price, item.actual_price);
                return sum + (profit || 0);
            }, 0);

        const netProfit = grossProfit - totalShippingCost;

        const summary = {
            total: items.length,
            byStatus: {
                ordered: items.filter((i: Inventory) => i.status === 'ordered').length,
                arrived: items.filter((i: Inventory) => i.status === 'arrived').length,
                selling: items.filter((i: Inventory) => i.status === 'selling').length,
                sold: items.filter((i: Inventory) => i.status === 'sold').length,
                paid: items.filter((i: Inventory) => i.status === 'paid').length,
            },
            totalInvestment,
            totalRevenue,
            totalProfit: grossProfit,
            grossProfit,
            totalShippingCost,
            netProfit,
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
