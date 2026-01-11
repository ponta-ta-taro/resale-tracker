'use client';

import { useState } from 'react';
import {
    parseAppleOrderEmail,
    parseAppleShippingEmail,
    detectEmailType,
    formatDateForInput,
    normalizeModelName,
    ParsedShippingInfo
} from '@/lib/appleMailParser';
import { parsePdfFile } from '@/lib/pdfParser';
import { ParsedAppleOrder, Inventory } from '@/types';
import { useRouter } from 'next/navigation';

export default function AppleMailImporter() {
    const router = useRouter();
    const [emailText, setEmailText] = useState('');
    const [emailType, setEmailType] = useState<'order' | 'shipping' | 'unknown' | null>(null);
    const [parsedOrders, setParsedOrders] = useState<ParsedAppleOrder[]>([]);
    const [shippingInfo, setShippingInfo] = useState<ParsedShippingInfo | null>(null);
    const [foundInventory, setFoundInventory] = useState<Inventory | null>(null);
    const [processing, setProcessing] = useState<number[]>([]);
    const [error, setError] = useState('');

    // PDF-related state
    const [pdfData, setPdfData] = useState<{ orderNumber: string; serialNumber: string } | null>(null);
    const [pdfInventory, setPdfInventory] = useState<Inventory | null>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);

    const handleParse = async () => {
        setError('');
        setParsedOrders([]);
        setShippingInfo(null);
        setFoundInventory(null);
        setEmailType(null);

        try {
            const type = detectEmailType(emailText);
            setEmailType(type);

            if (type === 'order') {
                const orders = parseAppleOrderEmail(emailText);
                if (orders.length === 0) {
                    setError('注文情報を読み取れませんでした。メール本文を確認してください。');
                } else {
                    setParsedOrders(orders);
                }
            } else if (type === 'shipping') {
                const shipping = parseAppleShippingEmail(emailText);
                if (!shipping) {
                    setError('出荷情報を読み取れませんでした。メール本文を確認してください。');
                } else {
                    setShippingInfo(shipping);
                    // Search for existing inventory
                    try {
                        const response = await fetch(`/api/inventory/search?order_number=${shipping.orderNumber}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data) {
                                setFoundInventory(data);
                            } else {
                                setError(`注文番号 ${shipping.orderNumber} に該当する在庫が見つかりません。`);
                            }
                        }
                    } catch (err) {
                        console.error('Search error:', err);
                        setError('在庫の検索中にエラーが発生しました。');
                    }
                }
            } else {
                setError('認識できないメール形式です。Appleの注文確認メールまたは出荷通知メールを貼り付けてください。');
            }
        } catch (err) {
            setError('メールの解析中にエラーが発生しました。');
            console.error('Parse error:', err);
        }
    };

    const handleRegisterOrder = async (order: ParsedAppleOrder, index: number) => {
        setProcessing(prev => [...prev, index]);

        try {
            // Fetch expected price from price_history
            let expectedPrice: number | undefined = undefined;
            try {
                const priceResponse = await fetch(`/api/prices/latest`);
                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    const normalizedModel = normalizeModelName(order.modelName);
                    const matchingPrice = priceData.data?.find(
                        (p: any) => p.model_name === normalizedModel && p.storage === order.storage
                    );
                    if (matchingPrice) {
                        expectedPrice = matchingPrice.price;
                    }
                }
            } catch (error) {
                console.error('Error fetching expected price:', error);
            }

            const inventoryData = {
                model_name: normalizeModelName(order.modelName),
                storage: order.storage,
                color: order.color,
                status: 'ordered' as const,
                purchase_price: order.price,
                expected_price: expectedPrice,
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

    const handleUpdateShipping = async () => {
        if (!foundInventory || !shippingInfo) return;

        setProcessing([0]);

        try {
            const updateData = {
                status: 'shipped' as const,
                tracking_number: shippingInfo.trackingNumber,
                carrier: shippingInfo.carrier,
            };

            const response = await fetch(`/api/inventory/${foundInventory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) throw new Error('Failed to update inventory');

            alert('ステータスを出荷済みに更新しました');
            router.push('/inventory');
            router.refresh();
        } catch (err) {
            console.error('Update error:', err);
            alert('更新に失敗しました');
        } finally {
            setProcessing([]);
        }
    };

    const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingPdf(true);
        setError('');
        setPdfData(null);
        setPdfInventory(null);

        try {
            console.log('Starting PDF parsing for:', file.name);
            
            // Parse PDF on client side
            const result = await parsePdfFile(file);
            
            console.log('PDF parsing result:', result);

            if (!result.success) {
                setError(`PDFの解析に失敗しました: ${result.error}`);
                return;
            }

            // Show results even if only one field is found
            setPdfData({
                orderNumber: result.orderNumber,
                serialNumber: result.serialNumber,
            });
            
            if (!result.orderNumber && !result.serialNumber) {
                const rawTextPreview = result.rawText?.substring(0, 300) || '(テキストなし)';
                setError(`PDFから注文番号・シリアル番号を読み取れませんでした。\n抽出テキスト: ${rawTextPreview}...`);
                return;
            }

            // Search for existing inventory if order number is found
            if (result.orderNumber) {
                try {
                    const searchResponse = await fetch(`/api/inventory/search?order_number=${result.orderNumber}`);
                    if (searchResponse.ok) {
                        const inventory = await searchResponse.json();
                        if (inventory) {
                            setPdfInventory(inventory);
                        } else {
                            setError(`注文番号 ${result.orderNumber} に該当する在庫が見つかりません。先に注文メールから在庫を登録してください。`);
                        }
                    }
                } catch (err) {
                    console.error('Search error:', err);
                    setError('在庫の検索中にエラーが発生しました。');
                }
            } else {
                setError('注文番号が見つかりませんでした。シリアル番号のみ取得できました。');
            }
        } catch (err) {
            console.error('PDF upload error:', err);
            setError('PDFの解析中にエラーが発生しました。');
        } finally {
            setUploadingPdf(false);
        }
    };

    const handleUpdateSerialNumber = async () => {
        if (!pdfInventory || !pdfData) return;

        setProcessing([0]);

        try {
            const updateData = {
                serial_number: pdfData.serialNumber,
            };

            const response = await fetch(`/api/inventory/${pdfInventory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) throw new Error('Failed to update inventory');

            alert('シリアル番号を登録しました');
            router.push('/inventory');
            router.refresh();
        } catch (err) {
            console.error('Update error:', err);
            alert('更新に失敗しました');
        } finally {
            setProcessing([]);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Appleメールから登録</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    メール本文を貼り付け
                </label>
                <textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Appleからの注文確認メールまたは出荷通知メールの本文を貼り付けてください"
                />
            </div>

            <button
                onClick={handleParse}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4"
            >
                解析
            </button>

            {/* PDF Upload Section */}
            <div className="mb-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PDFから登録</h3>
                <label className="block">
                    <span className="sr-only">PDFファイルを選択</span>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-purple-50 file:text-purple-700
                            hover:file:bg-purple-100
                            disabled:opacity-50"
                    />
                </label>
                {uploadingPdf && (
                    <p className="text-sm text-gray-600 mt-2">PDFを解析中...</p>
                )}
            </div>

            {/* PDF Results */}
            {pdfData && (
                <div className="mb-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">PDF解析結果</h3>
                    <div className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                            <div><span className="font-medium">注文番号:</span> {pdfData.orderNumber}</div>
                            <div><span className="font-medium">シリアル番号:</span> {pdfData.serialNumber}</div>
                        </div>

                        {pdfInventory ? (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-900 font-medium mb-2">該当する在庫が見つかりました:</p>
                                    <p className="text-sm text-blue-800">
                                        {pdfInventory.model_name} {pdfInventory.storage} {pdfInventory.color}
                                    </p>
                                    {pdfInventory.serial_number && (
                                        <p className="text-sm text-blue-800">
                                            現在のシリアル番号: {pdfInventory.serial_number}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleUpdateSerialNumber}
                                    disabled={processing.length > 0}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                                >
                                    {processing.length > 0 ? '更新中...' : 'シリアル番号を登録'}
                                </button>
                            </>
                        ) : (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">該当する在庫が見つかりません</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Order Email Results */}
            {emailType === 'order' && parsedOrders.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">解析結果（注文メール）</h3>
                    {parsedOrders.map((order, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-4">
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div><span className="font-medium">注文番号:</span> {order.orderNumber}</div>
                                <div><span className="font-medium">注文日:</span> {order.orderDate}</div>
                                <div><span className="font-medium">機種:</span> {order.modelName}</div>
                                <div><span className="font-medium">容量:</span> {order.storage}</div>
                                <div><span className="font-medium">カラー:</span> {order.color}</div>
                                <div><span className="font-medium">価格:</span> ¥{order.price.toLocaleString()}</div>
                                <div><span className="font-medium">お届け予定:</span> {order.deliveryStart} – {order.deliveryEnd}</div>
                                <div><span className="font-medium">支払い:</span> {order.paymentCard}</div>
                            </div>
                            <button
                                onClick={() => handleRegisterOrder(order, index)}
                                disabled={processing.includes(index)}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {processing.includes(index) ? '登録中...' : '在庫に登録'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Shipping Email Results */}
            {emailType === 'shipping' && shippingInfo && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">解析結果（出荷メール）</h3>
                    <div className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                            <div><span className="font-medium">注文番号:</span> {shippingInfo.orderNumber}</div>
                            <div><span className="font-medium">配送業者:</span> {shippingInfo.carrier}</div>
                            <div className="col-span-2"><span className="font-medium">配送伝票番号:</span> {shippingInfo.trackingNumber}</div>
                        </div>

                        {foundInventory ? (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-900 font-medium mb-2">該当する在庫が見つかりました:</p>
                                    <p className="text-sm text-blue-800">
                                        {foundInventory.model_name} {foundInventory.storage} {foundInventory.color}
                                    </p>
                                    <p className="text-sm text-blue-800">
                                        現在のステータス: {foundInventory.status}
                                    </p>
                                </div>
                                <button
                                    onClick={handleUpdateShipping}
                                    disabled={processing.length > 0}
                                    className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400"
                                >
                                    {processing.length > 0 ? '更新中...' : 'ステータスを出荷済みに更新'}
                                </button>
                            </>
                        ) : (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">該当する在庫が見つかりません</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
