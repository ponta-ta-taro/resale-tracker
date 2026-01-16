'use client';

import Header from '@/components/Header';
import PaymentMethodsManager from '@/components/settings/PaymentMethodsManager';

export default function SettingsPage() {
    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">支払い設定</h1>
                </div>

                {/* Payment Methods */}
                <PaymentMethodsManager />
            </div>
        </>
    );
}
