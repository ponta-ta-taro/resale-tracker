'use client';

import { useEffect, useState } from 'react';
import { PaymentMethod, PAYMENT_METHOD_TYPES, PaymentMethodType } from '@/types';

export default function PaymentMethodsManager() {
    const [items, setItems] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'credit' as PaymentMethodType,
        closing_day: '',
        payment_day: '',
        payment_month_offset: '1',
        credit_limit: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/payment-methods');
            const result = await response.json();
            if (result.data) {
                setItems(result.data);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'credit',
            closing_day: '',
            payment_day: '',
            payment_month_offset: '1',
            credit_limit: '',
            notes: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (item: PaymentMethod) => {
        setFormData({
            name: item.name,
            type: item.type,
            closing_day: item.closing_day?.toString() || '',
            payment_day: item.payment_day?.toString() || '',
            payment_month_offset: item.payment_month_offset?.toString() || '1',
            credit_limit: item.credit_limit?.toString() || '',
            notes: item.notes || '',
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                closing_day: formData.type === 'cash' ? null : (formData.closing_day ? parseInt(formData.closing_day) : null),
                payment_day: formData.type === 'cash' ? null : (formData.payment_day ? parseInt(formData.payment_day) : null),
                payment_month_offset: formData.type === 'cash' ? null : (formData.payment_month_offset ? parseInt(formData.payment_month_offset) : 1),
                credit_limit: formData.type === 'cash' ? null : (formData.credit_limit ? parseInt(formData.credit_limit) : null),
                notes: formData.notes || null,
            };

            const url = editingId ? `/api/payment-methods/${editingId}` : '/api/payment-methods';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await fetchItems();
                resetForm();
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('削除しますか？')) return;

        try {
            const response = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchItems();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('削除に失敗しました');
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">支払い方法一覧</h2>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    新規登録
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">{editingId ? '編集' : '新規登録'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">種別 *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethodType })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    {Object.entries(PAYMENT_METHOD_TYPES).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.type !== 'cash' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">締め日</label>
                                    <select
                                        value={formData.closing_day}
                                        onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">選択</option>
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}日</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">支払月</label>
                                    <select
                                        value={formData.payment_month_offset}
                                        onChange={(e) => setFormData({ ...formData, payment_month_offset: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="0">当月</option>
                                        <option value="1">翌月</option>
                                        <option value="2">翌々月</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">支払日</label>
                                    <select
                                        value={formData.payment_day}
                                        onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">選択</option>
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}日</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">限度額</label>
                                    <input
                                        type="number"
                                        value={formData.credit_limit}
                                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                                {saving ? '保存中...' : '保存'}
                            </button>
                            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スケジュール</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">限度額</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">データがありません</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{item.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            item.type === 'credit' ? 'bg-blue-100 text-blue-800' :
                                            item.type === 'debit' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {PAYMENT_METHOD_TYPES[item.type]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.type === 'cash' ? '即時' : 
                                            item.closing_day && item.payment_day ? 
                                                `${item.closing_day}日締め → ${item.payment_month_offset === 0 ? '当月' : '翌月'}${item.payment_day}日払い` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">{item.credit_limit ? `¥${item.credit_limit.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline mr-3">編集</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">削除</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
