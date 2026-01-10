'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import InventoryTable from '@/components/InventoryTable';
import InventoryFilter from './InventoryFilter';
import { Inventory, InventoryStatus } from '@/types';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<InventoryStatus | 'all'>('all');
    const [selectedModel, setSelectedModel] = useState('');

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        filterInventory();
    }, [inventory, selectedStatus, selectedModel]);

    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/inventory');
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterInventory = () => {
        let filtered = [...inventory];

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(item => item.status === selectedStatus);
        }

        if (selectedModel) {
            filtered = filtered.filter(item => item.model_name === selectedModel);
        }

        setFilteredInventory(filtered);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">在庫管理</h1>
                <Link
                    href="/inventory/new"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    新規登録
                </Link>
            </div>

            <InventoryFilter
                selectedStatus={selectedStatus}
                selectedModel={selectedModel}
                onStatusChange={setSelectedStatus}
                onModelChange={setSelectedModel}
            />

            <div className="bg-white rounded-lg shadow">
                <InventoryTable items={filteredInventory} />
            </div>
        </div>
    );
}
