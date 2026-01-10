import PriceTable from '@/components/PriceTable'

export default function PricesPage() {
    return (
        <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        価格一覧
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        全機種の最新買取価格
                    </p>
                </div>

                <PriceTable />
            </div>
        </main>
    )
}
