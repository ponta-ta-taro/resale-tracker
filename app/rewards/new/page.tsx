'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { REWARD_TYPES, RewardType, Inventory } from '@/types';

export default function NewRewardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [formData, setFormData] = useState({
        type: 'gift_card' as RewardType,
        description: '',
        amount: '',
        points: '',
        point_rate: '',
        earned_at: new Date().toISOString().split('T')[0],
        inventory_id: '',
        notes: '',
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/inventory');
            if (response.ok) {
                const data = await response.json();
                setInventory(data);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                type: formData.type,
                description: formData.description,
                earned_at: formData.earned_at,
                inventory_id: formData.inventory_id || null,
                notes: formData.notes || null,
            };

            if (formData.type === 'gift_card') {
                payload.amount = parseInt(formData.amount);
                payload.points = null;
                payload.point_rate = null;
            } else {
                payload.amount = null;
                payload.points = parseInt(formData.points);
                payload.point_rate = parseFloat(formData.point_rate);
            }

            const response = await fetch('/api/rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.push('/rewards');
            } else {
                alert('ポイント・特典の作成に失敗しました');
            }
        } catch (error) {
            console.error('Error creating reward:', error);
            alert('エラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const calculateValue = () => {
        if (formData.type === 'credit_card_points' && formData.points && formData.point_rate) {
            return Math.round(parseInt(formData.points) * parseFloat(formData.point_rate));
        }
        return 0;
    };

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">新規ポイント・特典登録</h1>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            種類 <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as RewardType })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            {Object.entries(REWARD_TYPES).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            説明 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            placeholder="例: Apple Gift Card, 楽天カード"
                        />
                    </div>

                    {formData.type === 'gift_card' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                金額（円） <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                placeholder="5000"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ポイント数 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="3000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    還元率（円/pt） <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.point_rate}
                                    onChange={(e) => setFormData({ ...formData, point_rate: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    placeholder="0.5"
                                />
                            </div>

                            {formData.points && formData.point_rate && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-900">
                                        換算額: <span className="font-bold">¥{calculateValue().toLocaleString()}</span>
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            獲得日 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.earned_at}
                            onChange={(e) => setFormData({ ...formData, earned_at: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            紐付け端末（任意）
                        </label>
                        <select
                            value={formData.inventory_id}
                            onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        >
                            <option value="">選択しない</option>
                            {inventory.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.model_name} {item.storage} {item.color}
                                    {item.order_number && ` (注文番号: ${item.order_number})`}
                                </option>
                            ))}
                        </select>
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
