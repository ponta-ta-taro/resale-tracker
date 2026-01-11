'use client';

import { useEffect, useState } from 'react';
import { MobileLine, CARRIER_OPTIONS } from '@/types';

export default function MobileLinesManager() {
    const [items, setItems] = useState<MobileLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        carrier: '',
        phone_number: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/mobile-lines');
            const result = await response.json();
            if (result.data) {
                setItems(result.data);
            }
        } catch (error) {
            console.error('Error fetching:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', carrier: '', phone_number: '', notes: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (item: MobileLine) => {
        setFormData({
            name: item.name,
            carrier: item.carrier || '',
            phone_number: item.phone_number || '',
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
                carrier: formData.carrier || null,
                phone_number: formData.phone_number || null,
                notes: formData.notes || null,
            };

            const url = editingId ? `/api/mobile-lines/${editingId}` : '/api/mobile-lines';
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
            const response = await fetch(`/api/mobile-lines/${id}`, { method: 'DELETE' });
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
                <h2 className="text-xl font-bold text-gray-900">携帯回線一覧</h2>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">識別名 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="ドコモ1、au2など"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">キャリア</label>
                                <select
                                    value={formData.carrier}
                                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">選択してください</option>
                                    {CARRIER_OPTIONS.map(carrier => (
                                        <option key={carrier} value={carrier}>{carrier}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                                <input
                                    type="text"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">識別名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">キャリア</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">データがありません</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className={`hover:bg-gray-50 ${!item.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.carrier || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.phone_number || '-'}</td>
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
