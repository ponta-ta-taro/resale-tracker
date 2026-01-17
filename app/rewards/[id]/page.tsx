'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { REWARD_TYPES, RewardType, Inventory, Reward } from '@/types';

export default function EditRewardPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [formData, setFormData] = useState({
        type: 'gift_card' as RewardType,
        description: '',
        amount: '',
        points: '',
        point_rate: '',
        earned_at: '',
        inventory_id: '',
        notes: '',
    });

    useEffect(() => {
        fetchReward();
        fetchInventory();
    }, [id]);

    const fetchReward = async () => {
        try {
            const response = await fetch(`/api/rewards/${id}`);
            if (response.ok) {
                const reward: Reward = await response.json();
                setFormData({
                    type: reward.type,
                    description: reward.description,
                    amount: reward.amount?.toString() || '',
                    points: reward.points?.toString() || '',
                    point_rate: reward.point_rate?.toString() || '',
                    earned_at: reward.earned_at,
                    inventory_id: reward.inventory_id || '',
                    notes: reward.notes || '',
                });
            }
        } catch (error) {
            console.error('Error fetching reward:', error);
        } finally {
            setFetching(false);
        }
    };

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

            const response = await fetch(`/api/rewards/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.push('/rewards');
            } else {
                alert('ポイント・特典の更新に失敗しました');
            }
        } catch (error) {
            console.error('Error updating reward:', error);
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

    if (fetching) {
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
                <h1 className="text-3xl font-bold text-gray-900 mb-6">ポイント・特典編集</h1>

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
                            {loading ? '更新中...' : '更新'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
