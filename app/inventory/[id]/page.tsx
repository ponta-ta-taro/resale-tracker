'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InventoryForm from '@/components/InventoryForm';
import { Inventory, STATUS_LABELS, STATUS_COLORS, calculateProfit, calculateProfitRate } from '@/types';

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, [params.id]);

    const fetchInventory = async () => {
        try {
            const response = await fetch(`/api/inventory/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？')) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/inventory/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete inventory');

            router.push('/inventory');
            router.refresh();
        } catch (error) {
            console.error('Error deleting inventory:', error);
            alert('削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ja-JP');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600">読み込み中...</div>
            </div>
        );
    }

    if (!inventory) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-gray-600">在庫が見つかりません</div>
            </div>
        );
    }

    const profit = calculateProfit(inventory.purchase_price, inventory.actual_price);
    const profitRate = calculateProfitRate(inventory.purchase_price, inventory.actual_price);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">在庫詳細</h1>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {deleting ? '削除中...' : '削除'}
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">機種</h3>
                        <p className="text-lg font-semibold text-gray-900">{inventory.model_name}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">容量</h3>
                        <p className="text-lg font-semibold text-gray-900">{inventory.storage}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">ステータス</h3>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[inventory.status]}`}>
                            {STATUS_LABELS[inventory.status]}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">利益</h3>
                        <p className={`text-lg font-semibold ${profit !== null && profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit)}
                            {profitRate !== null && ` (${profitRate.toFixed(1)}%)`}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">カラー:</span>
                        <span className="ml-2 text-gray-900">{inventory.color || '-'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">IMEI:</span>
                        <span className="ml-2 text-gray-900">{inventory.imei || '-'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">仕入先:</span>
                        <span className="ml-2 text-gray-900">{inventory.purchase_source || '-'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">仕入価格:</span>
                        <span className="ml-2 text-gray-900">{formatCurrency(inventory.purchase_price)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">予想売価:</span>
                        <span className="ml-2 text-gray-900">{formatCurrency(inventory.expected_price)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">実売価格:</span>
                        <span className="ml-2 text-gray-900">{formatCurrency(inventory.actual_price)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">発注日:</span>
                        <span className="ml-2 text-gray-900">{formatDate(inventory.ordered_at)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">納品日:</span>
                        <span className="ml-2 text-gray-900">{formatDate(inventory.arrived_at)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">売却日:</span>
                        <span className="ml-2 text-gray-900">{formatDate(inventory.sold_at)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">入金日:</span>
                        <span className="ml-2 text-gray-900">{formatDate(inventory.paid_at)}</span>
                    </div>
                </div>

                {inventory.notes && (
                    <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">備考</h3>
                        <p className="text-gray-900 whitespace-pre-wrap">{inventory.notes}</p>
                    </div>
                )}
            </div>

            {/* Edit Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">編集</h2>
                <InventoryForm
                    mode="edit"
                    initialData={{
                        id: inventory.id,
                        model_name: inventory.model_name,
                        storage: inventory.storage,
                        color: inventory.color || undefined,
                        imei: inventory.imei || undefined,
                        status: inventory.status,
                        purchase_price: inventory.purchase_price || undefined,
                        expected_price: inventory.expected_price || undefined,
                        actual_price: inventory.actual_price || undefined,
                        purchase_source: inventory.purchase_source || undefined,
                        ordered_at: inventory.ordered_at || undefined,
                        arrived_at: inventory.arrived_at || undefined,
                        sold_at: inventory.sold_at || undefined,
                        paid_at: inventory.paid_at || undefined,
                        notes: inventory.notes || undefined,
                    }}
                />
            </div>
        </div>
    );
}
