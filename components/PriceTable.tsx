'use client'

import { useEffect, useState } from 'react'
import { PriceHistory } from '@/types'

interface PriceTableProps {
    data?: PriceHistory[]
}

export default function PriceTable({ data: initialData }: PriceTableProps) {
    const [data, setData] = useState<PriceHistory[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)
    const [sortBy, setSortBy] = useState<'model' | 'price'>('model')
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

    const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'model') {
            const comparison = a.model_name.localeCompare(b.model_name)
            return sortOrder === 'asc' ? comparison : -comparison
        } else {
            const comparison = a.price - b.price
            return sortOrder === 'asc' ? comparison : -comparison
        }
    })

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

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                全{data.length}件
            </div>
        </div>
    )
}
