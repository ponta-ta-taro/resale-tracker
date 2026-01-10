interface PriceTableProps {
    data: any[];
}

export default function PriceTable({ data }: PriceTableProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">価格一覧</h3>
            <div className="text-gray-500 text-center py-8">
                Phase 4で実装予定
            </div>
        </div>
    )
}
