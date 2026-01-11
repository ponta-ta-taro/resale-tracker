'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/', label: 'ダッシュボード' },
        { href: '/prices', label: '価格一覧' },
        { href: '/inventory', label: '在庫管理' },
        { href: '/apple-accounts', label: 'Apple ID' },
        { href: '/settings', label: '設定' },
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
                </div>
            </div>
        </header>
    );
}
