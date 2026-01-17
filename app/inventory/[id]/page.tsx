'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import InventoryForm from '@/components/InventoryForm';
import { Inventory, STATUS_LABELS, STATUS_COLORS_DETAIL, calculateProfit, calculateProfitRate, Reward, REWARD_TYPES, EmailLog, EMAIL_TYPES } from '@/types';

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [currentMarketPrice, setCurrentMarketPrice] = useState<number | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchInventory();
        fetchRewards();
        fetchEmails();
    }, [params.id]);

    const fetchInventory = async () => {
        try {
            const response = await fetch(`/api/inventory/${params.id}`);
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setInventory(data);

            // Fetch current market price
            try {
                const priceResponse = await fetch('/api/prices/latest');
                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    const matchingPrice = priceData.data?.find(
                        (p: any) => p.model_name === data.model_name && p.storage === data.storage
                    );
                    if (matchingPrice) {
                        setCurrentMarketPrice(matchingPrice.price);
                    }
                }
            } catch (error) {
                console.error('Error fetching market price:', error);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRewards = async () => {
        try {
            const response = await fetch(`/api/rewards`);
            if (response.ok) {
                const data = await response.json();
                const linkedRewards = data.filter((r: Reward) => r.inventory_id === params.id);
                setRewards(linkedRewards);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        }
    };

    const fetchEmails = async () => {
        try {
            const response = await fetch(`/api/emails`);
            if (response.ok) {
                const data = await response.json();
                const linkedEmails = data.filter((e: EmailLog) => e.inventory_id === params.id);
                setEmails(linkedEmails);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('本当に削除しますか？')) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/inventory/${params.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete inventory');

            router.push('/inventory');
            router.refresh();
        } catch (error) {
            console.error('Error deleting inventory:', error);
            alert('削除に失敗しました');
        } finally {
            setDeleting(false);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '-';
        return `¥${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ja-JP');
    };

    const getPriceChange = () => {
        if (!inventory?.expected_price || !currentMarketPrice) return null;
        return currentMarketPrice - inventory.expected_price;
    };

    const getExpectedProfitAtOrder = () => {
        if (!inventory?.expected_price || !inventory?.purchase_price) return null;
        return inventory.expected_price - inventory.purchase_price;
    };

    const getExpectedProfitCurrent = () => {
        if (!currentMarketPrice || !inventory?.purchase_price) return null;
        return currentMarketPrice - inventory.purchase_price;
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

    if (!inventory) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-gray-600">在庫が見つかりません</div>
                </div>
            </>
        );
    }

    const profit = calculateProfit(inventory.purchase_price, inventory.actual_price);
    const profitRate = calculateProfitRate(inventory.purchase_price, inventory.actual_price);

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">在庫詳細</h1>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {deleting ? '削除中...' : '削除'}
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">ステータス</h3>
                            <span className={`px-4 py-2 inline-flex items-center text-base font-semibold rounded-lg border-2 ${STATUS_COLORS_DETAIL[inventory.status]}`}>
                                {STATUS_LABELS[inventory.status]}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">機種</h3>
                            <p className="text-lg font-semibold text-gray-900">{inventory.model_name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">容量</h3>
                            <p className="text-lg font-semibold text-gray-900">{inventory.storage}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">利益</h3>
                            <p className={`text-lg font-semibold ${profit !== null && profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(profit)}
                                {profitRate !== null && ` (${profitRate.toFixed(1)}%)`}
                            </p>
                        </div>
                    </div>

                    {/* Price Analysis Section */}
                    <div className="mt-8 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">価格分析</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">仕入価格</h4>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(inventory.purchase_price)}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">注文時の予想売価</h4>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(inventory.expected_price)}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">現在の相場</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(currentMarketPrice)}</p>
                                    {(() => {
                                        const priceChange = getPriceChange();
                                        if (priceChange === null) return null;
                                        const isPositive = priceChange >= 0;
                                        return (
                                            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPositive ? '↑' : '↓'} {formatCurrency(Math.abs(priceChange))}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">実売価格</h4>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(inventory.actual_price)}</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-900 mb-1">想定利益（注文時）</h4>
                                {(() => {
                                    const profit = getExpectedProfitAtOrder();
                                    if (profit === null) return <p className="text-lg font-semibold text-blue-900">-</p>;
                                    const isPositive = profit >= 0;
                                    return (
                                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? '+' : ''}{formatCurrency(profit)}
                                        </p>
                                    );
                                })()}
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-green-900 mb-1">想定利益（現在）</h4>
                                {(() => {
                                    const profit = getExpectedProfitCurrent();
                                    if (profit === null) return <p className="text-lg font-semibold text-green-900">-</p>;
                                    const isPositive = profit >= 0;
                                    return (
                                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? '+' : ''}{formatCurrency(profit)}
                                        </p>
                                    );
                                })()}
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-purple-900 mb-1">実際の利益</h4>
                                {profit !== null ? (
                                    <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                                        {profitRate !== null && ` (${profitRate.toFixed(1)}%)`}
                                    </p>
                                ) : (
                                    <p className="text-lg font-semibold text-purple-900">-</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">カラー:</span>
                            <span className="ml-2 text-gray-900">{inventory.color || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">注文番号:</span>
                            <span className="ml-2 text-gray-900">{inventory.order_number || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">注文日:</span>
                            <span className="ml-2 text-gray-900">{formatDate(inventory.order_date)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">お届け予定:</span>
                            <span className="ml-2 text-gray-900">
                                {inventory.expected_delivery_start && inventory.expected_delivery_end
                                    ? `${formatDate(inventory.expected_delivery_start)} – ${formatDate(inventory.expected_delivery_end)}`
                                    : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">支払い方法:</span>
                            <span className="ml-2 text-gray-900">{inventory.payment_method_name || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">仕入先:</span>
                            <span className="ml-2 text-gray-900">{inventory.purchase_source || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">販売先:</span>
                            <span className="ml-2 text-gray-900">{inventory.sold_to || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">仕入価格:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(inventory.purchase_price)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">予想売価:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(inventory.expected_price)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">実売価格:</span>
                            <span className="ml-2 text-gray-900">{formatCurrency(inventory.actual_price)}</span>
                        </div>

                        <div>
                            <span className="text-gray-500">納品日:</span>
                            <span className="ml-2 text-gray-900">{formatDate(inventory.arrived_at)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">売却日:</span>
                            <span className="ml-2 text-gray-900">{formatDate(inventory.sold_at)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">入金日:</span>
                            <span className="ml-2 text-gray-900">{formatDate(inventory.paid_at)}</span>
                        </div>

                        <div>
                            <span className="text-gray-500">購入Apple ID:</span>
                            <span className="ml-2 text-gray-900">{inventory.apple_id_used || 'ゲストID'}</span>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <span className="text-gray-500">連絡先メール:</span>
                            <span className="ml-2 text-gray-900">{inventory.contact_email || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">連絡先電話:</span>
                            <span className="ml-2 text-gray-900">{inventory.contact_phone || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">クレジットカード:</span>
                            <span className="ml-2 text-gray-900">{inventory.credit_card || '-'}</span>
                        </div>

                        {/* Shipment Information */}
                        {inventory.shipment_id && (
                            <>
                                <div className="col-span-full mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">発送情報</h4>
                                </div>
                                <div>
                                    <span className="text-gray-500">発送ID:</span>
                                    <span className="ml-2 text-gray-900">{inventory.shipment_id}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Linked Rewards */}
                    {rewards.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">紐付きポイント・特典</h3>
                            <div className="space-y-2">
                                {rewards.map((reward) => (
                                    <div key={reward.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                        <div>
                                            <span className="font-medium text-gray-900">{REWARD_TYPES[reward.type]}</span>
                                            <span className="text-gray-600 ml-2">- {reward.description}</span>
                                        </div>
                                        <div className="text-right">
                                            {reward.type === 'gift_card' ? (
                                                <span className="font-semibold text-green-600">¥{(reward.amount || 0).toLocaleString()}</span>
                                            ) : (
                                                <div>
                                                    <span className="font-semibold text-purple-600">
                                                        {(reward.points || 0).toLocaleString()}pt
                                                    </span>
                                                    <span className="text-gray-600 text-sm ml-2">
                                                        (¥{Math.round((reward.points || 0) * (reward.point_rate || 0)).toLocaleString()})
                                                    </span>
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(reward.earned_at).toLocaleDateString('ja-JP')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Linked Email History */}
                    {emails.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">関連メール履歴</h3>
                            <div className="space-y-2">
                                {emails.map((email) => (
                                    <div key={email.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                        <div>
                                            <span className="font-medium text-gray-900">{EMAIL_TYPES[email.email_type]}</span>
                                            <span className="text-gray-600 ml-2">- {email.subject}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                                {new Date(email.received_at).toLocaleString('ja-JP')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {inventory.notes && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">備考</h3>
                            <p className="text-gray-900 whitespace-pre-wrap">{inventory.notes}</p>
                        </div>
                    )}
                </div>

                {/* Edit Form */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">編集</h2>
                    <InventoryForm
                        mode="edit"
                        initialData={{
                            id: inventory.id,
                            model_name: inventory.model_name,
                            storage: inventory.storage,
                            color: inventory.color || undefined,
                            status: inventory.status,
                            purchase_price: inventory.purchase_price || undefined,
                            expected_price: inventory.expected_price || undefined,
                            actual_price: inventory.actual_price || undefined,
                            purchase_source: inventory.purchase_source || undefined,
                            // 日付はYYYY-MM-DD形式に変換
                            arrived_at: inventory.arrived_at ? inventory.arrived_at.split('T')[0] : undefined,
                            sold_at: inventory.sold_at ? inventory.sold_at.split('T')[0] : undefined,
                            paid_at: inventory.paid_at ? inventory.paid_at.split('T')[0] : undefined,
                            notes: inventory.notes || undefined,
                            order_number: inventory.order_number || undefined,
                            order_date: inventory.order_date ? inventory.order_date.split('T')[0] : undefined,
                            expected_delivery_start: inventory.expected_delivery_start ? inventory.expected_delivery_start.split('T')[0] : undefined,
                            expected_delivery_end: inventory.expected_delivery_end ? inventory.expected_delivery_end.split('T')[0] : undefined,
                            payment_card: inventory.payment_card || undefined,
                            sold_to: inventory.sold_to || undefined,
                            // 追加フィールド
                            tracking_number: inventory.tracking_number || undefined,
                            carrier: inventory.carrier || undefined,
                            payment_method_id: inventory.payment_method_id || undefined,
                            apple_id_used: inventory.apple_id_used || undefined,
                            // 連絡先情報
                            contact_email_id: inventory.contact_email_id || undefined,
                            contact_phone_id: inventory.contact_phone_id || undefined,
                            credit_card_id: inventory.credit_card_id || undefined,
                            apple_account: inventory.apple_account || undefined,
                        }}
                    />
                </div>
            </div>
        </>
    );
}
