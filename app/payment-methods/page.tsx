'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { PaymentMethod, PAYMENT_METHOD_TYPES, PaymentMethodType } from '@/types';
import Link from 'next/link';

export default function PaymentMethodsPage() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/payment-methods');
            const result = await response.json();
            if (result.data) {
                setPaymentMethods(result.data);
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

    const handleEdit = (method: PaymentMethod) => {
        setFormData({
            name: method.name,
            type: method.type,
            closing_day: method.closing_day?.toString() || '',
            payment_day: method.payment_day?.toString() || '',
            payment_month_offset: method.payment_month_offset?.toString() || '1',
            credit_limit: method.credit_limit?.toString() || '',
            notes: method.notes || '',
        });
        setEditingId(method.id);
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
                await fetchPaymentMethods();
                resetForm();
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving payment method:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('この支払い方法を削除しますか？')) return;

        try {
            const response = await fetch(`/api/payment-methods/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchPaymentMethods();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Error deleting payment method:', error);
            alert('削除に失敗しました');
        }
    };

    const formatPaymentSchedule = (method: PaymentMethod) => {
        if (method.type === 'cash') return '即時';
        if (!method.closing_day || !method.payment_day) return '-';
        
        const offset = method.payment_month_offset === 0 ? '当月' : '翌月';
        return `${method.closing_day}日締め → ${offset}${method.payment_day}日払い`;
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen p-8 bg-gray-50">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center text-gray-600">読み込み中...</div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">支払い設定</h1>
                            <p className="text-gray-600">クレジットカード・デビットカード・現金の管理</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            新規登録
                        </button>
                    </div>

                    {/* 登録フォーム */}
                    {showForm && (
                        <div className="bg-white p-6 rounded-lg shadow mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {editingId ? '支払い方法を編集' : '新しい支払い方法を登録'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            名前 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="例: 楽天カード"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            種別 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethodType })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Object.entries(PAYMENT_METHOD_TYPES).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {formData.type !== 'cash' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    締め日 {formData.type === 'credit' && <span className="text-red-500">*</span>}
                                                </label>
                                                <select
                                                    value={formData.closing_day}
                                                    onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required={formData.type === 'credit'}
                                                >
                                                    <option value="">選択してください</option>
                                                    {[...Array(31)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}日</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    支払月
                                                </label>
                                                <select
                                                    value={formData.payment_month_offset}
                                                    onChange={(e) => setFormData({ ...formData, payment_month_offset: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="0">当月</option>
                                                    <option value="1">翌月</option>
                                                    <option value="2">翌々月</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    支払日 {formData.type === 'credit' && <span className="text-red-500">*</span>}
                                                </label>
                                                <select
                                                    value={formData.payment_day}
                                                    onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required={formData.type === 'credit'}
                                                >
                                                    <option value="">選択してください</option>
                                                    {[...Array(31)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}日</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                利用限度額
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.credit_limit}
                                                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: 500000"
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        メモ
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                    >
                                        {saving ? '保存中...' : (editingId ? '更新' : '登録')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 支払い方法一覧 */}
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paymentMethods.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            支払い方法が登録されていません
                                        </td>
                                    </tr>
                                ) : (
                                    paymentMethods.map((method) => (
                                        <tr key={method.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{method.name}</div>
                                                {method.notes && (
                                                    <div className="text-sm text-gray-500">{method.notes}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    method.type === 'credit' ? 'bg-blue-100 text-blue-800' :
                                                    method.type === 'debit' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {PAYMENT_METHOD_TYPES[method.type]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {formatPaymentSchedule(method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                {method.credit_limit ? `¥${method.credit_limit.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleEdit(method)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    削除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4">
                        <Link href="/" className="text-blue-600 hover:underline">
                            ← ダッシュボードに戻る
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
