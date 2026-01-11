'use client';

import Header from '@/components/Header';
import PaymentMethodsManager from '@/components/settings/PaymentMethodsManager';

export default function SettingsPage() {
    return (
        <>
            <Header />
            <main className="min-h-screen p-8 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
                        <p className="text-gray-600">支払い方法の管理</p>
                    </div>

                    {/* Payment Methods */}
                    <PaymentMethodsManager />
                </div>
            </main>
        </>
    );
}
