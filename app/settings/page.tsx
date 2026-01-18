'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import {
    AppleAccount,
    PaymentMethod,
    PAYMENT_METHOD_TYPES,
    PaymentMethodType,
    ContactEmail,
    ContactPhone
} from '@/types';
import Link from 'next/link';

export default function SettingsPage() {
    // Apple Accounts state
    const [appleAccounts, setAppleAccounts] = useState<AppleAccount[]>([]);
    const [showAppleForm, setShowAppleForm] = useState(false);
    const [editingAppleId, setEditingAppleId] = useState<string | null>(null);
    const [appleFormData, setAppleFormData] = useState({ name: '', email: '', notes: '' });

    // Payment Methods state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [paymentFormData, setPaymentFormData] = useState({
        name: '', type: 'credit' as PaymentMethodType, closing_day: '', payment_day: '',
        payment_month_offset: '1', credit_limit: '', notes: ''
    });

    // Contact Emails state
    const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
    const [emailFormData, setEmailFormData] = useState({ email: '', label: '' });

    // Contact Phones state
    const [contactPhones, setContactPhones] = useState<ContactPhone[]>([]);
    const [showPhoneForm, setShowPhoneForm] = useState(false);
    const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
    const [phoneFormData, setPhoneFormData] = useState({ phone_number: '', label: '' });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [appleRes, paymentRes, emailRes, phoneRes] = await Promise.all([
                fetch('/api/apple-accounts'),
                fetch('/api/payment-methods'),
                fetch('/api/contact-emails'),
                fetch('/api/contact-phones'),
            ]);

            const [appleData, paymentData, emailData, phoneData] = await Promise.all([
                appleRes.json(),
                paymentRes.json(),
                emailRes.json(),
                phoneRes.json(),
            ]);

            if (appleData.data) setAppleAccounts(appleData.data);
            if (paymentData.data) setPaymentMethods(paymentData.data);
            if (emailData.data) setContactEmails(emailData.data);
            if (phoneData.data) setContactPhones(phoneData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Apple Account handlers
    const resetAppleForm = () => {
        setAppleFormData({ name: '', email: '', notes: '' });
        setEditingAppleId(null);
        setShowAppleForm(false);
    };

    const handleEditApple = (account: AppleAccount) => {
        setAppleFormData({ name: account.name, email: account.email || '', notes: account.notes || '' });
        setEditingAppleId(account.id);
        setShowAppleForm(true);
    };

    const handleSubmitApple = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingAppleId ? `/api/apple-accounts/${editingAppleId}` : '/api/apple-accounts';
            const method = editingAppleId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...appleFormData, notes: appleFormData.notes || null }),
            });
            if (response.ok) {
                await fetchAllData();
                resetAppleForm();
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Error saving apple account:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteApple = async (id: string) => {
        if (!confirm('このApple IDを削除しますか？')) return;
        try {
            const response = await fetch(`/api/apple-accounts/${id}`, { method: 'DELETE' });
            if (response.ok) await fetchAllData();
            else alert('削除に失敗しました');
        } catch (error) {
            console.error('Error deleting apple account:', error);
            alert('削除に失敗しました');
        }
    };

    // Payment Method handlers
    const resetPaymentForm = () => {
        setPaymentFormData({
            name: '', type: 'credit', closing_day: '', payment_day: '',
            payment_month_offset: '1', credit_limit: '', notes: ''
        });
        setEditingPaymentId(null);
        setShowPaymentForm(false);
    };

    const handleEditPayment = (method: PaymentMethod) => {
        setPaymentFormData({
            name: method.name,
            type: method.type,
            closing_day: method.closing_day?.toString() || '',
            payment_day: method.payment_day?.toString() || '',
            payment_month_offset: method.payment_month_offset?.toString() || '1',
            credit_limit: method.credit_limit?.toString() || '',
            notes: method.notes || '',
        });
        setEditingPaymentId(method.id);
        setShowPaymentForm(true);
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: paymentFormData.name,
                type: paymentFormData.type,
                closing_day: paymentFormData.type === 'cash' ? null : (paymentFormData.closing_day ? parseInt(paymentFormData.closing_day) : null),
                payment_day: paymentFormData.type === 'cash' ? null : (paymentFormData.payment_day ? parseInt(paymentFormData.payment_day) : null),
                payment_month_offset: paymentFormData.type === 'cash' ? null : (paymentFormData.payment_month_offset ? parseInt(paymentFormData.payment_month_offset) : 1),
                credit_limit: paymentFormData.type === 'cash' ? null : (paymentFormData.credit_limit ? parseInt(paymentFormData.credit_limit) : null),
                notes: paymentFormData.notes || null,
            };
            const url = editingPaymentId ? `/api/payment-methods/${editingPaymentId}` : '/api/payment-methods';
            const method = editingPaymentId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                await fetchAllData();
                resetPaymentForm();
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Error saving payment method:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePayment = async (id: string) => {
        if (!confirm('この支払い方法を削除しますか？')) return;
        try {
            const response = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
            if (response.ok) await fetchAllData();
            else alert('削除に失敗しました');
        } catch (error) {
            console.error('Error deleting payment method:', error);
            alert('削除に失敗しました');
        }
    };

    // Contact Email handlers
    const resetEmailForm = () => {
        setEmailFormData({ email: '', label: '' });
        setEditingEmailId(null);
        setShowEmailForm(false);
    };

    const handleEditEmail = (email: ContactEmail) => {
        setEmailFormData({ email: email.email, label: email.label || '' });
        setEditingEmailId(email.id);
        setShowEmailForm(true);
    };

    const handleSubmitEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingEmailId ? `/api/contact-emails/${editingEmailId}` : '/api/contact-emails';
            const method = editingEmailId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...emailFormData, label: emailFormData.label || null }),
            });
            if (response.ok) {
                await fetchAllData();
                resetEmailForm();
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Error saving contact email:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmail = async (id: string) => {
        if (!confirm('このメールアドレスを削除しますか？')) return;
        try {
            const response = await fetch(`/api/contact-emails/${id}`, { method: 'DELETE' });
            if (response.ok) await fetchAllData();
            else alert('削除に失敗しました');
        } catch (error) {
            console.error('Error deleting contact email:', error);
            alert('削除に失敗しました');
        }
    };

    // Contact Phone handlers
    const resetPhoneForm = () => {
        setPhoneFormData({ phone_number: '', label: '' });
        setEditingPhoneId(null);
        setShowPhoneForm(false);
    };

    const handleEditPhone = (phone: ContactPhone) => {
        setPhoneFormData({ phone_number: phone.phone_number, label: phone.label || '' });
        setEditingPhoneId(phone.id);
        setShowPhoneForm(true);
    };

    const handleSubmitPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingPhoneId ? `/api/contact-phones/${editingPhoneId}` : '/api/contact-phones';
            const method = editingPhoneId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...phoneFormData, label: phoneFormData.label || null }),
            });
            if (response.ok) {
                await fetchAllData();
                resetPhoneForm();
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Error saving contact phone:', error);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePhone = async (id: string) => {
        if (!confirm('この電話番号を削除しますか？')) return;
        try {
            const response = await fetch(`/api/contact-phones/${id}`, { method: 'DELETE' });
            if (response.ok) await fetchAllData();
            else alert('削除に失敗しました');
        } catch (error) {
            console.error('Error deleting contact phone:', error);
            alert('削除に失敗しました');
        }
    };

    const formatPaymentSchedule = (method: PaymentMethod) => {
        if (method.type === 'cash') return '即時';
        if (!method.closing_day || !method.payment_day) return '-';
        const offset = method.payment_month_offset === 0 ? '当月' : '翌月';
        const closingDay = method.closing_day === 31 ? '末日' : `${method.closing_day}日`;
        const paymentDay = method.payment_day === 31 ? '末日' : `${method.payment_day}日`;
        return `${closingDay}締め → ${offset}${paymentDay}払い`;
    };

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen p-8 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
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
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
                        <p className="text-gray-600">Apple ID、支払い方法、連絡先情報の管理</p>
                    </div>

                    {/* Apple Accounts Section */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Apple ID</h2>
                            <button
                                onClick={() => setShowAppleForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                新規登録
                            </button>
                        </div>

                        {showAppleForm && (
                            <div className="bg-white p-6 rounded-lg shadow mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {editingAppleId ? 'Apple IDを編集' : '新しいApple IDを登録'}
                                </h3>
                                <form onSubmit={handleSubmitApple} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                名前 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={appleFormData.name}
                                                onChange={(e) => setAppleFormData({ ...appleFormData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: 田中太郎"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                メールアドレス
                                            </label>
                                            <input
                                                type="email"
                                                value={appleFormData.email}
                                                onChange={(e) => setAppleFormData({ ...appleFormData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: example@icloud.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                                        <textarea
                                            value={appleFormData.notes}
                                            onChange={(e) => setAppleFormData({ ...appleFormData, notes: e.target.value })}
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
                                            {saving ? '保存中...' : (editingAppleId ? '更新' : '登録')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetAppleForm}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                        >
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メモ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {appleAccounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                Apple IDが登録されていません
                                            </td>
                                        </tr>
                                    ) : (
                                        appleAccounts.map((account) => (
                                            <tr key={account.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{account.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {account.email || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {account.notes || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleEditApple(account)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        編集
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteApple(account.id)}
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
                    </div>

                    {/* Payment Methods Section */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">支払い方法</h2>
                            <button
                                onClick={() => setShowPaymentForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                新規登録
                            </button>
                        </div>

                        {showPaymentForm && (
                            <div className="bg-white p-6 rounded-lg shadow mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {editingPaymentId ? '支払い方法を編集' : '新しい支払い方法を登録'}
                                </h3>
                                <form onSubmit={handleSubmitPayment} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                名前 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={paymentFormData.name}
                                                onChange={(e) => setPaymentFormData({ ...paymentFormData, name: e.target.value })}
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
                                                value={paymentFormData.type}
                                                onChange={(e) => setPaymentFormData({ ...paymentFormData, type: e.target.value as PaymentMethodType })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {Object.entries(PAYMENT_METHOD_TYPES).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {paymentFormData.type !== 'cash' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        締め日 {paymentFormData.type === 'credit' && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={paymentFormData.closing_day}
                                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, closing_day: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required={paymentFormData.type === 'credit'}
                                                    >
                                                        <option value="">選択してください</option>
                                                        {[...Array(31)].map((_, i) => (
                                                            <option key={i + 1} value={i + 1}>{i + 1 === 31 ? '末日' : `${i + 1}日`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">支払月</label>
                                                    <select
                                                        value={paymentFormData.payment_month_offset}
                                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_month_offset: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="0">当月</option>
                                                        <option value="1">翌月</option>
                                                        <option value="2">翌々月</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        支払日 {paymentFormData.type === 'credit' && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <select
                                                        value={paymentFormData.payment_day}
                                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_day: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        required={paymentFormData.type === 'credit'}
                                                    >
                                                        <option value="">選択してください</option>
                                                        {[...Array(31)].map((_, i) => (
                                                            <option key={i + 1} value={i + 1}>{i + 1 === 31 ? '末日' : `${i + 1}日`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">利用限度額</label>
                                                <input
                                                    type="number"
                                                    value={paymentFormData.credit_limit}
                                                    onChange={(e) => setPaymentFormData({ ...paymentFormData, credit_limit: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="例: 500000"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                                        <textarea
                                            value={paymentFormData.notes}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
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
                                            {saving ? '保存中...' : (editingPaymentId ? '更新' : '登録')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetPaymentForm}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                        >
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
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${method.type === 'credit' ? 'bg-blue-100 text-blue-800' :
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
                                                        onClick={() => handleEditPayment(method)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        編集
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(method.id)}
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
                    </div>

                    {/* Contact Emails Section */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">連絡先メールアドレス</h2>
                            <button
                                onClick={() => setShowEmailForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                新規登録
                            </button>
                        </div>

                        {showEmailForm && (
                            <div className="bg-white p-6 rounded-lg shadow mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {editingEmailId ? 'メールアドレスを編集' : '新しいメールアドレスを登録'}
                                </h3>
                                <form onSubmit={handleSubmitEmail} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                メールアドレス <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={emailFormData.email}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: contact@example.com"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ラベル</label>
                                            <input
                                                type="text"
                                                value={emailFormData.label}
                                                onChange={(e) => setEmailFormData({ ...emailFormData, label: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                        >
                                            {saving ? '保存中...' : (editingEmailId ? '更新' : '登録')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetEmailForm}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                        >
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ラベル</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contactEmails.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                メールアドレスが登録されていません
                                            </td>
                                        </tr>
                                    ) : (
                                        contactEmails.map((email) => (
                                            <tr key={email.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{email.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {email.label || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleEditEmail(email)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        編集
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEmail(email.id)}
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
                    </div>

                    {/* Contact Phones Section */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">連絡先電話番号</h2>
                            <button
                                onClick={() => setShowPhoneForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                新規登録
                            </button>
                        </div>

                        {showPhoneForm && (
                            <div className="bg-white p-6 rounded-lg shadow mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {editingPhoneId ? '電話番号を編集' : '新しい電話番号を登録'}
                                </h3>
                                <form onSubmit={handleSubmitPhone} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                電話番号 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={phoneFormData.phone_number}
                                                onChange={(e) => setPhoneFormData({ ...phoneFormData, phone_number: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="例: 090-1234-5678"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ラベル</label>
                                            <input
                                                type="text"
                                                value={phoneFormData.label}
                                                onChange={(e) => setPhoneFormData({ ...phoneFormData, label: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                        >
                                            {saving ? '保存中...' : (editingPhoneId ? '更新' : '登録')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetPhoneForm}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                        >
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ラベル</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contactPhones.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                電話番号が登録されていません
                                            </td>
                                        </tr>
                                    ) : (
                                        contactPhones.map((phone) => (
                                            <tr key={phone.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900">{phone.phone_number}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {phone.label || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleEditPhone(phone)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        編集
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePhone(phone.id)}
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
                    </div>

                    <div className="mt-8">
                        <Link href="/" className="text-blue-600 hover:underline">
                            ← ダッシュボードに戻る
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
