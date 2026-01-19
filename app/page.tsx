'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import PriceChart from '@/components/PriceChart';
import PaymentSchedule from '@/components/PaymentSchedule';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface DashboardMetrics {
    monthly: {
        revenue: number;
        profit: number;
        profitRate: number;
        salesCount: number;
        shippingCost: number;
        netProfit: number;
    };
    inventory: {
        ordered: { count: number; amount: number };
        processing: { count: number; amount: number };
        preparing_shipment: { count: number; amount: number };
        shipped: { count: number; amount: number };
        delivered: { count: number; amount: number };
        sent_to_buyer: { count: number; amount: number };
        buyer_completed: { count: number; amount: number };
        paid: { count: number; amount: number };
        receipt_received: { count: number; amount: number };
    };
    financial: {
        unrecoveredInvestment: number;
        expectedProfitCurrent: number;
        expectedProfitAtOrder: number;
    };
    alerts: {
        priceDrops: Array<{ id: string; model: string; drop: number; expectedPrice: number; currentPrice: number }>;
        oldInventory: Array<{ id: string; model: string; days: number; arrivedAt: string }>;
        paymentDelays: Array<{ id: string; model: string; days: number; soldAt: string }>;
    };
    rewards: {
        giftCardTotal: number;
        creditPointsTotal: number;
        creditPointsValue: number;
        total: number;
    };
    monthlyTrend: Array<{ month: string; profit: number }>;
}

