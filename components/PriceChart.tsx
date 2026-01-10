'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PriceHistory } from '@/types'

interface PriceChartProps {
    data?: PriceHistory[]
    modelName?: string
}

export default function PriceChart({ data: initialData, modelName }: PriceChartProps) {
    const [data, setData] = useState<PriceHistory[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)
    const [selectedModels, setSelectedModels] = useState<string[]>([])

    useEffect(() => {
        if (!initialData) {
            fetchPrices()
        }
    }, [initialData])

    const fetchPrices = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/prices')
            const result = await response.json()

            if (result.data) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error)
        } finally {
            setLoading(false)
        }
    }

    // カスタムソート関数
    const sortModels = (models: string[]) => {
        const seriesOrder = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17']
        const storageOrder = ['256GB', '512GB', '1TB', '2TB']

        return models.sort((a, b) => {
            // モデル名と容量を分離
            const [modelA, storageA] = a.split(' ').reduce((acc, part) => {
                if (part.match(/^\d+[GT]B$/)) {
                    acc[1] = part
                } else {
                    acc[0] += (acc[0] ? ' ' : '') + part
                }
                return acc
            }, ['', ''])

            const [modelB, storageB] = b.split(' ').reduce((acc, part) => {
                if (part.match(/^\d+[GT]B$/)) {
                    acc[1] = part
                } else {
                    acc[0] += (acc[0] ? ' ' : '') + part
                }
                return acc
            }, ['', ''])

            // シリーズ順で比較
            const seriesIndexA = seriesOrder.indexOf(modelA)
            const seriesIndexB = seriesOrder.indexOf(modelB)

            if (seriesIndexA !== seriesIndexB) {
                return seriesIndexA - seriesIndexB
            }

            // 同じシリーズなら容量順で比較
            const storageIndexA = storageOrder.indexOf(storageA)
            const storageIndexB = storageOrder.indexOf(storageB)

            return storageIndexA - storageIndexB
        })
    }

    // 機種+容量の一覧を取得してソート
    const models = sortModels(Array.from(new Set(data.map(item => `${item.model_name} ${item.storage}`))))

    // 初期選択（最初の3機種）
    useEffect(() => {
        if (models.length > 0 && selectedModels.length === 0) {
            setSelectedModels(models.slice(0, 3))
        }
    }, [models])

    // グラフ用データを整形
    const chartData = data
        .filter(item => selectedModels.includes(`${item.model_name} ${item.storage}`))
        .reduce((acc, item) => {
            const date = new Date(item.captured_at).toLocaleDateString('ja-JP')
            const modelKey = `${item.model_name} ${item.storage}`

            const existing = acc.find(d => d.date === date)
            if (existing) {
                existing[modelKey] = item.price
            } else {
                acc.push({
                    date,
                    [modelKey]: item.price
                })
            }

            return acc
        }, [] as any[])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7', '#14b8a6', '#f43f5e']

    const handleClearSelection = () => {
        setSelectedModels([])
    }

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4">価格推移グラフ</h3>
                <div className="text-center py-8 text-gray-500">読み込み中...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4">価格推移グラフ</h3>
                <div className="text-center py-8 text-gray-500">データがありません</div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">
                {modelName || '価格推移グラフ'}
            </h3>

            {/* 機種選択 */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        表示する機種を選択
                    </label>
                    <button
                        onClick={handleClearSelection}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        選択をクリア
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {models.map(model => (
                        <button
                            key={model}
                            onClick={() => {
                                if (selectedModels.includes(model)) {
                                    setSelectedModels(selectedModels.filter(m => m !== model))
                                } else {
                                    setSelectedModels([...selectedModels, model])
                                }
                            }}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${selectedModels.includes(model)
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {model}
                        </button>
                    ))}
                </div>
            </div>

            {/* グラフ */}
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(value: number) => `¥${value.toLocaleString()}`}
                        labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    {selectedModels.map((model, index) => (
                        <Line
                            key={model}
                            type="monotone"
                            dataKey={model}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
