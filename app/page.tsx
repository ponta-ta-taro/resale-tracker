export default function Home() {
    return (
        <main className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">ResaleTracker</h1>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">価格推移グラフ</h2>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                        <p className="text-gray-500">グラフ表示エリア（Phase 4で実装予定）</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4">最新価格一覧</h2>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                        <p className="text-gray-500">価格テーブル表示エリア（Phase 4で実装予定）</p>
                    </div>
                </div>
            </div>
        </main>
    )
}
