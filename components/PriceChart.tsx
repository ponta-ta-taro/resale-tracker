'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PriceHistory } from '@/types'

const VENDOR_COLORS = {
    mobile_mix: '#3b82f6',  // 青
    iosys: '#10b981',       // 緑
    netoff: '#f59e0b',      // オレンジ
    janpara: '#8b5cf6'      // 紫
}

const VENDOR_NAMES = {
    mobile_mix: 'モバイルミックス',
    iosys: 'イオシス',
    netoff: 'ネットオフ',
    janpara: 'じゃんぱら'
}

export default function PriceChart() {
    const [data, setData] = useState<PriceHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedModelStorage, setSelectedModelStorage] = useState<string>('')
    const [yAxisMode, setYAxisMode] = useState<'full' | 'auto' | 'custom'>('auto')
    const [customMin, setCustomMin] = useState<string>('0')
    const [customMax, setCustomMax] = useState<string>('350000')

    useEffect(() => {
        fetchPrices()
    }, [])

    const fetchPrices = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/prices')
            const result = await response.json()

            if (result.data) {
                // mineoを除外
                const filteredData = result.data.filter((item: PriceHistory) => item.source !== 'mineo')
                setData(filteredData)
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error)
        } finally {
            setLoading(false)
        }
    }

    // カスタムソート関数
    const sortModelStorage = (a: string, b: string): number => {
        // 海外版かどうかを判定
        const isOverseasA = a.includes('海外版')
        const isOverseasB = b.includes('海外版')

        // 国内版 → 海外版の順
        if (isOverseasA !== isOverseasB) {
            return isOverseasA ? 1 : -1
        }

        // モデル順序: 無印 → Pro → Pro Max
        const getModelOrder = (str: string): number => {
            if (str.includes('Pro Max')) return 3
            if (str.includes('Pro')) return 2
            return 1 // 無印
        }

        const modelOrderA = getModelOrder(a)
        const modelOrderB = getModelOrder(b)

        if (modelOrderA !== modelOrderB) {
            return modelOrderA - modelOrderB
        }

        // 容量順序: 256GB → 512GB → 1TB → 2TB
        const getStorageOrder = (str: string): number => {
            if (str.includes('2TB')) return 4
            if (str.includes('1TB')) return 3
            if (str.includes('512GB')) return 2
            if (str.includes('256GB')) return 1
            return 0
        }

        const storageOrderA = getStorageOrder(a)
        const storageOrderB = getStorageOrder(b)

        return storageOrderA - storageOrderB
    }

    // 機種×容量の一覧を取得（iPhone 17シリーズのみ、カスタムソート適用）
    const modelStorageOptions = Array.from(
        new Set(data.map(item => `${item.model_name} ${item.storage}`))
    ).sort(sortModelStorage)

    // 初期選択
    useEffect(() => {
        if (modelStorageOptions.length > 0 && !selectedModelStorage) {
            setSelectedModelStorage(modelStorageOptions[0])
        }
    }, [modelStorageOptions.length, selectedModelStorage])

    // 選択された機種×容量のデータをフィルタ
    const filteredData = selectedModelStorage
        ? data.filter(item => `${item.model_name} ${item.storage}` === selectedModelStorage)
        : []

    // グラフ用データを整形（日付ごとに各業者の価格を集約）
    const chartData = filteredData.reduce((acc, item) => {
        const date = new Date(item.captured_at).toLocaleDateString('ja-JP')

        const existing = acc.find(d => d.date === date)
        if (existing) {
            existing[item.source] = item.price
        } else {
            acc.push({
                date,
                [item.source]: item.price
            })
        }

        return acc
    }, [] as any[])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Y軸の範囲を計算
    const calculateYAxisDomain = (): [number, number] => {
        if (yAxisMode === 'full') {
            return [0, 350000]
        }

        if (yAxisMode === 'custom') {
            return [parseInt(customMin) || 0, parseInt(customMax) || 350000]
        }

        // auto: データから最小値・最大値を計算
        if (chartData.length === 0) {
            return [0, 350000]
        }

        let min = Infinity
        let max = -Infinity

        chartData.forEach(dataPoint => {
            Object.keys(VENDOR_COLORS).forEach(vendor => {
                const value = dataPoint[vendor]
                if (value !== undefined && value !== null) {
                    min = Math.min(min, value)
                    max = Math.max(max, value)
                }
            })
        })

        if (min === Infinity || max === -Infinity) {
            return [0, 350000]
        }

        return [Math.max(0, min - 5000), max + 5000]
    }

    const yAxisDomain = calculateYAxisDomain()

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
                価格推移グラフ（4社比較）
            </h3>

            {/* 機種×容量選択 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    機種・容量を選択
                </label>
                <select
                    value={selectedModelStorage}
                    onChange={(e) => setSelectedModelStorage(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                    {modelStorageOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>

            {/* Y軸レンジ選択 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Y軸レンジ
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={() => setYAxisMode('auto')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${yAxisMode === 'auto'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        自動調整
                    </button>
                    <button
                        onClick={() => setYAxisMode('full')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${yAxisMode === 'full'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        全体表示
                    </button>
                    <button
                        onClick={() => setYAxisMode('custom')}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${yAxisMode === 'custom'
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        カスタム
                    </button>

                    {yAxisMode === 'custom' && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="number"
                                value={customMin}
                                onChange={(e) => setCustomMin(e.target.value)}
                                placeholder="最小値"
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                            />
                            <span className="text-sm text-gray-500">〜</span>
                            <input
                                type="number"
                                value={customMax}
                                onChange={(e) => setCustomMax(e.target.value)}
                                placeholder="最大値"
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* データ状態の警告メッセージ */}
            {chartData.length === 1 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        ℹ️ データが1日分のみです。複数日のデータが蓄積されると価格推移が表示されます。
                    </p>
                </div>
            )}

            {chartData.length === 0 && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-600">
                        選択された機種のデータがありません。
                    </p>
                </div>
            )}

            {/* グラフ */}
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        domain={yAxisDomain}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(value: number) => `¥${value.toLocaleString()}`}
                        labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    {Object.entries(VENDOR_COLORS).map(([vendor, color]) => (
                        <Line
                            key={vendor}
                            type="monotone"
                            dataKey={vendor}
                            name={VENDOR_NAMES[vendor as keyof typeof VENDOR_NAMES]}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 6 }}
                            activeDot={{ r: 8 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
