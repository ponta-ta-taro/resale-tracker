'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function HelpPage() {
    const [openSection, setOpenSection] = useState<string | null>('setup');

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">ヘルプ</h1>

                    {/* 目次 */}
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">目次</h2>
                        <ul className="space-y-2">
                            <li><a href="#setup" className="text-blue-600 hover:underline">1. 初期設定手順</a></li>
                            <li><a href="#features" className="text-blue-600 hover:underline">2. 各機能の説明</a></li>
                            <li><a href="#faq" className="text-blue-600 hover:underline">3. FAQ</a></li>
                        </ul>
                    </div>

                    {/* 初期設定手順 */}
                    <div id="setup" className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 初期設定手順</h2>

                        {/* Gmail転送設定 */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('gmail')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">1-1. Gmail転送設定</h3>
                                <span className="text-gray-500">{openSection === 'gmail' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'gmail' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-gray-700">
                                        ResaleTrackerはAppleからのメールを自動で取り込んで在庫登録します。<br />
                                        以下の手順でGmail転送を設定してください。
                                    </p>

                                    {/* 転送対象メール一覧 */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【転送対象メール】</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border border-gray-300 text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">メール種類</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">差出人アドレス</th>
                                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">対応状況</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="bg-green-50">
                                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">注文確認</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <code className="text-xs bg-white px-2 py-1 rounded">noreply_apac@orders.apple.com</code>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className="text-green-700 font-semibold">✅ 対応済み</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-green-50">
                                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">出荷通知</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <code className="text-xs bg-white px-2 py-1 rounded">shipping_notification_jp@orders.apple.com</code>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className="text-green-700 font-semibold">✅ 対応済み</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-yellow-50">
                                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">注文完了</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <code className="text-xs bg-white px-2 py-1 rounded">order_acknowledgment@orders.apple.com</code>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className="text-yellow-700 font-semibold">🚧 未実装</span>
                                                            <span className="text-xs text-gray-600 block mt-1">（注文確認と内容重複）</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-yellow-50">
                                                        <td className="border border-gray-300 px-4 py-2 text-gray-900">請求書</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <code className="text-xs bg-white px-2 py-1 rounded">noreply@email.apple.com</code>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className="text-yellow-700 font-semibold">🚧 未実装</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-3 bg-blue-50 p-3 rounded">
                                            <p className="text-sm text-gray-700">
                                                <strong>✅ 対応済み</strong>のメールのみ転送設定が必要です。<br />
                                                <strong>🚧 未実装</strong>のメールは転送しても処理されません（今後対応予定）。
                                            </p>
                                        </div>
                                    </div>

                                    {/* ステップ1: 転送先アドレスの登録 */}
                                    <div className="bg-purple-50 p-4 rounded-md">
                                        <h4 className="font-semibold text-gray-900 mb-2">【ステップ1】転送先アドレスの登録</h4>
                                        <p className="text-sm text-gray-700 mb-2">まず、転送先アドレスを登録します（最初の1回のみ）。</p>
                                        <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                                            <li>Gmailを開く（PC推奨）</li>
                                            <li>右上の歯車アイコン → 「すべての設定を表示」</li>
                                            <li>「メール転送とPOP/IMAP」タブを開く</li>
                                            <li>「転送先アドレスを追加」をクリック</li>
                                            <li><code className="bg-white px-2 py-1 rounded text-xs">import@rt-mail.uk</code> を入力して「次へ」</li>
                                            <li>確認メールが届くので、記載されたリンクをクリック</li>
                                            <li>「変更を保存」（「受信メールを転送」は選択しない）</li>
                                        </ol>
                                    </div>

                                    {/* ステップ2: フィルター設定 */}
                                    <div className="bg-green-50 p-4 rounded-md">
                                        <h4 className="font-semibold text-gray-900 mb-2">【ステップ2】Gmailフィルター設定</h4>
                                        <p className="text-sm text-gray-700 mb-2">特定のAppleメールのみを転送するフィルターを作成します。</p>
                                        <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
                                            <li>Gmailの設定画面で「フィルタとブロック中のアドレス」タブを選択</li>
                                            <li>「新しいフィルタを作成」をクリック</li>
                                            <li>From欄に <code className="bg-white px-2 py-1 rounded text-xs">noreply_apac@orders.apple.com</code> を入力</li>
                                            <li>「フィルタを作成」をクリック</li>
                                            <li>「次のアドレスに転送する」にチェックを入れ、<code className="bg-white px-2 py-1 rounded text-xs">import@rt-mail.uk</code> を選択</li>
                                            <li>「フィルタを作成」で完了</li>
                                            <li><strong>同じ手順を繰り返して</strong>、<code className="bg-white px-2 py-1 rounded text-xs">shipping_notification_jp@orders.apple.com</code> のフィルターも作成</li>
                                        </ol>
                                        <div className="mt-3 bg-white p-3 rounded border border-green-300">
                                            <p className="text-xs text-gray-700">
                                                💡 <strong>ポイント</strong>：対応済みの2つのメールアドレスそれぞれに対してフィルターを作成してください。<br />
                                                これにより、必要なメールだけが自動転送されます。
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                                        ※ Apple注文時に連絡先として使うGmailアカウントすべてに設定してください
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* マスタデータの登録 */}
                        <div className="bg-white rounded-lg shadow">
                            <button
                                onClick={() => toggleSection('master')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">1-2. マスタデータの登録</h3>
                                <span className="text-gray-500">{openSection === 'master' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'master' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-gray-700">
                                        <Link href="/settings" className="text-blue-600 hover:underline">設定画面</Link>で以下の情報を事前に登録しておくと、在庫編集時に選択できて便利です。
                                    </p>
                                    <div className="space-y-4">
                                        <div className="border-l-4 border-blue-500 pl-4">
                                            <h4 className="font-semibold text-gray-900">連絡先メール</h4>
                                            <p className="text-gray-700 text-sm">Apple注文時に使うGmailアドレスを登録</p>
                                            <p className="text-gray-600 text-sm">例: example1@gmail.com, example2@gmail.com</p>
                                        </div>
                                        <div className="border-l-4 border-green-500 pl-4">
                                            <h4 className="font-semibold text-gray-900">連絡先電話番号</h4>
                                            <p className="text-gray-700 text-sm">Apple注文時に使う電話番号を登録</p>
                                        </div>
                                        <div className="border-l-4 border-purple-500 pl-4">
                                            <h4 className="font-semibold text-gray-900">支払い方法</h4>
                                            <p className="text-gray-700 text-sm">クレジットカードや決済方法を登録</p>
                                            <ul className="list-disc list-inside text-gray-600 text-sm ml-4">
                                                <li>カード名（例: 楽天カード）</li>
                                                <li>締め日・支払日を設定するとダッシュボードに支払いスケジュールが表示されます</li>
                                            </ul>
                                        </div>
                                        <div className="border-l-4 border-orange-500 pl-4">
                                            <h4 className="font-semibold text-gray-900">Apple ID（任意）</h4>
                                            <p className="text-gray-700 text-sm">Apple IDでログインして購入する場合に登録</p>
                                            <p className="text-gray-600 text-sm">ゲスト購入のみなら不要</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 各機能の説明 */}
                    <div id="features" className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 各機能の説明</h2>

                        {/* ダッシュボード */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('dashboard')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-1. ダッシュボード</h3>
                                <span className="text-gray-500">{openSection === 'dashboard' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'dashboard' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【期間選択】</h4>
                                        <p className="text-gray-700">「当月」「前月」「カスタム」から選択可能<br />選択した期間の売上・利益が表示されます</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【実績カード】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li><strong>売上</strong>：入金済み商品の実売価格合計</li>
                                            <li><strong>粗利益</strong>：売上 - 仕入れ価格</li>
                                            <li><strong>送料</strong>：発送にかかった送料合計</li>
                                            <li><strong>純利益</strong>：粗利益 - 送料</li>
                                            <li><strong>利益率</strong>：粗利益 ÷ 仕入れ総額 × 100</li>
                                            <li><strong>販売台数</strong>：入金済みの台数</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【累計実績】</h4>
                                        <p className="text-gray-700">全期間の合計実績</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【在庫状況】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li><strong>注文中</strong>：注文確定〜配送準備中</li>
                                            <li><strong>出荷済み</strong>：Appleから出荷済み</li>
                                            <li><strong>配送済み</strong>：手元に届いた</li>
                                            <li><strong>買取手続き中</strong>：買取業者に発送〜手続き完了</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【資金状況】</h4>
                                        <p className="text-gray-700"><strong>未回収の仕入れ総額</strong>：まだ入金されていない在庫の仕入れ価格合計</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【支払いスケジュール】</h4>
                                        <p className="text-gray-700">登録した支払い方法の締め日・支払日に基づいて表示</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 在庫一覧 */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('inventory-list')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-2. 在庫一覧</h3>
                                <span className="text-gray-500">{openSection === 'inventory-list' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'inventory-list' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【ステータスフィルター】</h4>
                                        <p className="text-gray-700">タブで絞り込み可能：全て / 注文中 / 出荷済み / 配送済み / 買取手続き中 / 入金済み</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【列の説明】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li><strong>在庫コード</strong>：注文番号 + 連番（例: W1234567890-1）</li>
                                            <li><strong>機種名</strong>：iPhone 16 Pro など</li>
                                            <li><strong>容量/色</strong>：256GB / ブラックチタニウム など</li>
                                            <li><strong>ステータス</strong>：現在の状態</li>
                                            <li><strong>仕入価格</strong>：購入金額</li>
                                            <li><strong>予想売価</strong>：注文時の買取予想価格</li>
                                            <li><strong>実売価格</strong>：実際の買取価格</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 在庫編集 */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('inventory-edit')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-3. 在庫編集</h3>
                                <span className="text-gray-500">{openSection === 'inventory-edit' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'inventory-edit' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【ステータス】</h4>
                                        <p className="text-gray-700 mb-2">9段階で管理：</p>
                                        <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
                                            <li><strong>ordered（注文確定）</strong> - Apple Storeで注文が確定した状態</li>
                                            <li><strong>processing（処理中）</strong> - Appleが注文を処理中</li>
                                            <li><strong>preparing_shipment（配送準備中）</strong> - Appleが出荷準備中</li>
                                            <li><strong>shipped（出荷完了）</strong> - Appleから出荷された</li>
                                            <li><strong>delivered（配送済み）</strong> - 手元に届いた</li>
                                            <li><strong>sent_to_buyer（買取発送済み）</strong> - 買取業者に発送した</li>
                                            <li><strong>buyer_completed（買取手続完了）</strong> - 買取業者の査定・手続きが完了</li>
                                            <li><strong>paid（入金済み）</strong> - 買取代金が入金された</li>
                                            <li><strong>receipt_received（領収書受領）</strong> - 領収書を受け取った（完了）</li>
                                        </ol>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【Appleからの配送情報】</h4>
                                        <p className="text-gray-700">メールから自動取得：配送業者、追跡番号、お届け予定日</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【買取業者への発送】</h4>
                                        <p className="text-gray-700">手動入力：発送先、配送業者、伝票番号、発送日</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【価格情報】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li><strong>仕入価格</strong>：Apple購入価格</li>
                                            <li><strong>予想売価</strong>：注文時の買取予想</li>
                                            <li><strong>実売価格</strong>：実際の買取価格（売却日・入金日を入力する時は必須）</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 発送管理 */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('shipments')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-4. 発送管理</h3>
                                <span className="text-gray-500">{openSection === 'shipments' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'shipments' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-gray-700">複数の在庫をまとめて1つの発送として管理できます。</p>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【発送の作成】</h4>
                                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                                            <li>発送管理画面で「新規発送」</li>
                                            <li>発送先、配送業者、伝票番号、送料を入力</li>
                                            <li>保存</li>
                                        </ol>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【在庫との紐付け】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li>在庫編集画面で「発送」を選択</li>
                                            <li>または発送管理画面から在庫を紐付け</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【送料の計算】</h4>
                                        <p className="text-gray-700">発送に紐付いた在庫で送料を按分して利益計算に反映</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* メール履歴 */}
                        <div className="bg-white rounded-lg shadow mb-4">
                            <button
                                onClick={() => toggleSection('emails')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-5. メール履歴</h3>
                                <span className="text-gray-500">{openSection === 'emails' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'emails' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-gray-700">自動取り込みされたメールの履歴を確認できます。</p>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【ステータス】</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            <li><strong>success</strong>：正常に処理された</li>
                                            <li><strong>skipped</strong>：重複などでスキップされた</li>
                                            <li><strong>error</strong>：エラーで処理できなかった</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【確認方法】</h4>
                                        <p className="text-gray-700">メールが届いたのに在庫に反映されない場合、ここでエラーを確認</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 価格一覧 */}
                        <div className="bg-white rounded-lg shadow">
                            <button
                                onClick={() => toggleSection('prices')}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                            >
                                <h3 className="text-lg font-semibold text-gray-900">2-6. 価格一覧</h3>
                                <span className="text-gray-500">{openSection === 'prices' ? '▼' : '▶'}</span>
                            </button>
                            {openSection === 'prices' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-gray-700">モバイルミックスの買取価格を表示。<br />毎日午前10時に自動更新されます。</p>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">【使い方】</h4>
                                        <p className="text-gray-700">注文前に買取価格をチェックして、利益が出るか確認</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div id="faq" className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. FAQ</h2>
                        <div className="space-y-4">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-900 mb-2">Q: メールが取り込まれないのですが？</h3>
                                <div className="text-gray-700">
                                    <p className="mb-2">A: 以下を確認してください：</p>
                                    <ol className="list-decimal list-inside space-y-1 ml-4">
                                        <li>Gmail転送設定が有効になっているか</li>
                                        <li>転送先が「import@rt-mail.uk」になっているか</li>
                                        <li>メール履歴画面でエラーが出ていないか</li>
                                        <li>連絡先メールに該当のGmailが登録されているか</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-900 mb-2">Q: ステータスが自動で変わらないのですが？</h3>
                                <div className="text-gray-700">
                                    <p className="mb-2">A: 現在、自動で変わるのは以下のみです：</p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>注文確認メール受信 → ordered</li>
                                        <li>出荷通知メール受信 → shipped</li>
                                    </ul>
                                    <p className="mt-2">その他のステータスは手動で変更してください。</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-900 mb-2">Q: 送料はどこで入力しますか？</h3>
                                <p className="text-gray-700">
                                    A: 発送管理画面で発送を作成し、送料を入力します。<br />
                                    在庫と発送を紐付けると、利益計算に反映されます。
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-900 mb-2">Q: 複数台を1つの注文で買った場合は？</h3>
                                <p className="text-gray-700">
                                    A: 自動で別々の在庫として登録されます。<br />
                                    在庫コードの末尾（-1, -2, -3...）で区別されます。
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="font-semibold text-gray-900 mb-2">Q: ゲスト購入とApple ID購入の違いは？</h3>
                                <p className="text-gray-700">
                                    A: どちらも同じように管理できます。<br />
                                    Apple IDを登録しておくと、在庫編集時に選択できて便利です。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
