'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SHIPPED_TO_OPTIONS, CARRIER_OPTIONS, Inventory, Shipment } from '@/types';

export default function EditShipmentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [availableInventory, setAvailableInventory] = useState<Inventory[]>([]);
    const [linkedInventory, setLinkedInventory] = useState<Inventory[]>([]);
    const [formData, setFormData] = useState({
        shipped_to: '',
        carrier: '',
        tracking_number: '',
        shipping_cost: '',
        shipped_at: '',
        notes: '',
        inventory_ids: [] as string[],
    });

    useEffect(() => {
        fetchShipment();
        fetchAvailableInventory();
    }, [id]);

    const fetchShipment = async () => {
        try {
            const response = await fetch(`/api/shipments/${id}`);
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    shipped_to: data.shipped_to,
                    carrier: data.carrier,
                    tracking_number: data.tracking_number || '',
                    shipping_cost: data.shipping_cost.toString(),
                    shipped_at: data.shipped_at,
                    notes: data.notes || '',
                    inventory_ids: (data.inventory || []).map((i: Inventory) => i.id),
                });
                setLinkedInventory(data.inventory || []);
            }
        } catch (error) {
            console.error('Error fetching shipment:', error);
        } finally {
            setFetching(false);
        }
    };

    const fetchAvailableInventory = async () => {
        try {
            const response = await fetch('/api/inventory?shipment_id=null');
            if (response.ok) {
                const data = await response.json();
                setAvailableInventory(data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/shipments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipped_to: formData.shipped_to,
                    carrier: formData.carrier,
                    tracking_number: formData.tracking_number || null,
                    shipping_cost: parseInt(formData.shipping_cost),
                    shipped_at: formData.shipped_at,
                    notes: formData.notes || null,
                    inventory_ids: formData.inventory_ids,
                }),
            });

            if (response.ok) {
                router.push('/shipments');
            } else {
                alert('発送の更新に失敗しました');
            }
        } catch (error) {
            console.error('Error updating shipment:', error);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const toggleInventoryItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            inventory_ids: prev.inventory_ids.includes(id)
                ? prev.inventory_ids.filter(i => i !== id)
                : [...prev.inventory_ids, id],
        }));
    };

    if (fetching) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    // Combine available and linked inventory for display
    const allInventory = [...linkedInventory, ...availableInventory];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">発送編集</h1>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            発送先 <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.shipped_to}
                            onChange={(e) => setFormData({ ...formData, shipped_to: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            <option value="">選択してください</option>
                            {SHIPPED_TO_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            配送業者 <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.carrier}
                            onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            <option value="">選択してください</option>
                            {CARRIER_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            追跡番号
                        </label>
                        <input
                            type="text"
                            value={formData.tracking_number}
                            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            送料（円） <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            value={formData.shipping_cost}
                            onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            発送日 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.shipped_at}
                            onChange={(e) => setFormData({ ...formData, shipped_at: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            備考
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            在庫アイテム選択
                        </label>
                        <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                            {allInventory.length === 0 ? (
                                <p className="text-gray-500">発送可能な在庫がありません</p>
                            ) : (
                                <div className="space-y-2">
                                    {allInventory.map((item) => (
                                        <label key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.inventory_ids.includes(item.id)}
                                                onChange={() => toggleInventoryItem(item.id)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">
                                                {item.model_name} {item.storage} {item.color}
                                                {item.order_number && ` (注文番号: ${item.order_number})`}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '更新中...' : '更新'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
