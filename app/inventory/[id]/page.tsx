'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import StatusProgressBar from '@/components/StatusProgressBar';
import { InventoryV2, InventoryV2Status, InventoryV2Input, STATUS_V2_LABELS, PaymentMethod, ContactEmail } from '@/types';

export default function InventoryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [contactEmails, setContactEmails] = useState<ContactEmail[]>([]);

    const [formData, setFormData] = useState<InventoryV2Input>({
        order_number: '',
        item_index: 1,
        model_name: '',
        storage: '',
        color: '',
        purchase_source: '',
        payment_method_id: '',
        apple_id_used: '',
        contact_email_id: '',
        status: 'ordered',
        order_date: '',
        expected_delivery_date: '',
        original_expected_date: '',
        delivered_at: '',
        apple_carrier: '',
        apple_tracking_number: '',
        purchase_price: null,
        expected_price: null,
        actual_price: null,
        sold_to: '',
        carrier: '',
        tracking_number: '',
        sent_to_buyer_at: '',
        sold_at: '',
        paid_at: '',
        receipt_received_at: '',
        notes: '',
    });

    useEffect(() => {
        fetchInventory();
        fetchPaymentMethods();
        fetchContactEmails();
    }, [id]);

    const fetchInventory = async () => {
        try {
            const response = await fetch(`/api/inventory/${id}`);
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data: InventoryV2 = await response.json();

            setFormData({
                order_number: data.order_number,
                item_index: data.item_index,
                model_name: data.model_name,
                storage: data.storage,
                color: data.color || '',
                purchase_source: data.purchase_source || '',
                payment_method_id: data.payment_method_id || '',
                apple_id_used: data.apple_id_used || '',
                contact_email_id: data.contact_email_id || '',
                status: data.status,
                order_date: data.order_date || '',
                expected_delivery_date: data.expected_delivery_date || '',
                original_expected_date: data.original_expected_date || '',
                delivered_at: data.delivered_at || '',
                apple_carrier: data.apple_carrier || '',
                apple_tracking_number: data.apple_tracking_number || '',
                purchase_price: data.purchase_price,
                expected_price: data.expected_price,
                actual_price: data.actual_price,
                sold_to: data.sold_to || '',
                carrier: data.carrier || '',
                tracking_number: data.tracking_number || '',
                sent_to_buyer_at: data.sent_to_buyer_at || '',
                sold_at: data.sold_at || '',
                paid_at: data.paid_at || '',
                receipt_received_at: data.receipt_received_at || '',
                notes: data.notes || '',
            });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            alert('在庫データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/payment-methods');
            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    const fetchContactEmails = async () => {
        try {
            const response = await fetch('/api/contact-emails');
            if (response.ok) {
                const data = await response.json();
                setContactEmails(data);
            }
        } catch (error) {
            console.error('Error fetching contact emails:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update inventory');
            }

            router.push('/inventory');
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert(error instanceof Error ? error.message : '在庫の更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
            return;
        }

        setDeleting(true);

        try {
            const response = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete inventory');
            }

            router.push('/inventory');
        } catch (error) {
            console.error('Error deleting inventory:', error);
            alert(error instanceof Error ? error.message : '在庫の削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    const handleChange = (field: keyof InventoryV2Input, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
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
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">在庫詳細・編集</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">ステータス</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                現在のステータス
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value as InventoryV2Status)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.entries(STATUS_V2_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <StatusProgressBar currentStatus={formData.status} />
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    注文番号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.order_number}
                                    onChange={(e) => handleChange('order_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    アイテム番号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.item_index}
                                    onChange={(e) => handleChange('item_index', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    機種名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.model_name}
                                    onChange={(e) => handleChange('model_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    容量 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.storage}
                                    onChange={(e) => handleChange('storage', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    カラー
                                </label>
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    仕入先
                                </label>
                                <input
                                    type="text"
                                    value={formData.purchase_source}
                                    onChange={(e) => handleChange('purchase_source', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    支払い方法
                                </label>
                                <select
                                    value={formData.payment_method_id}
                                    onChange={(e) => handleChange('payment_method_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    {(paymentMethods || []).map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    連絡先メール
                                </label>
                                <select
                                    value={formData.contact_email_id}
                                    onChange={(e) => handleChange('contact_email_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    {(contactEmails || []).map((email) => (
                                        <option key={email.id} value={email.id}>
                                            {email.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apple ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.apple_id_used}
                                    onChange={(e) => handleChange('apple_id_used', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">日付情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    注文日
                                </label>
                                <input
                                    type="date"
                                    value={formData.order_date}
                                    onChange={(e) => handleChange('order_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    お届け予定日
                                </label>
                                <input
                                    type="date"
                                    value={formData.expected_delivery_date}
                                    onChange={(e) => handleChange('expected_delivery_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    当初予定日
                                </label>
                                <input
                                    type="date"
                                    value={formData.original_expected_date}
                                    onChange={(e) => handleChange('original_expected_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    納品日
                                </label>
                                <input
                                    type="date"
                                    value={formData.delivered_at}
                                    onChange={(e) => handleChange('delivered_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Apple Shipping Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Apple配送情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    配送業者
                                </label>
                                <input
                                    type="text"
                                    value={formData.apple_carrier}
                                    onChange={(e) => handleChange('apple_carrier', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    追跡番号
                                </label>
                                <input
                                    type="text"
                                    value={formData.apple_tracking_number}
                                    onChange={(e) => handleChange('apple_tracking_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">価格情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    仕入価格
                                </label>
                                <input
                                    type="number"
                                    value={formData.purchase_price ?? ''}
                                    onChange={(e) => handleChange('purchase_price', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    予想売価
                                </label>
                                <input
                                    type="number"
                                    value={formData.expected_price ?? ''}
                                    onChange={(e) => handleChange('expected_price', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    実売価格
                                </label>
                                <input
                                    type="number"
                                    value={formData.actual_price ?? ''}
                                    onChange={(e) => handleChange('actual_price', e.target.value ? parseFloat(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buyer/Sales Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">買取・販売情報</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    販売先
                                </label>
                                <input
                                    type="text"
                                    value={formData.sold_to}
                                    onChange={(e) => handleChange('sold_to', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    配送業者
                                </label>
                                <input
                                    type="text"
                                    value={formData.carrier}
                                    onChange={(e) => handleChange('carrier', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    伝票番号
                                </label>
                                <input
                                    type="text"
                                    value={formData.tracking_number}
                                    onChange={(e) => handleChange('tracking_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    発送日
                                </label>
                                <input
                                    type="date"
                                    value={formData.sent_to_buyer_at}
                                    onChange={(e) => handleChange('sent_to_buyer_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    売却日
                                </label>
                                <input
                                    type="date"
                                    value={formData.sold_at}
                                    onChange={(e) => handleChange('sold_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    入金日
                                </label>
                                <input
                                    type="date"
                                    value={formData.paid_at}
                                    onChange={(e) => handleChange('paid_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    領収書受領日
                                </label>
                                <input
                                    type="date"
                                    value={formData.receipt_received_at}
                                    onChange={(e) => handleChange('receipt_received_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">備考</h2>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/inventory')}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="ml-auto px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {deleting ? '削除中...' : '削除'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
