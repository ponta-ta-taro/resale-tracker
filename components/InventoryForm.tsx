'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryInput, InventoryStatus, STATUS_LABELS } from '@/types';

interface InventoryFormProps {
    initialData?: InventoryInput & { id?: string };
    mode: 'create' | 'edit';
}

const MODELS = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17'];
const STORAGES = ['128GB', '256GB', '512GB', '1TB'];

export default function InventoryForm({ initialData, mode }: InventoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        ordered_at: initialData?.ordered_at || '',
        arrived_at: initialData?.arrived_at || '',
        sold_at: initialData?.sold_at || '',
        paid_at: initialData?.paid_at || '',
        notes: initialData?.notes || '',
    });

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
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? undefined : value,
        }));
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

                {/* Ordered At */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        発注日
                    </label>
                    <input
                        type="date"
                        name="ordered_at"
                        value={formData.ordered_at || ''}
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
