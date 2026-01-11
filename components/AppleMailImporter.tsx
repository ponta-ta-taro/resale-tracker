'use client';

import { useState } from 'react';
import { parseAppleOrderEmail, formatDateForInput, normalizeModelName } from '@/lib/appleMailParser';
import { ParsedAppleOrder } from '@/types';
import { useRouter } from 'next/navigation';

export default function AppleMailImporter() {
    const router = useRouter();
    const [emailText, setEmailText] = useState('');
    const [parsedOrders, setParsedOrders] = useState<ParsedAppleOrder[]>([]);
    const [processing, setProcessing] = useState<number[]>([]);
    const [error, setError] = useState('');

    const handleParse = () => {
        setError('');
        try {
            const orders = parseAppleOrderEmail(emailText);
            if (orders.length === 0) {
                setError('注文情報を読み取れませんでした。メール本文を確認してください。');
            } else {
                setParsedOrders(orders);
            }
        } catch (err) {
            setError('メールの解析中にエラーが発生しました。');
            console.error('Parse error:', err);
        }
    };

    const handleRegister = async (order: ParsedAppleOrder, index: number) => {
        setProcessing(prev => [...prev, index]);

        try {
            const inventoryData = {
                model_name: normalizeModelName(order.modelName),
                storage: order.storage,
                color: order.color,
                status: 'ordered' as const,
                purchase_price: order.price,
                order_number: order.orderNumber,
                order_date: formatDateForInput(order.orderDate),
                expected_delivery_start: formatDateForInput(order.deliveryStart),
                expected_delivery_end: formatDateForInput(order.deliveryEnd),
                payment_card: order.paymentCard,
            };

            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventoryData),
            });

            if (!response.ok) throw new Error('Failed to register inventory');

            // Remove from parsed orders
            setParsedOrders(prev => prev.filter((_, i) => i !== index));

            // If all registered, redirect to inventory list
            if (parsedOrders.length === 1) {
                router.push('/inventory');
                router.refresh();
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert('登録に失敗しました');
        } finally {
            setProcessing(prev => prev.filter(i => i !== index));
        }
    };

    const handleSkip = (index: number) => {
        setParsedOrders(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📧 Appleメールから自動入力</h3>

            {parsedOrders.length === 0 ? (
                <div>
                    <p className="text-sm text-gray-600 mb-3">
                        Appleの注文確認メール本文を貼り付けてください。複数製品がある場合は自動で検出します。
                    </p>
                    <textarea
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        placeholder="メール本文をここに貼り付け..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                    {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handleParse}
                        disabled={!emailText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        読み取る
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        {parsedOrders.length}件の製品が見つかりました。各製品を登録またはスキップしてください。
                    </p>
                    {parsedOrders.map((order, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                <div>
                                    <span className="text-gray-500">注文番号:</span>
                                    <span className="ml-2 font-medium">{order.orderNumber}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">注文日:</span>
                                    <span className="ml-2 font-medium">{order.orderDate}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">機種:</span>
                                    <span className="ml-2 font-medium">{normalizeModelName(order.modelName)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">容量:</span>
                                    <span className="ml-2 font-medium">{order.storage}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">カラー:</span>
                                    <span className="ml-2 font-medium">{order.color}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">金額:</span>
                                    <span className="ml-2 font-medium">¥{order.price.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">お届け予定:</span>
                                    <span className="ml-2 font-medium">{order.deliveryStart} – {order.deliveryEnd}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">支払い:</span>
                                    <span className="ml-2 font-medium">{order.paymentCard}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleRegister(order, index)}
                                    disabled={processing.includes(index)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {processing.includes(index) ? '登録中...' : '登録する'}
                                </button>
                                <button
                                    onClick={() => handleSkip(index)}
                                    disabled={processing.includes(index)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    スキップ
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            setParsedOrders([]);
                            setEmailText('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        ← 戻る
                    </button>
                </div>
            )}
        </div>
    );
}
