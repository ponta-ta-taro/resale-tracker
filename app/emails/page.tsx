'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { EmailLog, EMAIL_TYPES, PROCESS_RESULTS, EmailType } from '@/types';

export default function EmailsPage() {
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<EmailType | 'all'>('all');

    // Period presets
    type Period = '1week' | '1month' | '3months' | '1year' | 'all' | 'custom';
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('1month');

    // Custom date range state
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Calculate date range based on selected period
    const getDateRange = (period: Period): { startDate: string; endDate: string } => {
        // Use custom dates if custom period is selected
        if (period === 'custom') {
            return {
                startDate: customStartDate || '2000-01-01',
                endDate: customEndDate || new Date().toISOString().split('T')[0]
            };
        }

        const now = new Date();
        const endDate = now.toISOString().split('T')[0];

        let startDate: string;
        switch (period) {
            case '1week':
                const oneWeekAgo = new Date(now);
                oneWeekAgo.setDate(now.getDate() - 7);
                startDate = oneWeekAgo.toISOString().split('T')[0];
                break;
            case '1month':
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(now.getMonth() - 1);
                startDate = oneMonthAgo.toISOString().split('T')[0];
                break;
            case '3months':
                const threeMonthsAgo = new Date(now);
                threeMonthsAgo.setMonth(now.getMonth() - 3);
                startDate = threeMonthsAgo.toISOString().split('T')[0];
                break;
            case '1year':
                const oneYearAgo = new Date(now);
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                startDate = oneYearAgo.toISOString().split('T')[0];
                break;
            case 'all':
                startDate = '2000-01-01'; // Far past date to get all records
                break;
        }

        return { startDate, endDate };
    };

    useEffect(() => {
        fetchEmails();
    }, [selectedPeriod, selectedType, customStartDate, customEndDate]);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const { startDate, endDate } = getDateRange(selectedPeriod);
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
            });
            if (selectedType !== 'all') {
                params.append('email_type', selectedType);
            }

            const response = await fetch(`/api/emails?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setEmails(data);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getProcessResultColor = (result: string) => {
        switch (result) {
            case 'success':
                return 'bg-green-100 text-green-700';
            case 'skipped':
                return 'bg-yellow-100 text-yellow-700';
            case 'error':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading && emails.length === 0) {
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
                    <h1 className="text-3xl font-bold text-gray-900">メール履歴</h1>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                            {/* Period Presets */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    期間
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedPeriod('1week')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === '1week'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        1週間
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('1month')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === '1month'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        1ヶ月
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('3months')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === '3months'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        3ヶ月
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('1year')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === '1year'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        1年
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('all')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        全期間
                                    </button>
                                    <button
                                        onClick={() => setSelectedPeriod('custom')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === 'custom'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        カスタム
                                    </button>
                                </div>
                            </div>

                            {/* Email Type Filter */}
                            <div className="w-full md:w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    種類
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as EmailType | 'all')}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                >
                                    <option value="all">すべて</option>
                                    {Object.entries(EMAIL_TYPES).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Custom Date Range Inputs - Only show when custom is selected */}
                        {selectedPeriod === 'custom' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        開始日
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        onKeyDown={(e) => e.preventDefault()}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        終了日
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        onKeyDown={(e) => e.preventDefault()}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email List */}
                {emails.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">メール履歴がありません</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        受信日時
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        送信元
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        件名
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        種類
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        処理結果
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        備考
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {emails.map((email) => (
                                    <tr key={email.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDateTime(email.received_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {email.from_email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="max-w-md truncate" title={email.subject}>
                                                {email.subject}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {EMAIL_TYPES[email.email_type]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getProcessResultColor(email.process_result)}`}>
                                                {PROCESS_RESULTS[email.process_result]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="max-w-xs truncate" title={email.notes || ''}>
                                                {email.notes || '-'}
                                            </div>
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
