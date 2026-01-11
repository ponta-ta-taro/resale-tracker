'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { AppleAccount } from '@/types';
import Link from 'next/link';

export default function AppleAccountsPage() {
    const [accounts, setAccounts] = useState<AppleAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/apple-accounts');
            const result = await response.json();
            if (result.data) {
                setAccounts(result.data);
            }
        } catch (error) {
            console.error('Error fetching apple accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            notes: '',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (account: AppleAccount) => {
        setFormData({
            name: account.name,
            email: account.email,
            notes: account.notes || '',
        });
        setEditingId(account.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                notes: formData.notes || null,
            };

            const url = editingId ? `/api/apple-accounts/${editingId}` : '/api/apple-accounts';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await fetchAccounts();
                resetForm();
            } else {
                const error = await response.json();
                alert(`エラー: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving apple account:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('このApple IDを削除しますか？')) return;

        try {
            const response = await fetch(`/api/apple-accounts/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchAccounts();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Error deleting apple account:', error);
            alert('削除に失敗しました');
        }
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
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">🍎 Apple ID管理</h1>
                            <p className="text-gray-600">購入に使用するApple IDの管理</p>
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
                                {editingId ? 'Apple IDを編集' : '新しいApple IDを登録'}
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
                                            placeholder="例: 田中太郎"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            メールアドレス <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="例: example@icloud.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        メモ
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="任意のメモ"
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

                    {/* Apple ID一覧 */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メモ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            Apple IDが登録されていません
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{account.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {account.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {account.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleEdit(account)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account.id)}
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
