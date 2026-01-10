import PriceChart from '@/components/PriceChart'
import PriceTable from '@/components/PriceTable'

export default function Home() {
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
