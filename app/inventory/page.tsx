'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { InventoryV2, InventoryV2Status } from '@/types';
import { STATUS_V2_LABELS, STATUS_V2_COLORS, INVENTORY_STATUSES } from '@/types';

export default function InventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState<InventoryV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<InventoryV2Status | 'all'>('all');

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const url = statusFilter === 'all'
                ? '/api/inventory'
                : `/api/inventory?status=${statusFilter}`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.data) {
                setInventory(json.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    return (
        <>
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
                    <Link
                        href="/inventory/new"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + 新規登録
                    </Link>
                </div>

                {/* Status Filter */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${statusFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            すべて
                        </button>
                        {INVENTORY_STATUSES.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${statusFilter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {STATUS_V2_LABELS[status]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">読み込み中...</div>
                    ) : inventory.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            在庫がありません
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            在庫コード
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            機種
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            容量
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            カラー
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            ステータス
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                                            仕入価格
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            注文日
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {inventory.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => router.push(`/inventory/${item.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.inventory_code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.model_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.storage || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.color || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${STATUS_V2_COLORS[item.status]}`}>
                                                    {STATUS_V2_LABELS[item.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {item.purchase_price ? `¥${item.purchase_price.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.order_date || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
