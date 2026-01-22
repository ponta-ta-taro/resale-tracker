import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createServerSupabaseClient();

        // Parse query parameters for period selection
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('start_date');
        const endDateParam = searchParams.get('end_date');

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

        // Determine period for metrics calculation
        let periodStart: Date;
        let periodEnd: Date;

        if (startDateParam && endDateParam) {
            // Custom period
            periodStart = new Date(startDateParam);
            periodEnd = new Date(endDateParam);
        } else {
            // Default to current month
            periodStart = new Date(currentYear, currentMonth, 1);
            periodEnd = new Date(currentYear, currentMonth + 1, 0);
        }

        // Calculate period metrics (based on selected period)
        const periodPaid = inventory?.filter(item => {
            if (item.status !== 'paid' || !item.paid_at) return false;
            const paidDate = new Date(item.paid_at);
            return paidDate >= periodStart && paidDate <= periodEnd;
        }) || [];

        const periodRevenue = periodPaid.reduce((sum, item) => sum + (item.actual_price || 0), 0);
        const periodProfit = periodPaid.reduce((sum, item) =>
            sum + ((item.actual_price || 0) - (item.purchase_price || 0)), 0
        );
        const periodPurchaseTotal = periodPaid.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
        const periodProfitRate = periodPurchaseTotal > 0 ? (periodProfit / periodPurchaseTotal) * 100 : 0;
        const periodSalesCount = periodPaid.length;

        // Get period shipments for shipping cost
        const { data: periodShipments } = await supabase
            .from('shipments')
            .select('shipping_cost')
            .gte('shipped_at', periodStart.toISOString().split('T')[0])
            .lte('shipped_at', periodEnd.toISOString().split('T')[0]);

        const periodShippingCost = (periodShipments || []).reduce((sum, s) => sum + (s.shipping_cost || 0), 0);
        const periodNetProfit = periodProfit - periodShippingCost;

        // Calculate cumulative metrics (all-time)
        const allPaid = inventory?.filter(item => item.status === 'paid') || [];
        const cumulativeRevenue = allPaid.reduce((sum, item) => sum + (item.actual_price || 0), 0);
        const cumulativeProfit = allPaid.reduce((sum, item) =>
            sum + ((item.actual_price || 0) - (item.purchase_price || 0)), 0
        );
        const cumulativeSalesCount = allPaid.length;
        const cumulativePurchaseTotal = allPaid.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
        const cumulativeProfitRate = cumulativePurchaseTotal > 0 ? (cumulativeProfit / cumulativePurchaseTotal) * 100 : 0;

        // Get all shipments for cumulative shipping cost
        const { data: allShipments } = await supabase
            .from('shipments')
            .select('shipping_cost');

        const cumulativeShippingCost = (allShipments || []).reduce((sum, s) => sum + (s.shipping_cost || 0), 0);
        const cumulativeNetProfit = cumulativeProfit - cumulativeShippingCost;

        // Get period rewards
        const { data: rewards } = await supabase
            .from('rewards')
            .select('type, amount, points, point_rate')
            .gte('earned_at', periodStart.toISOString().split('T')[0])
            .lte('earned_at', periodEnd.toISOString().split('T')[0]);

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

        // Group price drop alerts by model/storage
        const priceDropGroups = new Map<string, {
            model: string;
            storage: string;
            drop: number;
            expectedPrice: number;
            currentPrice: number;
            orderDate: string | null;
            affectedOrders: Array<{ id: string; code: string }>;
        }>();

        // Target statuses for price drop alerts (exclude paid and buyer_completed)
        const targetStatuses = ['ordered', 'processing', 'preparing_shipment', 'shipped', 'delivered', 'sent_to_buyer'];

        inventory?.forEach(item => {
            const key = `${item.model_name?.trim()}_${item.storage?.trim()}`;
            const currentPrice = marketPrices.get(key);

            // Price drop alerts - only for target statuses
            if (targetStatuses.includes(item.status) && item.expected_price && currentPrice && currentPrice < item.expected_price) {
                if (!priceDropGroups.has(key)) {
                    priceDropGroups.set(key, {
                        model: item.model_name?.trim() || '',
                        storage: item.storage?.trim() || '',
                        drop: item.expected_price - currentPrice,
                        expectedPrice: item.expected_price,
                        currentPrice,
                        orderDate: item.order_date,
                        affectedOrders: [],
                    });
                }

                const group = priceDropGroups.get(key)!;
                group.affectedOrders.push({
                    id: item.id,
                    code: item.inventory_code || item.id,
                });

                // Update to earliest order date
                if (item.order_date && (!group.orderDate || item.order_date < group.orderDate)) {
                    group.orderDate = item.order_date;
                }
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

        // Convert price drop groups to array with calculated days
        priceDropGroups.forEach((group) => {
            const daysSinceOrder = group.orderDate
                ? Math.floor((now.getTime() - new Date(group.orderDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            priceDropAlerts.push({
                model: group.model,
                storage: group.storage,
                drop: group.drop,
                expectedPrice: group.expectedPrice,
                currentPrice: group.currentPrice,
                orderDate: group.orderDate,
                daysSinceOrder,
                affectedOrders: group.affectedOrders,
            });
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
                revenue: periodRevenue,
                profit: periodProfit,
                profitRate: periodProfitRate,
                salesCount: periodSalesCount,
                shippingCost: periodShippingCost,
                netProfit: periodNetProfit,
            },
            cumulative: {
                revenue: cumulativeRevenue,
                profit: cumulativeProfit,
                profitRate: cumulativeProfitRate,
                shippingCost: cumulativeShippingCost,
                netProfit: cumulativeNetProfit,
                salesCount: cumulativeSalesCount,
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
