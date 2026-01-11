import Header from '@/components/Header'
import PriceTable from '@/components/PriceTable'

export default function PricesPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            価格一覧
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            全機種の最新買取価格
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            データ参照元: 
                            <a 
                                href="https://mobile-mix.jp/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline ml-1"
                            >
                                モバイルミックス
                            </a>
                        </p>
                    </div>

                    <PriceTable />
                </div>
            </main>
        </>
    )
}
