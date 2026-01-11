'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryInput, InventoryStatus, STATUS_LABELS, SOLD_TO_OPTIONS, PaymentMethod } from '@/types';

interface InventoryFormProps {
    initialData?: InventoryInput & { id?: string };
    mode: 'create' | 'edit';
}

const MODELS = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17'];
const STORAGES = ['128GB', '256GB', '512GB', '1TB'];

export default function InventoryForm({ initialData, mode }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [formData, setFormData] = useState<InventoryInput>({
        model_name: initialData?.model_name || '',
        storage: initialData?.storage || '',
        color: initialData?.color || '',
        imei: initialData?.imei || '',
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
        serial_number: initialData?.serial_number || '',
    });

    // Fetch payment methods on mount
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await fetch('/api/payment-methods');
                const result = await response.json();
                if (result.data) {
                    // Filter to only active payment methods
                    setPaymentMethods(result.data.filter((pm: PaymentMethod) => pm.is_active));
                }
            } catch (error) {
                console.error('Error fetching payment methods:', error);
            }
        };
        fetchPaymentMethods();
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
                            // Get the most recent price
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

            if (!response.ok) throw new Error('Failed to save inventory');

            router.push('/inventory');
            router.refresh();
        } catch (error) {
            console.error('Error saving inventory:', error);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        // Handle numeric fields
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Model Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        機種 <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="model_name"
                        value={formData.model_name}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">選択してください</option>
                        {MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                {/* Storage */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        容量 <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="storage"
                        value={formData.storage}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">選択してください</option>
                        {STORAGES.map(storage => (
                            <option key={storage} value={storage}>{storage}</option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        カラー
                    </label>
                    <input
                        type="text"
                        name="color"
                        value={formData.color || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* IMEI */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        IMEI
                    </label>
                    <input
                        type="text"
                        name="imei"
                        value={formData.imei || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ステータス <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Purchase Source */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        仕入先
                    </label>
                    <input
                        type="text"
                        name="purchase_source"
                        value={formData.purchase_source || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Order Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        注文番号
                    </label>
                    <input
                        type="text"
                        name="order_number"
                        value={formData.order_number || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Order Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        注文日
                    </label>
                    <input
                        type="date"
                        name="order_date"
                        value={formData.order_date || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        支払い方法
                    </label>
                    <select
                        name="payment_card"
                        value={formData.payment_card || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">選択してください</option>
                        {paymentMethods.map(pm => (
                            <option key={pm.id} value={pm.name}>{pm.name}</option>
                        ))}
                    </select>
                    {paymentMethods.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            <a href="/payment-methods" className="text-blue-600 hover:underline">支払い方法を登録</a>してください
                        </p>
                    )}
                </div>

                {/* Sold To */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        販売先
                    </label>
                    <select
                        name="sold_to"
                        value={formData.sold_to || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">選択してください</option>
                        {SOLD_TO_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                {/* Carrier */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        配送業者
                    </label>
                    <select
                        name="carrier"
                        value={formData.carrier || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">選択してください</option>
                        <option value="ヤマト運輸">ヤマト運輸</option>
                        <option value="佐川急便">佐川急便</option>
                        <option value="日本郵便">日本郵便</option>
                        <option value="その他">その他</option>
                    </select>
                </div>

                {/* Tracking Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        配送伝票番号
                    </label>
                    <input
                        type="text"
                        name="tracking_number"
                        value={formData.tracking_number || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Serial Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        シリアル番号
                    </label>
                    <input
                        type="text"
                        name="serial_number"
                        value={formData.serial_number || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Purchase Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        仕入価格
                    </label>
                    <input
                        type="number"
                        name="purchase_price"
                        value={formData.purchase_price || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Expected Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        予想売価
                    </label>
                    <input
                        type="number"
                        name="expected_price"
                        value={formData.expected_price || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Actual Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        実売価格
                    </label>
                    <input
                        type="number"
                        name="actual_price"
                        value={formData.actual_price || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Expected Delivery Start */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        お届け予定日・開始
                    </label>
                    <input
                        type="date"
                        name="expected_delivery_start"
                        value={formData.expected_delivery_start || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Expected Delivery End */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        お届け予定日・終了
                    </label>
                    <input
                        type="date"
                        name="expected_delivery_end"
                        value={formData.expected_delivery_end || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>



                {/* Arrived At */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        納品日
                    </label>
                    <input
                        type="date"
                        name="arrived_at"
                        value={formData.arrived_at || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Sold At */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        売却日
                    </label>
                    <input
                        type="date"
                        name="sold_at"
                        value={formData.sold_at || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Paid At */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        入金日
                    </label>
                    <input
                        type="date"
                        name="paid_at"
                        value={formData.paid_at || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    備考
                </label>
                <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
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
