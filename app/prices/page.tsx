'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { PriceHistory } from '@/types'

const VENDORS = {
    mobile_mix: 'モバイルミックス',
    iosys: 'イオシス',
    netoff: 'ネットオフ',
    janpara: 'じゃんぱら'
}

const MODELS = ['iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max']
const STORAGES = ['256GB', '512GB', '1TB', '2TB']

export default function PricesPage() {
    const [data, setData] = useState<PriceHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState<string>('all')
    const [selectedStorage, setSelectedStorage] = useState<string>('all')

    useEffect(() => {
        fetchPrices()
    }, [])

    const fetchPrices = async () => {
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

    // フィルタリング
    const filteredData = data.filter(item => {
        const modelMatch = selectedModel === 'all' || item.model_name === selectedModel
        const storageMatch = selectedStorage === 'all' || item.storage === selectedStorage
        return modelMatch && storageMatch
    })

    // 機種×容量でグループ化
    const groupedData = filteredData.reduce((acc, item) => {
        const key = `${item.model_name}_${item.storage}`
        if (!acc[key]) {
            acc[key] = {
                model_name: item.model_name,
                storage: item.storage,
                vendors: {}
            }
        }
        acc[key].vendors[item.source] = item
        return acc
    }, {} as Record<string, { model_name: string; storage: string; vendors: Record<string, PriceHistory> }>)

    const groups = Object.values(groupedData).sort((a, b) => {
        // モデル順
        const modelOrder = MODELS.indexOf(a.model_name) - MODELS.indexOf(b.model_name)
        if (modelOrder !== 0) return modelOrder
        // 容量順
        return STORAGES.indexOf(a.storage) - STORAGES.indexOf(b.storage)
    })

    if (loading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-gray-600">読み込み中...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        価格一覧
                    </h1>
                    <p className="text-gray-600">
                        iPhone 17シリーズの買取価格比較（4社）
                    </p>
                </div>

                {/* フィルタ */}
                <div className="mb-6 flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            機種
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                        >
                            <option value="all">全て</option>
                            {MODELS.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            容量
                        </label>
                        <select
                            value={selectedStorage}
                            onChange={(e) => setSelectedStorage(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
                        >
                            <option value="all">全て</option>
                            {STORAGES.map(storage => (
                                <option key={storage} value={storage}>{storage}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 価格比較テーブル */}
                {groups.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 shadow-md text-center text-gray-500">
                        データがありません
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map(group => {
                            const vendors = Object.entries(group.vendors)
                            const maxPrice = Math.max(...vendors.map(([_, v]) => v.price))

                            return (
                                <div key={`${group.model_name}_${group.storage}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {group.model_name} {group.storage}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        業者
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        買取価格
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        更新日時
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Object.entries(VENDORS).map(([key, name]) => {
                                                    const vendor = group.vendors[key]
                                                    const isHighest = vendor && vendor.price === maxPrice

                                                    return (
                                                        <tr key={key} className={isHighest ? 'bg-green-50' : ''}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {name}
                                                                {isHighest && (
                                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                        最高値
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                                                {vendor ? `${vendor.price.toLocaleString()}円` : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                                                {vendor ? new Date(vendor.captured_at).toLocaleDateString('ja-JP') : '-'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}
