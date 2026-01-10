import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'ResaleTracker - iPhone転売価格管理',
    description: 'iPhone転売ビジネスのための価格管理・分析アプリケーション',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
