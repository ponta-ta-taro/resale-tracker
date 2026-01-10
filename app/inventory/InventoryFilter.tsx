'use client';

import { InventoryStatus, STATUS_LABELS } from '@/types';

interface InventoryFilterProps {
    selectedStatus: InventoryStatus | 'all';
    selectedModel: string;
    onStatusChange: (status: InventoryStatus | 'all') => void;
    onModelChange: (model: string) => void;
}

const MODELS = ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17'];

export default function InventoryFilter({
    selectedStatus,
    selectedModel,
    onStatusChange,
    onModelChange,
}: InventoryFilterProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ステータス
                    </label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => onStatusChange(e.target.value as InventoryStatus | 'all')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">すべて</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Model Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        機種
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">すべて</option>
                        {MODELS.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
