'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatusProgressBar from '@/components/StatusProgressBar';
import type { InventoryV2Input, InventoryV2Status } from '@/types';
import { INVENTORY_STATUSES, STATUS_V2_LABELS } from '@/types';

export default function NewInventoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<InventoryV2Input>({
        order_number: '',
        item_index: 1,
        status: 'ordered',
    });

    // Master data states
    const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string }>>([]);
    const [contactEmails, setContactEmails] = useState<Array<{ id: string; email: string }>>([]);
    const [contactPhones, setContactPhones] = useState<Array<{ id: string; phone_number: string }>>([]);
    const [appleAccounts, setAppleAccounts] = useState<Array<{ id: string; name: string }>>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate actual_price when sold_at or paid_at is filled
        if ((formData.sold_at || formData.paid_at) && (!formData.actual_price || formData.actual_price === 0)) {
            alert('実売価格を入力してください');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const json = await res.json();

            if (res.ok && json.data) {
                router.push(`/inventory/${json.data.id}`);
            } else {
                alert(`エラー: ${json.error || '登録に失敗しました'}`);
            }
        } catch (error) {
            console.error('Error creating inventory:', error);
            alert('登録に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: keyof InventoryV2Input, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [pmRes, ceRes, cpRes, aaRes] = await Promise.all([
                fetch('/api/payment-methods'),
                fetch('/api/contact-emails'),
                fetch('/api/contact-phones'),
                fetch('/api/apple-accounts'),
            ]);

            if (pmRes.ok) {
                const pmData = await pmRes.json();
                setPaymentMethods(pmData.data || []);
            }
            if (ceRes.ok) {
                const ceData = await ceRes.json();
                setContactEmails(ceData.data || []);
            }
            if (cpRes.ok) {
                const cpData = await cpRes.json();
                setContactPhones(cpData.data || []);
            }
            if (aaRes.ok) {
                const aaData = await aaRes.json();
                setAppleAccounts(aaData.data || []);
            }
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

    return (
        <>
            <Header />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">在庫登録</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ステータス */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 ステータス</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                現在のステータス
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => updateField('status', e.target.value as InventoryV2Status)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {INVENTORY_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {STATUS_V2_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <StatusProgressBar currentStatus={formData.status || 'ordered'} />
                    </div>

                    {/* 基本情報 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 基本情報</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    注文番号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.order_number}
                                    onChange={(e) => updateField('order_number', e.target.value)}
                                    placeholder="W1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    アイテム番号
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.item_index}
                                    onChange={(e) => updateField('item_index', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">機種名</label>
                                <input
                                    type="text"
                                    value={formData.model_name || ''}
                                    onChange={(e) => updateField('model_name', e.target.value)}
                                    placeholder="iPhone 17 Pro Max"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">容量</label>
                                <input
                                    type="text"
                                    value={formData.storage || ''}
                                    onChange={(e) => updateField('storage', e.target.value)}
                                    placeholder="256GB"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
                                <input
                                    type="text"
                                    value={formData.color || ''}
                                    onChange={(e) => updateField('color', e.target.value)}
                                    placeholder="コズミックオレンジ"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">仕入先</label>
                                <select
                                    value={formData.purchase_source || ''}
                                    onChange={(e) => updateField('purchase_source', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">選択してください</option>
                                    <option value="Apple Store">Apple Store</option>
                                    <option value="Amazon">Amazon</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">支払い方法</label>
                                <select
                                    value={formData.payment_method_id || ''}
                                    onChange={(e) => updateField('payment_method_id', e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">未選択</option>
                                    {paymentMethods.map((pm) => (
                                        <option key={pm.id} value={pm.id}>{pm.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">連絡先メール</label>
                                <select
                                    value={formData.contact_email_id || ''}
                                    onChange={(e) => updateField('contact_email_id', e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">未選択</option>
                                    {contactEmails.map((ce) => (
                                        <option key={ce.id} value={ce.id}>{ce.email}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">連絡先電話番号</label>
                                <select
                                    value={formData.contact_phone_id || ''}
                                    onChange={(e) => updateField('contact_phone_id', e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">未選択</option>
                                    {contactPhones.map((cp) => (
                                        <option key={cp.id} value={cp.id}>{cp.phone_number}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apple ID</label>
                                <select
                                    value={formData.apple_account_id || ''}
                                    onChange={(e) => updateField('apple_account_id', e.target.value || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">未選択</option>
                                    {appleAccounts.map((aa) => (
                                        <option key={aa.id} value={aa.id}>{aa.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 日付情報 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 日付情報</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">注文日</label>
                                <input
                                    type="date"
                                    value={formData.order_date || ''}
                                    onChange={(e) => updateField('order_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">納品日</label>
                                <input
                                    type="date"
                                    value={formData.delivered_at || ''}
                                    onChange={(e) => updateField('delivered_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">お届け予定日（開始）</label>
                                <input
                                    type="date"
                                    value={formData.expected_delivery_start || ''}
                                    onChange={(e) => updateField('expected_delivery_start', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">お届け予定日（終了）</label>
                                <input
                                    type="date"
                                    value={formData.expected_delivery_end || ''}
                                    onChange={(e) => updateField('expected_delivery_end', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">当初お届け予定日（開始）</label>
                                <input
                                    type="date"
                                    value={formData.original_delivery_start || ''}
                                    onChange={(e) => updateField('original_delivery_start', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">当初お届け予定日（終了）</label>
                                <input
                                    type="date"
                                    value={formData.original_delivery_end || ''}
                                    onChange={(e) => updateField('original_delivery_end', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appleからの配送情報 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Appleからの配送情報</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">配送業者</label>
                                <input
                                    type="text"
                                    value={formData.carrier || ''}
                                    onChange={(e) => updateField('carrier', e.target.value)}
                                    placeholder="ヤマト運輸"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">追跡番号</label>
                                <input
                                    type="text"
                                    value={formData.tracking_number || ''}
                                    onChange={(e) => updateField('tracking_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 価格情報 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 価格情報</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">仕入価格</label>
                                <input
                                    type="number"
                                    value={formData.purchase_price || ''}
                                    onChange={(e) => updateField('purchase_price', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="194800"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">予想売価</label>
                                <input
                                    type="number"
                                    value={formData.expected_price || ''}
                                    onChange={(e) => updateField('expected_price', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="203000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">実売価格</label>
                                <input
                                    type="number"
                                    value={formData.actual_price || ''}
                                    onChange={(e) => updateField('actual_price', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {(formData.sold_at || formData.paid_at) && (!formData.actual_price || formData.actual_price === 0) && (
                                    <p className="text-xs text-red-600 mt-1">※売却日・入金日に日付を入れる時は実売価格を記入してください</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 買取・販売情報 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚚 買取・販売情報</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">販売先</label>
                                <input
                                    type="text"
                                    value={formData.sold_to || ''}
                                    onChange={(e) => updateField('sold_to', e.target.value)}
                                    placeholder="モバイルミックス"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">買取発送日</label>
                                <input
                                    type="date"
                                    value={formData.shipped_to_buyer_at || ''}
                                    onChange={(e) => updateField('shipped_to_buyer_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">買取配送業者</label>
                                <input
                                    type="text"
                                    value={formData.buyer_carrier || ''}
                                    onChange={(e) => updateField('buyer_carrier', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">買取伝票番号</label>
                                <input
                                    type="text"
                                    value={formData.buyer_tracking_number || ''}
                                    onChange={(e) => updateField('buyer_tracking_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">売却日</label>
                                <input
                                    type="date"
                                    value={formData.sold_at || ''}
                                    onChange={(e) => updateField('sold_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">入金日</label>
                                <input
                                    type="date"
                                    value={formData.paid_at || ''}
                                    onChange={(e) => updateField('paid_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">領収書受領日</label>
                                <input
                                    type="date"
                                    value={formData.receipt_received_at || ''}
                                    onChange={(e) => updateField('receipt_received_at', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 備考 */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 備考</h2>

                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => updateField('notes', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="備考を入力..."
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? '登録中...' : '登録する'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
