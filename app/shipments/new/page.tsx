'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { SHIPPED_TO_OPTIONS, CARRIER_OPTIONS, Inventory } from '@/types';

export default function NewShipmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [availableInventory, setAvailableInventory] = useState<Inventory[]>([]);
    const [formData, setFormData] = useState({
        shipped_to: '',
        carrier: '',
        tracking_number: '',
        shipping_cost: '',
        shipped_at: new Date().toISOString().split('T')[0],
        notes: '',
        inventory_ids: [] as string[],
    });

    useEffect(() => {
        fetchAvailableInventory();
    }, []);

    const fetchAvailableInventory = async () => {
        try {
            const response = await fetch('/api/inventory?shipment_id=null');
            if (response.ok) {
                const json = await response.json();
                // API returns { data, count }, extract the data array
                setAvailableInventory(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/shipments', {
                method: 'POST',
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
                alert('発送の作成に失敗しました');
            }
        } catch (error) {
            console.error('Error creating shipment:', error);
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

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">新規発送</h1>

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
                            {availableInventory.length === 0 ? (
                                <p className="text-gray-500">発送可能な在庫がありません</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableInventory.map((item) => (
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
                            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '作成中...' : '作成'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
