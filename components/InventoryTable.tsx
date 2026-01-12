'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Inventory, STATUS_LABELS, STATUS_COLORS, calculateProfit, calculateProfitRate } from '@/types';

interface InventoryTableProps {
    items: Inventory[];
}

interface MarketPrice {
    model_name: string;
    storage: string;
    price: number;
}

export default function InventoryTable({ items }: InventoryTableProps) {
    const [marketPrices, setMarketPrices] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        fetchMarketPrices();
    }, []);

    const fetchMarketPrices = async () => {
        try {
            const response = await fetch('/api/prices/latest');
            if (response.ok) {
                const data = await response.json();
                const priceMap = new Map<string, number>();
                data.data?.forEach((item: MarketPrice) => {
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

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ja-JP');
    };

    const formatProfit = (item: Inventory) => {
        const profit = calculateProfit(item.purchase_price, item.actual_price);
        if (profit === null) return '-';
        const rate = calculateProfitRate(item.purchase_price, item.actual_price);
        const rateStr = rate !== null ? ` (${rate.toFixed(1)}%)` : '';
        const color = profit >= 0 ? 'text-green-600' : 'text-red-600';
        return <span className={color}>{formatCurrency(profit)}{rateStr}</span>;
    };

    const formatExpectedProfit = (item: Inventory) => {
        const currentPrice = getCurrentMarketPrice(item);
        if (currentPrice === null || item.purchase_price === null) return '-';
        const profit = currentPrice - item.purchase_price;
        const rate = (profit / item.purchase_price) * 100;
        const color = profit >= 0 ? 'text-green-600' : 'text-red-600';
        return <span className={color}>{formatCurrency(profit)} ({rate.toFixed(1)}%)</span>;
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            機種
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            容量
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            仕入価格
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            注文時予想売価
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            現在の相場
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            想定利益(現在)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            実売価格
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            利益
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            注文日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                                在庫データがありません
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.model_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.storage}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex items-center justify-center text-sm font-medium rounded-full ${STATUS_COLORS[item.status]}`}>
                                        {STATUS_LABELS[item.status]}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(item.purchase_price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(item.expected_price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(getCurrentMarketPrice(item))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {formatExpectedProfit(item)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(item.actual_price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {formatProfit(item)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(item.order_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link
                                        href={`/inventory/${item.id}`}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        詳細
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
