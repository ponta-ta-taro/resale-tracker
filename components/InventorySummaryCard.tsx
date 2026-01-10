'use client';

interface SummaryData {
    total: number;
    byStatus: {
        ordered: number;
        arrived: number;
        selling: number;
        sold: number;
        paid: number;
    };
    totalInvestment: number;
    totalRevenue: number;
    totalProfit: number;
    expectedRevenue: number;
}

interface InventorySummaryCardProps {
    summary: SummaryData;
}

export default function InventorySummaryCard({ summary }: InventorySummaryCardProps) {
    const formatCurrency = (amount: number) => {
        return `¥${amount.toLocaleString()}`;
    };

    const profitRate = summary.totalInvestment > 0
        ? ((summary.totalProfit / summary.totalInvestment) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Items */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">総在庫数</h3>
                <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">発注済み:</span>
                        <span className="font-medium">{summary.byStatus.ordered}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">納品済み:</span>
                        <span className="font-medium">{summary.byStatus.arrived}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">販売中:</span>
                        <span className="font-medium">{summary.byStatus.selling}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">売却済み:</span>
                        <span className="font-medium">{summary.byStatus.sold}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">入金済み:</span>
                        <span className="font-medium">{summary.byStatus.paid}</span>
                    </div>
                </div>
            </div>

            {/* Investment */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">総投資額</h3>
                <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(summary.totalInvestment)}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                    仕入れ価格の合計
                </p>
            </div>

            {/* Revenue & Profit */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">売上・利益</h3>
                <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary.totalRevenue)}
                </p>
                <div className="mt-2">
                    <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(summary.totalProfit)}
                    </p>
                    <p className="text-sm text-gray-600">
                        利益率: {profitRate}%
                    </p>
                </div>
            </div>

            {/* Expected Revenue */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-2">予想売上</h3>
                <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(summary.expectedRevenue)}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                    未売却在庫の予想価格
                </p>
            </div>
        </div>
    );
}
