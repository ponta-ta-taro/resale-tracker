'use client'

import { useEffect, useState } from 'react'
import { PriceHistory } from '@/types'

interface PriceTableProps {
    data?: PriceHistory[]
}

// カスタムソート関数（PriceChartと同じ）
const sortModels = (data: PriceHistory[]) => {
    const seriesOrder = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17']
    const storageOrder = ['256GB', '512GB', '1TB', '2TB']

    return data.sort((a, b) => {
        // シリーズ順で比較
        const seriesIndexA = seriesOrder.indexOf(a.model_name)
        const seriesIndexB = seriesOrder.indexOf(b.model_name)

        if (seriesIndexA !== seriesIndexB) {
            return seriesIndexA - seriesIndexB
        }

        // 同じシリーズなら容量順で比較
        const storageIndexA = storageOrder.indexOf(a.storage)
        const storageIndexB = storageOrder.indexOf(b.storage)

        return storageIndexA - storageIndexB
    })
}

export default function PriceTable({ data: initialData }: PriceTableProps) {
    const [data, setData] = useState<PriceHistory[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)
    const [sortBy, setSortBy] = useState<'model' | 'price' | 'default'>('default')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    useEffect(() => {
        if (!initialData) {
            fetchLatestPrices()
        }
    }, [initialData])

    const fetchLatestPrices = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/prices/latest')
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

    const handleSort = (column: 'model' | 'price') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('asc')
        }
    }

    const sortedData = (() => {
        const dataCopy = [...data]

        if (sortBy === 'default') {
            // デフォルトソート（カスタム順）
            return sortModels(dataCopy)
        } else if (sortBy === 'model') {
            // 機種名でソート
            const sorted = dataCopy.sort((a, b) => {
                const comparison = a.model_name.localeCompare(b.model_name)
                return sortOrder === 'asc' ? comparison : -comparison
            })
            return sorted
        } else {
            // 価格でソート
            const sorted = dataCopy.sort((a, b) => {
                const comparison = a.price - b.price
                return sortOrder === 'asc' ? comparison : -comparison
            })
            return sorted
        }
    })()

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4">最新価格一覧</h3>
                <div className="text-center py-8 text-gray-500">読み込み中...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-4">最新価格一覧</h3>
                <div className="text-center py-8 text-gray-500">データがありません</div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4">最新価格一覧</h3>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => handleSort('model')}
                            >
                                機種名 {sortBy === 'model' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                容量
                            </th>
                            <th
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => handleSort('price')}
                            >
                                価格 {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                更新日時
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedData.map((item, index) => (
                            <tr key={`${item.model_name}-${item.storage}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.model_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {item.storage}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                                    {item.price.toLocaleString()}円
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                                    {new Date(item.captured_at).toLocaleDateString('ja-JP')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>全{data.length}件</span>
                <a 
                    href="https://mobile-mix.jp/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                >
                    <span>モバイルミックスで確認</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    )
}
