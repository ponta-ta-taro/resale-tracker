'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import PaymentMethodsManager from '@/components/settings/PaymentMethodsManager';
import AppleAccountsManager from '@/components/settings/AppleAccountsManager';
import ShippingAddressesManager from '@/components/settings/ShippingAddressesManager';
import MobileLinesManager from '@/components/settings/MobileLinesManager';

type Tab = 'payment-methods' | 'apple-accounts' | 'shipping-addresses' | 'mobile-lines';

const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'payment-methods', label: '支払い方法', icon: '💳' },
    { id: 'apple-accounts', label: 'Apple ID', icon: '🍎' },
    { id: 'shipping-addresses', label: '配送先住所', icon: '📦' },
    { id: 'mobile-lines', label: '携帯回線', icon: '📱' },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('payment-methods');

    return (
        <>
            <Header />
            <main className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
                        <p className="text-gray-600">マスタデータの管理</p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="flex space-x-4">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'payment-methods' && <PaymentMethodsManager />}
                        {activeTab === 'apple-accounts' && <AppleAccountsManager />}
                        {activeTab === 'shipping-addresses' && <ShippingAddressesManager />}
                        {activeTab === 'mobile-lines' && <MobileLinesManager />}
                    </div>
                </div>
            </main>
        </>
    );
}
