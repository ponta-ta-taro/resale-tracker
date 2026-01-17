# Apple Account メールサンプル

Apple ID（iCloudメール）に紐付いた注文のメールサンプル。

## 対象メール一覧

| # | ファイル名 | メール種類 | 注文番号 |
|---|-----------|-----------|----------|
| 01 | `01_order_confirmation_W1399071475.pdf` | 注文確認 | W1399071475 |
| 01 | `01_order_confirmation_W1515122271.pdf` | 注文確認 | W1515122271 |
| 02 | `02_order_thanks_W1399071475.pdf` | 注文完了 | W1399071475 |
| 02 | `02_order_thanks_W1515122271.pdf` | 注文完了 | W1515122271 |
| 03 | `03_shipping_W1399071475.pdf` | 出荷通知 | W1399071475 |
| 03 | `03_shipping_W1515122271.pdf` | 出荷通知 | W1515122271 |
| 04 | `04a_invoice_email_W1399071475_MC42724146.pdf` | 請求書メール | W1399071475 |
| 04 | `04a_invoice_pdf_W1399071475_MC42724146.pdf` | 請求書PDF | W1399071475 |
| 04 | `04b_invoice_email_W1515122271_MC44042672.pdf` | 請求書メール | W1515122271 |
| 04 | `04b_invoice_pdf_W1515122271_MC44042672.pdf` | 請求書PDF | W1515122271 |

---

## 01: 注文確認メール（Order Confirmation）

### メール情報
- **差出人**: `Apple Store <noreply_apac@orders.apple.com>`
- **件名パターン**: `ご注文の確認 - Wxxxxxxxxxx`

### パース対象フィールド

| フィールド | DB カラム | 例 | 備考 |
|-----------|----------|-----|------|
| 注文番号 | order_number | W1399071475 | 件名からも取得可 |
| 注文日 | order_date | 2026/01/06 | |
| 機種名 | model_name | iPhone 17 Pro Max | |
| 容量 | storage | 256GB | |
| 色 | color | コズミックオレンジ | |
| 価格 | purchase_price | 194,800 | 数量1の場合 |
| 数量 | quantity | 1 | 複数商品の場合あり |
| お届け予定日（開始） | expected_delivery_start | 2026/01/11 | |
| お届け予定日（終了） | expected_delivery_end | 2026/01/14 | 単日の場合は同じ |
| 支払い方法 | payment_method | Mastercard | |

### 注意点
- 複数商品の注文あり（W1515122271: iPhone 17 Pro x2）
- お届け予定日が単日の場合と範囲の場合がある

---

## 02: 注文完了メール（Order Thanks）

### メール情報
- **差出人**: `Apple Store <order_acknowledgment@orders.apple.com>`
- **件名パターン**: `ご注文ありがとうございます Wxxxxxxxxxx`

### パース対象フィールド

| フィールド | DB カラム | 例 | 備考 |
|-----------|----------|-----|------|
| 注文番号 | order_number | W1399071475 | |
| 注文日 | order_date | 2026/01/06 | |
| 機種名 | model_name | iPhone 17 Pro Max | |
| 容量 | storage | 256GB | |
| 色 | color | コズミックオレンジ | |
| 価格 | purchase_price | 194,800 | |
| お届け予定日（開始） | expected_delivery_start | 2026/01/11 | |
| お届け予定日（終了） | expected_delivery_end | 2026/01/14 | |

### 注意点
- 01_order_confirmationとほぼ同じ内容
- 決済確定後に送信される

---

## 03: 出荷通知メール（Shipping Notification）

### メール情報
- **差出人**: `Apple Store <shipping_notification_jp@orders.apple.com>`
- **件名パターン**: `お客様の商品は配送中です。ご注文番号: Wxxxxxxxxxx`

### パース対象フィールド

| フィールド | DB カラム | 例 | 備考 |
|-----------|----------|-----|------|
| 注文番号 | order_number | W1399071475 | |
| 配送業者 | carrier | YAMATO TRANSPORT CO.,LTD. | |
| 追跡番号 | tracking_number | 483654795890 | |
| お届け予定日 | expected_delivery_start | 2026/01/11 | 単日になる |

### 配送業者パターン
| メール表記 | DB値 |
|-----------|------|
| YAMATO TRANSPORT CO.,LTD. | yamato |
| JP LOGISTICS GROUP CO., LTD. | jplogistics |

### 注意点
- 出荷時点でお届け予定日が確定（単日）
- このメールでステータスを `shipped` に更新

---

## 04: 請求書メール（Invoice）

### メール情報
- **差出人**: `Apple <noreply@email.apple.com>`
- **件名パターン**: `請求金額のお知らせ: AERxxxxxxx`

### パース対象フィールド（メール本文）

メール本文からは情報が少ない。主にPDF添付ファイルを解析。

### パース対象フィールド（PDF添付）

| フィールド | DB カラム | 例 | 備考 |
|-----------|----------|-----|------|
| 注文番号 | order_number | W1399071475 | |
| 請求番号 | invoice_number | MC42724146 | |
| 製品番号 | product_code | MFY94J/A | Apple型番 |
| シリアル番号 | serial_number | HJFJYR417D | Page 3に記載 |
| 支払い内訳 | - | ギフトカード 100,000円 + MasterCard 94,800円 | |

### 注意点
- PDF解析が必要
- シリアル番号は3ページ目の「Serial Numbers for Item 000010」部分
- 複数商品の場合、Item 000010, 000020... と連番

---

## サンプル注文データ

### W1399071475
- **商品**: iPhone 17 Pro Max 256GB コズミックオレンジ x1
- **価格**: 194,800円
- **注文日**: 2026/01/06
- **お届け予定**: 2026/01/11
- **配送**: ヤマト運輸（483654795890）
- **シリアル**: HJFJYR417D

### W1515122271
- **商品**: iPhone 17 Pro 256GB コズミックオレンジ x2
- **価格**: 359,600円（179,800円 x 2）
- **注文日**: 2026/01/10
- **お届け予定**: 2026/01/12〜14 → 2026/01/13（出荷後確定）
- **配送**: JPロジスティクス（183793020961）
- **シリアル**: MT7V4QQFW5, L79CR9R4J2
