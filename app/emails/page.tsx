'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import type { EmailLog, EmailLogType, EmailLogStatus } from '@/types';
import { EMAIL_LOG_TYPES, EMAIL_LOG_STATUSES, EMAIL_LOG_STATUS_COLORS } from '@/types';

export default function EmailsPage() {
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<EmailLogType | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<EmailLogStatus | 'all'>('all');
    const [selectedDays, setSelectedDays] = useState<number>(7);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [showRawModal, setShowRawModal] = useState(false);
    const [showParsedModal, setShowParsedModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

    useEffect(() => {
        fetchEmails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedType, selectedStatus, selectedDays]);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                days: selectedDays.toString(),
            });
            if (selectedType !== 'all') {
                params.append('email_type', selectedType);
            }
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            const response = await fetch(`/api/email-logs?${params.toString()}`);
            if (response.ok) {
                const json = await response.json();
                setEmails(json.data || []);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const openRawModal = (email: EmailLog) => {
        setSelectedEmail(email);
        setShowRawModal(true);
    };

    const openParsedModal = (email: EmailLog) => {
        setSelectedEmail(email);
        setShowParsedModal(true);
    };

    return (
        <>
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">メール履歴</h1>
                    <button
                        onClick={fetchEmails}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        更新
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="space-y-4">
                        {/* Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                期間
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedDays(1)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedDays === 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    今日
                                </button>
                                <button
                                    onClick={() => setSelectedDays(7)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedDays === 7
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    7日
                                </button>
                                <button
                                    onClick={() => setSelectedDays(30)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedDays === 30
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    30日
                                </button>
                                <button
                                    onClick={() => setSelectedDays(365)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedDays === 365
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    全期間
                                </button>
                            </div>
                        </div>

                        {/* Type and Status Filters */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    種類
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as EmailLogType | 'all')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="all">全て</option>
                                    {Object.entries(EMAIL_LOG_TYPES).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    結果
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value as EmailLogStatus | 'all')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="all">全て</option>
                                    {Object.entries(EMAIL_LOG_STATUSES).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">読み込み中...</div>
                    ) : emails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            該当するメールがありません
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            受信日時
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            受信アドレス
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            件名
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            種類
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            結果
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                            注文番号
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {emails.map((email) => (
                                        <>
                                            <tr
                                                key={email.id}
                                                onClick={() => toggleRow(email.id)}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="mr-2">
                                                        {expandedRows.has(email.id) ? '▼' : '▶'}
                                                    </span>
                                                    {formatDateTime(email.received_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {email.sender || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="max-w-md truncate" title={email.subject || ''}>
                                                        {email.subject || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {EMAIL_LOG_TYPES[email.email_type]}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${EMAIL_LOG_STATUS_COLORS[email.status]}`}>
                                                        {EMAIL_LOG_STATUSES[email.status]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {email.order_number || '-'}
                                                </td>
                                            </tr>
                                            {expandedRows.has(email.id) && (
                                                <tr key={`${email.id}-details`}>
                                                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                        <div className="space-y-3">
                                                            {/* Error message or processing info */}
                                                            {email.status === 'error' && email.error_message && (
                                                                <div className="text-sm text-red-600">
                                                                    <span className="font-medium">エラー:</span> {email.error_message}
                                                                </div>
                                                            )}
                                                            {email.status === 'success' && (
                                                                <div className="text-sm text-green-600">
                                                                    <span className="font-medium">処理内容:</span> メールを正常に処理しました
                                                                </div>
                                                            )}
                                                            {email.status === 'skipped' && (
                                                                <div className="text-sm text-gray-600">
                                                                    <span className="font-medium">処理内容:</span> このメールはスキップされました
                                                                </div>
                                                            )}

                                                            {/* Inventory link */}
                                                            {email.parsed_data?.inventory_id && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium text-gray-700">在庫:</span>{' '}
                                                                    <Link
                                                                        href={`/inventory/${email.parsed_data.inventory_id}`}
                                                                        className="text-blue-600 hover:text-blue-800 underline"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        在庫詳細を見る
                                                                    </Link>
                                                                </div>
                                                            )}

                                                            {/* Action buttons */}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openRawModal(email);
                                                                    }}
                                                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                                >
                                                                    生メールを表示
                                                                </button>
                                                                {email.parsed_data && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openParsedModal(email);
                                                                        }}
                                                                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                                                    >
                                                                        パース結果を表示
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Raw Email Modal */}
            {showRawModal && selectedEmail && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowRawModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">生メール内容</h2>
                            <button
                                onClick={() => setShowRawModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                {selectedEmail.raw_content || 'メール内容がありません'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Parsed Data Modal */}
            {showParsedModal && selectedEmail && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowParsedModal(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">パース結果</h2>
                            <button
                                onClick={() => setShowParsedModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                {JSON.stringify(selectedEmail.parsed_data, null, 2) || 'パース結果がありません'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
