'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { Reward, REWARD_TYPES } from '@/types';

export default function RewardsPage() {
    const router = useRouter();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [summary, setSummary] = useState({
        gift_card_total: 0,
        credit_points_total: 0,
        credit_points_value: 0,
        total: 0,
    });

    useEffect(() => {
        // Set current month as default
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
    }, []);

    useEffect(() => {
        if (selectedMonth) {
            fetchRewards();
            fetchSummary();
        }
    }, [selectedMonth]);

    const fetchRewards = async () => {
        try {
            const response = await fetch(`/api/rewards?month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setRewards(data);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetch(`/api/rewards/summary?month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('このポイント・特典を削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/rewards/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchRewards();
                fetchSummary();
            }
        } catch (error) {
            console.error('Error deleting reward:', error);
        }
    };

    const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

    const formatRewardValue = (reward: Reward) => {
        if (reward.type === 'gift_card') {
            return formatCurrency(reward.amount || 0);
        } else {
            const value = (reward.points || 0) * (reward.point_rate || 0);
            return `${(reward.points || 0).toLocaleString()}pt (${formatCurrency(Math.round(value))})`;
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
                    <h1 className="text-3xl font-bold text-gray-900">ポイント管理</h1>
                    <Link
                        href="/rewards/new"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        新規登録
                    </Link>
                </div>

                {/* Month Filter */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        表示月
                    </label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">ギフトカード還元</h3>
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.gift_card_total)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">クレカポイント</h3>
                        <p className="text-3xl font-bold text-purple-600">{formatCurrency(summary.credit_points_value)}</p>
                        <p className="text-sm text-gray-600 mt-1">{summary.credit_points_total.toLocaleString()}pt</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">合計</h3>
                        <p className="text-3xl font-bold text-blue-600">{formatCurrency(summary.total)}</p>
                    </div>
                </div>

                {/* Rewards Table */}
                {rewards.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">ポイント・特典データがありません</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        獲得日
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        種類
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        説明
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        金額/ポイント
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rewards.map((reward) => (
                                    <tr key={reward.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(reward.earned_at).toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {REWARD_TYPES[reward.type]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {reward.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatRewardValue(reward)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <Link
                                                href={`/rewards/${reward.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(reward.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
