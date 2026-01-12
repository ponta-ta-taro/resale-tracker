'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryInput, InventoryStatus, STATUS_LABELS, SOLD_TO_OPTIONS, PURCHASE_SOURCE_OPTIONS, PaymentMethod, AppleAccount } from '@/types';

interface InventoryFormProps {
    initialData?: InventoryInput & { id?: string };
    mode: 'create' | 'edit';
}

const MODELS = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17'];
const STORAGES = ['128GB', '256GB', '512GB', '1TB'];
const CARRIERS = ['ヤマト運輸', '佐川急便', '日本郵便', 'その他'];

export default function InventoryForm({ initialData, mode }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [appleAccounts, setAppleAccounts] = useState<AppleAccount[]>([]);
    const [formData, setFormData] = useState<InventoryInput>({
        model_name: initialData?.model_name || '',
        storage: initialData?.storage || '',
        color: initialData?.color || '',
        status: initialData?.status || 'ordered',
        purchase_price: initialData?.purchase_price || undefined,
        expected_price: initialData?.expected_price || undefined,
        actual_price: initialData?.actual_price || undefined,
        purchase_source: initialData?.purchase_source || '',
        arrived_at: initialData?.arrived_at || '',
        sold_at: initialData?.sold_at || '',
        paid_at: initialData?.paid_at || '',
        notes: initialData?.notes || '',
        order_number: initialData?.order_number || '',
        order_date: initialData?.order_date || '',
        expected_delivery_start: initialData?.expected_delivery_start || '',
        expected_delivery_end: initialData?.expected_delivery_end || '',
        payment_card: initialData?.payment_card || '',
        sold_to: initialData?.sold_to || '',
        tracking_number: initialData?.tracking_number || '',
        carrier: initialData?.carrier || '',
        payment_method_id: initialData?.payment_method_id || '',
        apple_id_used: initialData?.apple_id_used || '',
    });

    // Fetch payment methods and apple accounts on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [pmRes, aaRes] = await Promise.all([
                    fetch('/api/payment-methods'),
                    fetch('/api/apple-accounts'),
                ]);
                
                const pmData = await pmRes.json();
                const aaData = await aaRes.json();
                
                if (pmData.data) {
                    setPaymentMethods(pmData.data.filter((pm: PaymentMethod) => pm.is_active));
                }
                if (aaData.data) {
                    setAppleAccounts(aaData.data);
                }
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
    }, []);

    // Auto-fill expected price from price_history when model and storage are selected
    useEffect(() => {
        const fetchExpectedPrice = async () => {
            if (formData.model_name && formData.storage && !formData.expected_price) {
                try {
                    const response = await fetch(`/api/price-history?model=${encodeURIComponent(formData.model_name)}&storage=${encodeURIComponent(formData.storage)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.length > 0) {
                            const latestPrice = data[0].price;
                            setFormData(prev => ({ ...prev, expected_price: latestPrice }));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching expected price:', error);
                }
            }
        };
        fetchExpectedPrice();
    }, [formData.model_name, formData.storage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = mode === 'create'
                ? '/api/inventory'
                : `/api/inventory/${initialData?.id}`;

            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(errorData.details || errorData.error || 'Failed to save inventory');
            }

            router.push('/inventory');
            router.refresh();
        } catch (error) {
            console.error('Error saving inventory:', error);
            const message = error instanceof Error ? error.message : '不明なエラー';
            alert(`保存に失敗しました: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        const numericFields = ['purchase_price', 'expected_price', 'actual_price'];
        if (numericFields.includes(name)) {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? undefined : Number(value),
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? undefined : value,
            }));
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const sectionClass = "pb-6 mb-6 border-b border-gray-200";
    const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-4";

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            {/* 基本情報 */}
            <div className={sectionClass}>
                <h3 className={sectionTitleClass}>📦 基本情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Row 1 */}
                    <div>
                        <label className={labelClass}>
                            機種 <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="model_name"
                            value={formData.model_name}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {MODELS.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>
                            容量 <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="storage"
                            value={formData.storage}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {STORAGES.map(storage => (
                                <option key={storage} value={storage}>{storage}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>カラー</label>
                        <input
                            type="text"
                            name="color"
                            value={formData.color || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Row 2 */}
                    <div>
                        <label className={labelClass}>
                            ステータス <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                            className={inputClass}
                        >
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>仕入先</label>
                        <select
                            name="purchase_source"
                            value={formData.purchase_source || ''}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {PURCHASE_SOURCE_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>注文番号</label>
                        <input
                            type="text"
                            name="order_number"
                            value={formData.order_number || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Row 3 */}
                    <div>
                        <label className={labelClass}>💳 支払い方法</label>
                        <select
                            name="payment_method_id"
                            value={formData.payment_method_id || ''}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {paymentMethods.map(pm => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                            ))}
                        </select>
                        {paymentMethods.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                <a href="/settings" className="text-blue-600 hover:underline">設定</a>で登録
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>🍎 購入Apple ID</label>
                        <select
                            name="apple_id_used"
                            value={formData.apple_id_used || ''}
                            onChange={(e) => {
                                const selectedAccount = appleAccounts.find(aa => aa.name === e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    apple_id_used: selectedAccount ? selectedAccount.name : e.target.value,
                                }));
                            }}
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {appleAccounts.map(aa => (
                                <option key={aa.id} value={aa.name}>{aa.name} ({aa.email})</option>
                            ))}
                        </select>
                        {appleAccounts.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                <a href="/apple-accounts" className="text-blue-600 hover:underline">Apple ID管理</a>で登録
                            </p>
                        )}
                    </div>
                    <div></div>
                </div>
            </div>

            {/* 日付情報 */}
            <div className={sectionClass}>
                <h3 className={sectionTitleClass}>📅 日付情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Row 1 */}
                    <div>
                        <label className={labelClass}>注文日</label>
                        <input
                            type="date"
                            name="order_date"
                            value={formData.order_date || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>お届け予定日（開始）</label>
                        <input
                            type="date"
                            name="expected_delivery_start"
                            value={formData.expected_delivery_start || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>お届け予定日（終了）</label>
                        <input
                            type="date"
                            name="expected_delivery_end"
                            value={formData.expected_delivery_end || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>

                    {/* Row 2 */}
                    <div>
                        <label className={labelClass}>納品日</label>
                        <input
                            type="date"
                            name="arrived_at"
                            value={formData.arrived_at || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>売却日</label>
                        <input
                            type="date"
                            name="sold_at"
                            value={formData.sold_at || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>入金日</label>
                        <input
                            type="date"
                            name="paid_at"
                            value={formData.paid_at || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* 価格情報 */}
            <div className={sectionClass}>
                <h3 className={sectionTitleClass}>💰 価格情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>仕入価格</label>
                        <input
                            type="number"
                            name="purchase_price"
                            value={formData.purchase_price || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>予想売価（注文時）</label>
                        <input
                            type="number"
                            name="expected_price"
                            value={formData.expected_price || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>実売価格</label>
                        <input
                            type="number"
                            name="actual_price"
                            value={formData.actual_price || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* 販売・配送情報 */}
            <div className={sectionClass}>
                <h3 className={sectionTitleClass}>🚚 販売・配送情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>販売先</label>
                        <select
                            name="sold_to"
                            value={formData.sold_to || ''}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {SOLD_TO_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>配送業者</label>
                        <select
                            name="carrier"
                            value={formData.carrier || ''}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">選択してください</option>
                            {CARRIERS.map(carrier => (
                                <option key={carrier} value={carrier}>{carrier}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>配送伝票番号</label>
                        <input
                            type="text"
                            name="tracking_number"
                            value={formData.tracking_number || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* メモ */}
            <div className="pb-6">
                <h3 className={sectionTitleClass}>📝 その他</h3>
                <div>
                    <label className={labelClass}>備考</label>
                    <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? '保存中...' : mode === 'create' ? '登録' : '更新'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                    キャンセル
                </button>
            </div>
        </form>
    );
}
