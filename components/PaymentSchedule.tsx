'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PaymentScheduleItem {
    paymentMethodId: string;
    paymentMethodName: string;
    type: string;
    closingDay: number | null;
    paymentDay: number | null;
    paymentMonthOffset: number | null;
    creditLimit: number | null;
    currentMonthAmount: number;
    currentMonthCount: number;
    totalUsed: number;
    totalCount: number;
    nextPaymentDate: string | null;
}

export default function PaymentSchedule() {
    const [schedule, setSchedule] = useState<PaymentScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const response = await fetch('/api/payment-schedule');
            const result = await response.json();
            if (result.data) {
                setSchedule(result.data);
            }
        } catch (error) {
            console.error('Error fetching payment schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `¥${amount.toLocaleString()}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const getPaymentMonthLabel = (offset: number | null) => {
        if (offset === null) return '';
        if (offset === 0) return '当月';
        if (offset === 1) return '翌月';
        if (offset === 2) return '翌々月';
        return `${offset}ヶ月後`;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">支払いスケジュール</h2>
                <div className="text-center text-gray-500 py-4">読み込み中...</div>
            </div>
        );
    }

    // クレジットカードのみ表示（現金・デビットは即時払いなので表示不要）
    const creditCards = schedule.filter(s => s.type === 'credit');

    if (creditCards.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">支払いスケジュール</h2>
                    <Link
                        href="/settings"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        支払い方法を管理
                    </Link>
                </div>
                <div className="text-center text-gray-500 py-4">
                    <p>クレジットカードが登録されていません</p>
                    <Link href="/settings" className="text-blue-600 hover:underline mt-2 inline-block">
                        支払い方法を登録する
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">支払いスケジュール</h2>
                <Link
                    href="/settings"
                    className="text-sm text-blue-600 hover:underline"
                >
                    支払い方法を管理
                </Link>
            </div>

            <div className="space-y-4">
                {creditCards.map((card) => {
                    const availableCredit = card.creditLimit ? card.creditLimit - card.totalUsed : null;
                    const usageRate = card.creditLimit ? (card.totalUsed / card.creditLimit) * 100 : null;

                    return (
                        <div key={card.paymentMethodId} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{card.paymentMethodName}</h3>
                                    <p className="text-sm text-gray-500">
                                        {card.closingDay}日締め → {getPaymentMonthLabel(card.paymentMonthOffset)}{card.paymentDay}日払い
                                    </p>
                                </div>
                                {card.nextPaymentDate && (
                                    <div className="text-right">
                                        <span className="text-xs text-gray-500">次回支払日</span>
                                        <p className="font-semibold text-gray-900">{formatDate(card.nextPaymentDate)}</p>
                                    </div>
                                )}
                            </div>

                            {/* 今月締め分 */}
                            <div className="bg-blue-50 rounded-md p-3 mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-800">今期締め分（{card.currentMonthCount}件）</span>
                                    <span className="font-bold text-blue-900">{formatCurrency(card.currentMonthAmount)}</span>
                                </div>
                            </div>

                            {/* 利用状況 */}
                            {card.creditLimit && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">利用中</span>
                                        <span className="text-gray-900">{formatCurrency(card.totalUsed)} / {formatCurrency(card.creditLimit)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${usageRate && usageRate > 80 ? 'bg-red-500' :
                                                    usageRate && usageRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${Math.min(usageRate || 0, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">利用可能</span>
                                        <span className={`font-semibold ${availableCredit && availableCredit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(availableCredit || 0)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!card.creditLimit && (
                                <p className="text-sm text-gray-500">
                                    利用中: {formatCurrency(card.totalUsed)}（{card.totalCount}件）
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
