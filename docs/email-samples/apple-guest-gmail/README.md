# Apple Guest (Gmail) メールサンプル

Appleゲスト注文（Gmail連絡先）のメールサンプル。  
Apple IDではなくメールアドレスのみで注文した場合に届くメール。

## 対象メール一覧

| # | ファイル名 | メール種類 | 注文番号 |
|---|-----------|-----------|----------|
| 01 | `01_order_confirmation_W1528936835.eml` | 注文確認 | W1528936835 |
| 01 | `01_order_confirmation_W1674015528.eml` | 注文確認 | W1674015528 |
| 01 | `01_order_confirmation_W1699438321.eml` | 注文確認 | W1699438321 |

※ゲスト注文の場合、出荷通知・請求書などは追加取得が必要

---

## 01: 注文確認メール（Order Confirmation）

### メール情報
- **差出人**: `Apple Store <noreply_apac@orders.apple.com>`
- **件名パターン**: `ご注文の確認 - Wxxxxxxxxxx`
- **宛先**: ゲスト注文時に指定したGmailアドレス

### パース対象フィールド

| フィールド | DB カラム | 例 | 備考 |
|-----------|----------|-----|------|
| 注文番号 | order_number | W1528936835 | 件名からも取得可 |
| 注文日 | order_date | 2026/01/14 | |
| 機種名 | model_name | iPhone 17 Pro | |
| 容量 | storage | 256GB | |
| 色 | color | コズミックオレンジ | |
| お届け予定日（開始） | expected_delivery_start | 2026/01/16 | |
| お届け予定日（終了） | expected_delivery_end | 2026/01/17 | |
| 連絡先メール | contact_email | ponta10sakura@gmail.com | To ヘッダーから取得 |

### apple-accountとの違い

| 項目 | apple-account | apple-guest-gmail |
|------|---------------|-------------------|
| ファイル形式 | PDF（iCloud Mailからエクスポート） | EML（Gmail生データ） |
| 差出人 | 同じ | 同じ |
| メール内容 | ほぼ同じ | ほぼ同じ |
| 注文確認URL | Apple Account紐付き | メールアドレスで認証 |

### 注文確認URL形式

```
https://store.apple.com/xc/jp/vieworder/{注文番号}/{メールアドレス}/

例:
https://store.apple.com/xc/jp/vieworder/W1528936835/ponta10sakura@gmail.com/
```

---

## ファイル命名規則

```
{連番}_{メール種類}_{注文番号}.eml

例:
01_order_confirmation_W1528936835.eml
02_order_thanks_W1528936835.eml  # 取得後に追加
03_shipping_W1528936835.eml      # 取得後に追加
```

---

## サンプル注文データ

### W1528936835
- **商品**: iPhone 17 Pro 256GB コズミックオレンジ
- **注文日**: 2026/01/14
- **お届け予定**: 2026/01/16〜17
- **連絡先**: ponta10sakura@gmail.com

### W1674015528
- **商品**: （要確認）
- **連絡先**: （要確認）

### W1699438321
- **商品**: （要確認）
- **連絡先**: （要確認）
