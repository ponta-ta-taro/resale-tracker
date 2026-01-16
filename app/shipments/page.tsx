'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface ShipmentWithCount {
    id: string;
    shipped_to: string;
    carrier: string;
    tracking_number: string | null;
    shipping_cost: number;
    shipped_at: string;
    notes: string | null;
    item_count: number;
}

export default function ShipmentsPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<ShipmentWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {
        try {
            const response = await fetch('/api/shipments');
            if (response.ok) {
                const data = await response.json();
                setShipments(data);
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('この発送を削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/shipments/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchShipments();
            }
        } catch (error) {
            console.error('Error deleting shipment:', error);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">発送管理</h1>
                    <Link
                        href="/shipments/new"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        新規発送
                    </Link>
                </div>

                {shipments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">発送データがありません</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        発送日
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        発送先
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        配送業者
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        追跡番号
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        送料
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        アイテム数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {shipments.map((shipment) => (
                                    <tr key={shipment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(shipment.shipped_at).toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {shipment.shipped_to}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {shipment.carrier}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {shipment.tracking_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ¥{shipment.shipping_cost.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {shipment.item_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Link
                                                href={`/shipments/${shipment.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(shipment.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
