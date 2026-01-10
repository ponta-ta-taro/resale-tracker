interface PriceChartProps {
    data: any[];
    modelName: string;
}

export default function PriceChart({ data, modelName }: PriceChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">{modelName} - 価格推移</h3>
            <div className="text-gray-500 text-center py-8">
                Phase 4で実装予定（Recharts使用）
            </div>
        </div>
    )
}
