# Phase 2 注文確認メール自動取り込み完了 (2026-01-18)

## 完了した作業
- 注文確認メールのパース・在庫自動登録
- 複数商品対応（item_index）
- email_logs記録機能
- Gmail転送対応

## 重要な発見: order_token取得方法

### 問題
- Appleの注文確認メール内URLにはorder_tokenが含まれていない
- メール内: `https://store.apple.com/xc/jp/vieworder/{注文番号}/{メールアドレス}/`
- これは短縮URL的なもので、tokenは含まれない

### 解決策
- 上記URLにHTTPリクエスト → リダイレクト先URLにtokenが含まれる
- リダイレクト先: `https://secure9.store.apple.com/jp/shop/order/guest/{注文番号}/{token}`
- `redirect: 'manual'` でLocationヘッダーから取得可能
- Puppeteer不要、単純なfetchでOK

### 注文状況スクレイピングについて
- リダイレクト先ページはJavaScript SPA
- `<div id="portal"></div>` のみで、中身はJS読み込み
- 出荷状況取得にはPuppeteer等ヘッドレスブラウザが必要

## テスト結果
- W1528936835: 2台登録成功
- W1699438321: 2台登録成功
