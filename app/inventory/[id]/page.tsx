'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import StatusProgressBar from '@/components/StatusProgressBar';
import type { InventoryV2, InventoryV2Input, InventoryV2Status } from '@/types';
import { INVENTORY_STATUSES, STATUS_V2_LABELS } from '@/types';

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [inventory, setInventory] = useState<InventoryV2 | null>(null);
    const [formData, setFormData] = useState<Partial<InventoryV2Input>>({});

    useEffect(() => {
        fetchInventory();
    }, [id]);

    async function fetchInventory() {
        try {
            const res = await fetch(`/api/inventory/${id}`);
            const json = await res.json();

            if (json.data) {
                setInventory(json.data);
                setFormData(json.data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const json = await res.json();

            if (res.ok) {
                alert('更新しました');
                fetchInventory();
            } else {
                alert(`エラー: ${json.error || '更新に失敗しました'}`);
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？')) return;

        try {
            const res = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('削除しました');
                router.push('/inventory');
            } else {
                const json = await res.json();
                alert(`エラー: ${json.error || '削除に失敗しました'}`);
            }
        } catch (error) {
            console.error('Error deleting inventory:', error);
            alert('削除に失敗しました');
        }
    };

    const updateField = (field: keyof InventoryV2Input, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-500">読み込み中...</div>
            </div>
        );
    }

    if (!inventory) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-500">在庫が見つかりません</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">在庫詳細・編集</h1>
                <div className="text-sm text-gray-500">
                    在庫コード: <span className="font-semibold">{inventory.inventory_code}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ステータス */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 ステータス</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            現在のステータス
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => updateField('status', e.target.value as InventoryV2Status)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {INVENTORY_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_V2_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <StatusProgressBar currentStatus={formData.status || 'ordered'} />
                </div>

                {/* 基本情報 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 基本情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">注文番号</label>
                            <input
                                type="text"
                                value={formData.order_number || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">アイテム番号</label>
                            <input
                                type="number"
                                value={formData.item_index || 1}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">機種名</label>
                            <input
                                type="text"
                                value={formData.model_name || ''}
                                onChange={(e) => updateField('model_name', e.target.value)}
                                placeholder="iPhone 17 Pro Max"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">容量</label>
                            <input
                                type="text"
                                value={formData.storage || ''}
                                onChange={(e) => updateField('storage', e.target.value)}
                                placeholder="256GB"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
                            <input
                                type="text"
                                value={formData.color || ''}
                                onChange={(e) => updateField('color', e.target.value)}
                                placeholder="コズミックオレンジ"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">仕入先</label>
                            <select
                                value={formData.purchase_source || ''}
                                onChange={(e) => updateField('purchase_source', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">選択してください</option>
                                <option value="Apple Store">Apple Store</option>
                                <option value="Amazon">Amazon</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 日付情報 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 日付情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">注文日</label>
                            <input
                                type="date"
                                value={formData.order_date || ''}
                                onChange={(e) => updateField('order_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">納品日</label>
                            <input
                                type="date"
                                value={formData.delivered_at || ''}
                                onChange={(e) => updateField('delivered_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">お届け予定日（開始）</label>
                            <input
                                type="date"
                                value={formData.expected_delivery_start || ''}
                                onChange={(e) => updateField('expected_delivery_start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">お届け予定日（終了）</label>
                            <input
                                type="date"
                                value={formData.expected_delivery_end || ''}
                                onChange={(e) => updateField('expected_delivery_end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">当初お届け予定日（開始）</label>
                            <input
                                type="date"
                                value={formData.original_delivery_start || ''}
                                onChange={(e) => updateField('original_delivery_start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">当初お届け予定日（終了）</label>
                            <input
                                type="date"
                                value={formData.original_delivery_end || ''}
                                onChange={(e) => updateField('original_delivery_end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Apple配送情報 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Apple配送情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">配送業者</label>
                            <input
                                type="text"
                                value={formData.carrier || ''}
                                onChange={(e) => updateField('carrier', e.target.value)}
                                placeholder="ヤマト運輸"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">追跡番号</label>
                            <input
                                type="text"
                                value={formData.tracking_number || ''}
                                onChange={(e) => updateField('tracking_number', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* 価格情報 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 価格情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">仕入価格</label>
                            <input
                                type="number"
                                value={formData.purchase_price || ''}
                                onChange={(e) => updateField('purchase_price', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="194800"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">予想売価</label>
                            <input
                                type="number"
                                value={formData.expected_price || ''}
                                onChange={(e) => updateField('expected_price', e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="203000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">実売価格</label>
                            <input
                                type="number"
                                value={formData.actual_price || ''}
                                onChange={(e) => updateField('actual_price', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* 買取・販売情報 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">🚚 買取・販売情報</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">販売先</label>
                            <input
                                type="text"
                                value={formData.sold_to || ''}
                                onChange={(e) => updateField('sold_to', e.target.value)}
                                placeholder="モバイルミックス"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">買取発送日</label>
                            <input
                                type="date"
                                value={formData.shipped_to_buyer_at || ''}
                                onChange={(e) => updateField('shipped_to_buyer_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">買取配送業者</label>
                            <input
                                type="text"
                                value={formData.buyer_carrier || ''}
                                onChange={(e) => updateField('buyer_carrier', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">買取伝票番号</label>
                            <input
                                type="text"
                                value={formData.buyer_tracking_number || ''}
                                onChange={(e) => updateField('buyer_tracking_number', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">売却日</label>
                            <input
                                type="date"
                                value={formData.sold_at || ''}
                                onChange={(e) => updateField('sold_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">入金日</label>
                            <input
                                type="date"
                                value={formData.paid_at || ''}
                                onChange={(e) => updateField('paid_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">領収書受領日</label>
                            <input
                                type="date"
                                value={formData.receipt_received_at || ''}
                                onChange={(e) => updateField('receipt_received_at', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* 備考 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 備考</h2>

                    <textarea
                        value={formData.notes || ''}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="備考を入力..."
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                        {saving ? '更新中...' : '更新する'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/inventory')}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        戻る
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        削除
                    </button>
                </div>
            </form>
        </div>
    );
}
