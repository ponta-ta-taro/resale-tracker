'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { InventoryV2, InventoryV2Status, STATUS_V2_LABELS, STATUS_V2_COLORS } from '@/types';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryV2[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<InventoryV2[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<InventoryV2Status | 'all'>('all');
    const [sortColumn, setSortColumn] = useState<'inventory_code' | 'order_date' | 'purchase_price'>('inventory_code');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        filterAndSortInventory();
    }, [inventory, selectedStatus, sortColumn, sortDirection]);

    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/inventory');
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortInventory = () => {
        let filtered = [...inventory];

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(item => item.status === selectedStatus);
        }

        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortColumn) {
                case 'inventory_code':
                    comparison = a.inventory_code.localeCompare(b.inventory_code);
                    break;
                case 'order_date':
                    const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
                    const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                case 'purchase_price':
                    const priceA = a.purchase_price ?? 0;
                    const priceB = b.purchase_price ?? 0;
                    comparison = priceA - priceB;
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredInventory(filtered);
    };

    const handleSort = (column: typeof sortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-gray-600">読み込み中...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">在庫管理 V2</h1>
                    <Link
                        href="/inventory/new"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        新規登録
                    </Link>
                </div>

                {/* Status Filter */}
                <div className="mb-6 flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedStatus('all')}
                        className={`px-4 py-2 rounded-md ${selectedStatus === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        全て ({inventory.length})
                    </button>
                    {Object.entries(STATUS_V2_LABELS).map(([status, label]) => {
                        const count = inventory.filter(item => item.status === status).length;
                        return (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status as InventoryV2Status)}
                                className={`px-4 py-2 rounded-md ${selectedStatus === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {label} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('inventory_code')}
                                >
                                    在庫コード {sortColumn === 'inventory_code' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    機種
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    容量
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    カラー
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('purchase_price')}
                                >
                                    仕入価格 {sortColumn === 'purchase_price' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('order_date')}
                                >
                                    注文日 {sortColumn === 'order_date' && (sortDirection === 'asc' ? '▲' : '▼')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                        在庫データがありません
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.inventory_code}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.model_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.storage}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.color || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex items-center justify-center text-sm font-medium rounded-full ${STATUS_V2_COLORS[item.status]}`}>
                                                {STATUS_V2_LABELS[item.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(item.purchase_price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.order_date ? new Date(item.order_date).toLocaleDateString('ja-JP') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                href={`/inventory/${item.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                詳細
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
