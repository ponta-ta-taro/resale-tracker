'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContactEmail, ContactPhone } from '@/types';

export default function ContactsSettingsPage() {
    const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);
    const [contactPhones, setContactPhones] = useState<ContactPhone[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newEmail, setNewEmail] = useState({ email: '', notes: '' });
    const [newPhone, setNewPhone] = useState({ phone: '', notes: '' });

    // Edit states
    const [editingEmail, setEditingEmail] = useState<ContactEmail | null>(null);
    const [editingPhone, setEditingPhone] = useState<ContactPhone | null>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [emailsRes, phonesRes] = await Promise.all([
                fetch('/api/contact-emails'),
                fetch('/api/contact-phones'),
            ]);

            const emailsData = await emailsRes.json();
            const phonesData = await phonesRes.json();

            if (emailsData.data) setContactEmails(emailsData.data);
            if (phonesData.data) setContactPhones(phonesData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // Contact Email handlers
    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail.email) return;

        try {
            const response = await fetch('/api/contact-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmail),
            });

            if (!response.ok) throw new Error('Failed to add email');

            setNewEmail({ email: '', notes: '' });
            fetchAllData();
        } catch (error) {
            console.error('Error adding email:', error);
            alert('メールアドレスの追加に失敗しました');
        }
    };

    const handleUpdateEmail = async () => {
        if (!editingEmail) return;

        try {
            const response = await fetch(`/api/contact-emails/${editingEmail.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: editingEmail.email, notes: editingEmail.notes }),
            });

            if (!response.ok) throw new Error('Failed to update email');

            setEditingEmail(null);
            fetchAllData();
        } catch (error) {
            console.error('Error updating email:', error);
            alert('メールアドレスの更新に失敗しました');
        }
    };

    const handleDeleteEmail = async (id: string) => {
        if (!confirm('このメールアドレスを削除しますか?')) return;

        try {
            const response = await fetch(`/api/contact-emails/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete email');

            fetchAllData();
        } catch (error) {
            console.error('Error deleting email:', error);
            alert('メールアドレスの削除に失敗しました');
        }
    };

    // Contact Phone handlers
    const handleAddPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhone.phone) return;

        try {
            const response = await fetch('/api/contact-phones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPhone),
            });

            if (!response.ok) throw new Error('Failed to add phone');

            setNewPhone({ phone: '', notes: '' });
            fetchAllData();
        } catch (error) {
            console.error('Error adding phone:', error);
            alert('電話番号の追加に失敗しました');
        }
    };

    const handleUpdatePhone = async () => {
        if (!editingPhone) return;

        try {
            const response = await fetch(`/api/contact-phones/${editingPhone.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: editingPhone.phone, notes: editingPhone.notes }),
            });

            if (!response.ok) throw new Error('Failed to update phone');

            setEditingPhone(null);
            fetchAllData();
        } catch (error) {
            console.error('Error updating phone:', error);
            alert('電話番号の更新に失敗しました');
        }
    };

    const handleDeletePhone = async (id: string) => {
        if (!confirm('この電話番号を削除しますか?')) return;

        try {
            const response = await fetch(`/api/contact-phones/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete phone');

            fetchAllData();
        } catch (error) {
            console.error('Error deleting phone:', error);
            alert('電話番号の削除に失敗しました');
        }
    };

    const inputClass = "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700";
    const deleteButtonClass = "px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm";
    const editButtonClass = "px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm";

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-8 py-8">
                <p>読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-8 py-8">
            {/* Back to Dashboard Button */}
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                    ← ダッシュボードに戻る
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-8">連絡先情報管理</h1>

            {/* Contact Emails Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">📧 連絡先メールアドレス</h2>

                {/* Add Form */}
                <form onSubmit={handleAddEmail} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="email"
                            placeholder="メールアドレス *"
                            value={newEmail.email}
                            onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                            className={inputClass}
                            required
                        />
                        <input
                            type="text"
                            placeholder="メモ"
                            value={newEmail.notes}
                            onChange={(e) => setNewEmail({ ...newEmail, notes: e.target.value })}
                            className={inputClass}
                        />
                        <button type="submit" className={buttonClass}>追加</button>
                    </div>
                </form>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">メールアドレス</th>
                                <th className="px-4 py-2 text-left">メモ</th>
                                <th className="px-4 py-2 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contactEmails.map((email) => (
                                <tr key={email.id} className="border-t">
                                    {editingEmail?.id === email.id ? (
                                        <>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="email"
                                                    value={editingEmail.email}
                                                    onChange={(e) => setEditingEmail({ ...editingEmail, email: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={editingEmail.notes || ''}
                                                    onChange={(e) => setEditingEmail({ ...editingEmail, notes: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={handleUpdateEmail} className="mr-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">保存</button>
                                                <button onClick={() => setEditingEmail(null)} className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm">キャンセル</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2">{email.email}</td>
                                            <td className="px-4 py-2">{email.notes || '-'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => setEditingEmail(email)} className={`mr-2 ${editButtonClass}`}>編集</button>
                                                <button onClick={() => handleDeleteEmail(email.id)} className={deleteButtonClass}>削除</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {contactEmails.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">登録されていません</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contact Phones Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-semibold mb-4">📱 連絡先電話番号</h2>

                {/* Add Form */}
                <form onSubmit={handleAddPhone} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="tel"
                            placeholder="電話番号 *"
                            value={newPhone.phone}
                            onChange={(e) => setNewPhone({ ...newPhone, phone: e.target.value })}
                            className={inputClass}
                            required
                        />
                        <input
                            type="text"
                            placeholder="メモ"
                            value={newPhone.notes}
                            onChange={(e) => setNewPhone({ ...newPhone, notes: e.target.value })}
                            className={inputClass}
                        />
                        <button type="submit" className={buttonClass}>追加</button>
                    </div>
                </form>

                {/* List */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left">電話番号</th>
                                <th className="px-4 py-2 text-left">メモ</th>
                                <th className="px-4 py-2 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contactPhones.map((phone) => (
                                <tr key={phone.id} className="border-t">
                                    {editingPhone?.id === phone.id ? (
                                        <>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="tel"
                                                    value={editingPhone.phone}
                                                    onChange={(e) => setEditingPhone({ ...editingPhone, phone: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={editingPhone.notes || ''}
                                                    onChange={(e) => setEditingPhone({ ...editingPhone, notes: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={handleUpdatePhone} className="mr-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">保存</button>
                                                <button onClick={() => setEditingPhone(null)} className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm">キャンセル</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2">{phone.phone}</td>
                                            <td className="px-4 py-2">{phone.notes || '-'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => setEditingPhone(phone)} className={`mr-2 ${editButtonClass}`}>編集</button>
                                                <button onClick={() => handleDeletePhone(phone.id)} className={deleteButtonClass}>削除</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                            {contactPhones.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">登録されていません</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
