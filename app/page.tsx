import PriceChart from '@/components/PriceChart'
import PriceTable from '@/components/PriceTable'
import InventorySummaryCard from '@/components/InventorySummaryCard'
import Link from 'next/link'

async function getInventorySummary() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inventory/summary`, {
            cache: 'no-store',
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        return null;
    }
}

export default async function Home() {
    const inventorySummary = await getInventorySummary();

    return (
        <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        ResaleTracker
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        iPhone買取価格の推移を追跡
                    </p>
                </div>

                {/* Inventory Summary Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">在庫サマリー</h2>
                        <Link
                            href="/inventory"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            在庫管理へ
                        </Link>
                    </div>
                    {inventorySummary ? (
                        <InventorySummaryCard summary={inventorySummary} />
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500 dark:text-gray-400">
                            在庫データを読み込めませんでした
                        </div>
                    )}
                </div>

                <div className="mb-8">
                    <PriceChart />
                </div>

                <div>
                    <PriceTable />
                </div>
            </div>
        </main>
    )
}
