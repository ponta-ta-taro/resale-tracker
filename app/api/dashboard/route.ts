import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all inventory (RLS will filter to user's data)
        const { data: inventory, error: invError } = await supabase
            .from('inventory')
            .select('*');

        if (invError) {
            console.error('Error fetching inventory:', invError);
            return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
        }

        // Fetch latest market prices
        const { data: priceHistory, error: priceError } = await supabase
            .from('price_history')
            .select('*')
            .order('captured_at', { ascending: false });

        if (priceError) {
            console.error('Error fetching price history:', priceError);
        }

        // Create market price map
        const marketPrices = new Map<string, number>();
        priceHistory?.forEach(item => {
            const key = `${item.model_name}_${item.storage}`;
            if (!marketPrices.has(key)) {
                marketPrices.set(key, item.price);
            }
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate monthly metrics
        const thisMonthPaid = inventory?.filter(item => {
            if (item.status !== 'paid' || !item.paid_at) return false;
            const paidDate = new Date(item.paid_at);
            return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        }) || [];

        const monthlyRevenue = thisMonthPaid.reduce((sum, item) => sum + (item.actual_price || 0), 0);
        const monthlyProfit = thisMonthPaid.reduce((sum, item) =>
            sum + ((item.actual_price || 0) - (item.purchase_price || 0)), 0
        );
        const monthlyPurchaseTotal = thisMonthPaid.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
        const monthlyProfitRate = monthlyPurchaseTotal > 0 ? (monthlyProfit / monthlyPurchaseTotal) * 100 : 0;
        const monthlySalesCount = thisMonthPaid.length;

        // Get current month's shipments for shipping cost
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const { data: shipments } = await supabase
            .from('shipments')
            .select('shipping_cost')
            .gte('shipped_at', firstDayOfMonth.toISOString().split('T')[0])
            .lte('shipped_at', lastDayOfMonth.toISOString().split('T')[0]);

        const monthlyShippingCost = (shipments || []).reduce((sum, s) => sum + (s.shipping_cost || 0), 0);
        const monthlyNetProfit = monthlyProfit - monthlyShippingCost;

        // Get current month's rewards
        const { data: rewards } = await supabase
            .from('rewards')
            .select('type, amount, points, point_rate')
            .gte('earned_at', firstDayOfMonth.toISOString().split('T')[0])
            .lte('earned_at', lastDayOfMonth.toISOString().split('T')[0]);

        const giftCardTotal = rewards?.filter(r => r.type === 'gift_card')
            .reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

        const creditPointsTotal = rewards?.filter(r => r.type === 'credit_card_points')
            .reduce((sum, r) => sum + (r.points || 0), 0) || 0;

        const creditPointsValue = rewards?.filter(r => r.type === 'credit_card_points')
            .reduce((sum, r) => sum + ((r.points || 0) * (r.point_rate || 0)), 0) || 0;


        // Calculate inventory status
        const statusBreakdown = {
            ordered: { count: 0, amount: 0 },
            processing: { count: 0, amount: 0 },
            preparing_shipment: { count: 0, amount: 0 },
            shipped: { count: 0, amount: 0 },
            delivered: { count: 0, amount: 0 },
            sent_to_buyer: { count: 0, amount: 0 },
            buyer_completed: { count: 0, amount: 0 },
            paid: { count: 0, amount: 0 },
            receipt_received: { count: 0, amount: 0 },
        };

        inventory?.forEach(item => {
            if (item.status !== 'paid' && statusBreakdown[item.status as keyof typeof statusBreakdown]) {
                statusBreakdown[item.status as keyof typeof statusBreakdown].count++;
                statusBreakdown[item.status as keyof typeof statusBreakdown].amount += item.purchase_price || 0;
            }
        });

        // Calculate financial metrics
        const unpaidInventory = inventory?.filter(item => item.status !== 'paid') || [];
        const totalUnrecoveredInvestment = unpaidInventory.reduce((sum, item) => sum + (item.purchase_price || 0), 0);

        let expectedProfitCurrent = 0;
        let expectedProfitAtOrder = 0;

        unpaidInventory.forEach(item => {
            const key = `${item.model_name}_${item.storage}`;
            const currentPrice = marketPrices.get(key);

            if (currentPrice && item.purchase_price) {
                expectedProfitCurrent += currentPrice - item.purchase_price;
            }

            if (item.expected_price && item.purchase_price) {
                expectedProfitAtOrder += item.expected_price - item.purchase_price;
            }
        });

        // Calculate alerts
        const priceDropAlerts: any[] = [];
        const oldInventoryAlerts: any[] = [];
        const paymentDelayAlerts: any[] = [];

        inventory?.forEach(item => {
            const key = `${item.model_name}_${item.storage}`;
            const currentPrice = marketPrices.get(key);

            // Price drop alerts
            if (item.expected_price && currentPrice && currentPrice < item.expected_price) {
                priceDropAlerts.push({
                    id: item.id,
                    model: `${item.model_name} ${item.storage}`,
                    drop: item.expected_price - currentPrice,
                    expectedPrice: item.expected_price,
                    currentPrice,
                });
            }

            // Old inventory alerts (14+ days since arrival, not yet selling/sold/paid)
            if (item.arrived_at && !['selling', 'sold', 'paid'].includes(item.status)) {
                const arrivedDate = new Date(item.arrived_at);
                const daysSinceArrival = Math.floor((now.getTime() - arrivedDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceArrival >= 14) {
                    oldInventoryAlerts.push({
                        id: item.id,
                        model: `${item.model_name} ${item.storage}`,
                        days: daysSinceArrival,
                        arrivedAt: item.arrived_at,
                    });
                }
            }

            // Payment delay alerts (7+ days since sold, not yet paid)
            if (item.sold_at && item.status === 'sold') {
                const soldDate = new Date(item.sold_at);
                const daysSinceSold = Math.floor((now.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceSold >= 7) {
                    paymentDelayAlerts.push({
                        id: item.id,
                        model: `${item.model_name} ${item.storage}`,
                        days: daysSinceSold,
                        soldAt: item.sold_at,
                    });
                }
            }
        });

        // Calculate monthly profit trend (last 6 months)
        const monthlyTrend: { month: string; profit: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(currentYear, currentMonth - i, 1);
            const targetMonth = targetDate.getMonth();
            const targetYear = targetDate.getFullYear();

            const monthPaid = inventory?.filter(item => {
                if (item.status !== 'paid' || !item.paid_at) return false;
                const paidDate = new Date(item.paid_at);
                return paidDate.getMonth() === targetMonth && paidDate.getFullYear() === targetYear;
            }) || [];

            const profit = monthPaid.reduce((sum, item) =>
                sum + ((item.actual_price || 0) - (item.purchase_price || 0)), 0
            );

            monthlyTrend.push({
                month: `${targetYear}/${String(targetMonth + 1).padStart(2, '0')}`,
                profit,
            });
        }

        return NextResponse.json({
            monthly: {
                revenue: monthlyRevenue,
                profit: monthlyProfit,
                profitRate: monthlyProfitRate,
                salesCount: monthlySalesCount,
                shippingCost: monthlyShippingCost,
                netProfit: monthlyNetProfit,
            },
            inventory: statusBreakdown,
            financial: {
                unrecoveredInvestment: totalUnrecoveredInvestment,
                expectedProfitCurrent,
                expectedProfitAtOrder,
            },
            alerts: {
                priceDrops: priceDropAlerts,
                oldInventory: oldInventoryAlerts,
                paymentDelays: paymentDelayAlerts,
            },
            rewards: {
                giftCardTotal,
                creditPointsTotal,
                creditPointsValue: Math.round(creditPointsValue),
                total: giftCardTotal + Math.round(creditPointsValue),
            },
            monthlyTrend,
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