export default function Dashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/dashboard');
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `¥${amount.toLocaleString()}`;
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen p-8 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center text-gray-600">読み込み中...</div>
                    </div>
                </main>
            </>
        );
    }

    if (!metrics) {
        return (
            <>
                <Header />
                <main className="min-h-screen p-8 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center text-gray-600">データを読み込めませんでした</div>
                    </div>
                </main>
            </>
        );
    }

    const hasAlerts = metrics.alerts.priceDrops.length > 0 ||
        metrics.alerts.oldInventory.length > 0 ||
        metrics.alerts.paymentDelays.length > 0;

    return (
        <>
            <Header />
            <main className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            ダッシュボード
                        </h1>
                        <p className="text-gray-600">
                            iPhone買取価格の推移を追跡
                        </p>
                    </div>

                    {/* Monthly Performance */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">今月の実績</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">今月の売上</h3>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.monthly.revenue)}</p>
                                <p className="text-sm text-gray-600 mt-1">入金済み売上の合計</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">粗利益</h3>
                                <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.monthly.profit)}</p>
                                <p className="text-sm text-gray-600 mt-1">売上 - 仕入価格</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">今月の送料</h3>
                                <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.monthly.shippingCost || 0)}</p>
                                <p className="text-sm text-gray-600 mt-1">発送にかかった費用</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">純利益</h3>
                                <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.monthly.netProfit || metrics.monthly.profit)}</p>
                                <p className="text-sm text-gray-600 mt-1">粗利益 - 送料</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">今月の利益率</h3>
                                <p className="text-3xl font-bold text-purple-600">{metrics.monthly.profitRate.toFixed(1)}%</p>
                                <p className="text-sm text-gray-600 mt-1">利益 ÷ 仕入額</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">今月の販売台数</h3>
                                <p className="text-3xl font-bold text-indigo-600">{metrics.monthly.salesCount}台</p>
                                <p className="text-sm text-gray-600 mt-1">入金済み件数</p>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Status */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">在庫状況</h2>
                            <Link
                                href="/inventory"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                                在庫管理へ
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">注文中</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(metrics.inventory.ordered.count + metrics.inventory.processing.count + metrics.inventory.preparing_shipment.count)}台
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(metrics.inventory.ordered.amount + metrics.inventory.processing.amount + metrics.inventory.preparing_shipment.amount)}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">出荷済み</h3>
                                <p className="text-2xl font-bold text-cyan-600">{metrics.inventory.shipped.count}台</p>
                                <p className="text-sm text-gray-600 mt-1">{formatCurrency(metrics.inventory.shipped.amount)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">配送済み</h3>
                                <p className="text-2xl font-bold text-purple-600">{metrics.inventory.delivered.count}台</p>
                                <p className="text-sm text-gray-600 mt-1">{formatCurrency(metrics.inventory.delivered.amount)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">買取手続き中</h3>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {(metrics.inventory.sent_to_buyer.count + metrics.inventory.buyer_completed.count)}台
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatCurrency(metrics.inventory.sent_to_buyer.amount + metrics.inventory.buyer_completed.amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Overview */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">資金状況</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">仕入れ総額（未回収）</h3>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.financial.unrecoveredInvestment)}</p>
                                <p className="text-sm text-gray-600 mt-1">入金待ち在庫の仕入価格</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">想定利益（現在相場）</h3>
                                <p className={`text-3xl font-bold ${metrics.financial.expectedProfitCurrent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(metrics.financial.expectedProfitCurrent)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">現在の相場で売却した場合</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">想定利益（注文時）</h3>
                                <p className={`text-3xl font-bold ${metrics.financial.expectedProfitAtOrder >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(metrics.financial.expectedProfitAtOrder)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">注文時の買取価格で売却した場合</p>
                            </div>
                        </div>
                    </div>

                    {/* Rewards Summary */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">ポイント・特典（今月）</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">ギフトカード還元</h3>
                                <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.rewards.giftCardTotal)}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">クレカポイント</h3>
                                <p className="text-3xl font-bold text-purple-600">{formatCurrency(metrics.rewards.creditPointsValue)}</p>
                                <p className="text-sm text-gray-600 mt-1">{metrics.rewards.creditPointsTotal.toLocaleString()}pt</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">合計</h3>
                                <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.rewards.total)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Schedule */}
                    <div className="mb-8">
                        <PaymentSchedule />
                    </div>

                    {/* Alerts */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">アラート</h2>
                        {!hasAlerts ? (
                            <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                                <p className="text-green-800 font-medium">✓ 問題なし</p>
                                <p className="text-sm text-green-600 mt-1">現在、注意が必要な項目はありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {metrics.alerts.priceDrops.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                                        <h3 className="text-lg font-semibold text-red-900 mb-3">⚠️ 相場下落中 ({metrics.alerts.priceDrops.length}件)</h3>
                                        <div className="space-y-2">
                                            {metrics.alerts.priceDrops.slice(0, 5).map(alert => (
                                                <div key={alert.id} className="flex justify-between items-center text-sm">
                                                    <Link href={`/inventory/${alert.id}`} className="text-red-700 hover:underline">
                                                        {alert.model}
                                                    </Link>
                                                    <span className="text-red-600 font-medium">↓ {formatCurrency(alert.drop)}</span>
                                                </div>
                                            ))}
                                            {metrics.alerts.priceDrops.length > 5 && (
                                                <p className="text-sm text-red-600 mt-2">他 {metrics.alerts.priceDrops.length - 5}件</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {metrics.alerts.oldInventory.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                                        <h3 className="text-lg font-semibold text-yellow-900 mb-3">⏰ 長期在庫 ({metrics.alerts.oldInventory.length}件)</h3>
                                        <div className="space-y-2">
                                            {metrics.alerts.oldInventory.slice(0, 5).map(alert => (
                                                <div key={alert.id} className="flex justify-between items-center text-sm">
                                                    <Link href={`/inventory/${alert.id}`} className="text-yellow-700 hover:underline">
                                                        {alert.model}
                                                    </Link>
                                                    <span className="text-yellow-600 font-medium">{alert.days}日経過</span>
                                                </div>
                                            ))}
                                            {metrics.alerts.oldInventory.length > 5 && (
                                                <p className="text-sm text-yellow-600 mt-2">他 {metrics.alerts.oldInventory.length - 5}件</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {metrics.alerts.paymentDelays.length > 0 && (
                                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                                        <h3 className="text-lg font-semibold text-orange-900 mb-3">💰 入金遅延 ({metrics.alerts.paymentDelays.length}件)</h3>
                                        <div className="space-y-2">
                                            {metrics.alerts.paymentDelays.slice(0, 5).map(alert => (
                                                <div key={alert.id} className="flex justify-between items-center text-sm">
                                                    <Link href={`/inventory/${alert.id}`} className="text-orange-700 hover:underline">
                                                        {alert.model}
                                                    </Link>
                                                    <span className="text-orange-600 font-medium">{alert.days}日経過</span>
                                                </div>
                                            ))}
                                            {metrics.alerts.paymentDelays.length > 5 && (
                                                <p className="text-sm text-orange-600 mt-2">他 {metrics.alerts.paymentDelays.length - 5}件</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Monthly Profit Trend */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">月別利益推移</h2>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={metrics.monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelStyle={{ color: '#000' }}
                                    />
                                    <Bar dataKey="profit" fill="#10b981" name="利益" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Price Chart */}
                    <div className="mb-8">
                        <PriceChart />
                    </div>
                </div>
            </main>
        </>
    );
}
