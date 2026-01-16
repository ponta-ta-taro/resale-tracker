import Header from '@/components/Header'
import PriceTable from '@/components/PriceTable'

export default function PricesPage() {
    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        価格一覧
                    </h1>
                    <p className="text-gray-600">
                        全機種の最新買取価格
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        データ参照元:
                        <a
                            href="https://mobile-mix.jp/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                        >
                            モバイルミックス
                        </a>
                    </p>
                </div>

                <PriceTable />
            </div>
        </>
    )
}
