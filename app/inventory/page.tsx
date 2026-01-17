'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import InventoryTable from '@/components/InventoryTable';
import InventoryFilter from './InventoryFilter';
import { Inventory, InventoryStatus } from '@/types';

type SortColumn = 'status' | 'purchase_price' | 'order_date' | 'expected_profit';
type SortDirection = 'asc' | 'desc';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<InventoryStatus | 'all'>('all');
    const [selectedModel, setSelectedModel] = useState('');
    const [sortColumn, setSortColumn] = useState<SortColumn>('order_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [marketPrices, setMarketPrices] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        fetchInventory();
        fetchMarketPrices();
    }, []);

    useEffect(() => {
        filterAndSortInventory();
    }, [inventory, selectedStatus, selectedModel, sortColumn, sortDirection, marketPrices]);

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

    const fetchMarketPrices = async () => {
        try {
            const response = await fetch('/api/prices/latest');
            if (response.ok) {
                const data = await response.json();
                const priceMap = new Map<string, number>();
                data.data?.forEach((item: any) => {
                    const key = `${item.model_name}_${item.storage}`;
                    priceMap.set(key, item.price);
                });
                setMarketPrices(priceMap);
            }
        } catch (error) {
            console.error('Error fetching market prices:', error);
        }
    };

    const getCurrentMarketPrice = (item: Inventory): number | null => {
        const key = `${item.model_name}_${item.storage}`;
        return marketPrices.get(key) ?? null;
    };

    const getExpectedProfit = (item: Inventory): number | null => {
        const currentPrice = getCurrentMarketPrice(item);
        if (currentPrice === null || item.purchase_price === null) return null;
        return currentPrice - item.purchase_price;
    };

    const filterAndSortInventory = () => {
        let filtered = [...inventory];

        // Filter
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(item => item.status === selectedStatus);
        }

        if (selectedModel) {
            filtered = filtered.filter(item => item.model_name === selectedModel);
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortColumn) {
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'purchase_price':
                    const priceA = a.purchase_price ?? 0;
                    const priceB = b.purchase_price ?? 0;
                    comparison = priceA - priceB;
                    break;
                case 'order_date':
                    const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
                    const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                case 'expected_profit':
                    const profitA = getExpectedProfit(a) ?? 0;
                    const profitB = getExpectedProfit(b) ?? 0;
                    comparison = profitA - profitB;
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredInventory(filtered);
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
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
                    <InventoryTable
                        items={filteredInventory}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />
                </div>
            </div>
        </>
    );
}
