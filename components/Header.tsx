'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Header() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const navLinks = [
        { href: '/', label: 'ダッシュボード' },
        { href: '/prices', label: '価格一覧' },
        { href: '/inventory', label: '在庫管理' },
        { href: '/shipments', label: '発送管理' },
        { href: '/rewards', label: 'ポイント管理' },
        { href: '/emails', label: 'メール履歴' },
        { href: '/apple-accounts', label: 'Apple ID' },
        { href: '/settings', label: '支払い設定' },
        { href: '/settings/contacts', label: '連絡先設定' },
    ];

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        ResaleTracker
                    </Link>

                    {/* Navigation */}
                    <nav className="flex gap-6">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href ||
                                (link.href === '/inventory' && pathname?.startsWith('/inventory')) ||
                                (link.href === '/shipments' && pathname?.startsWith('/shipments')) ||
                                (link.href === '/rewards' && pathname?.startsWith('/rewards')) ||
                                (link.href === '/emails' && pathname?.startsWith('/emails')) ||
                                (link.href === '/apple-accounts' && pathname?.startsWith('/apple-accounts')) ||
                                (link.href === '/settings' && pathname?.startsWith('/settings'));

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${isActive
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-4">
                        {user && (
                            <>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.email}
                                </span>
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    ログアウト
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
