# ResaleTracker V2 - API仕様

## 概要

すべてのAPIは `/api/` 配下に配置。  
認証が必要なエンドポイントは Supabase Auth のセッションを使用。

---

## 1. 在庫管理 API

### GET /api/inventory

在庫一覧を取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| status | string | No | ステータスでフィルター |
| limit | number | No | 取得件数（デフォルト: 50） |
| offset | number | No | オフセット |

**レスポンス**

```json
{
  "data": [
    {
      "id": "uuid",
      "inventory_code": "W1234567890-1",
      "order_number": "W1234567890",
      "item_index": 1,
      "model_name": "iPhone 17 Pro Max",
      "storage": "256GB",
      "color": "コズミックオレンジ",
      "status": "ordered",
      "purchase_price": 194800,
      ...
    }
  ],
  "count": 100
}
```

---

### GET /api/inventory/[id]

在庫詳細を取得

**レスポンス**

```json
{
  "data": {
    "id": "uuid",
    "inventory_code": "W1234567890-1",
    ...
  }
}
```

---

### POST /api/inventory

在庫を新規登録

**リクエストボディ**

```json
{
  "order_number": "W1234567890",
  "item_index": 1,
  "model_name": "iPhone 17 Pro Max",
  "storage": "256GB",
  "color": "コズミックオレンジ",
  "purchase_price": 194800,
  "order_date": "2026-01-17",
  "expected_delivery_start": "2026-01-20",
  "expected_delivery_end": "2026-01-22"
}
```

**レスポンス**

```json
{
  "data": {
    "id": "uuid",
    "inventory_code": "W1234567890-1",
    ...
  }
}
```

---

### PUT /api/inventory/[id]

在庫を更新

**リクエストボディ**

```json
{
  "status": "shipped",
  "tracking_number": "483654795890",
  "carrier": "yamato"
}
```

---

### DELETE /api/inventory/[id]

在庫を削除

---

### GET /api/inventory/search

注文番号で在庫を検索

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| order_number | string | Yes | 注文番号 |

---

### GET /api/inventory/summary

在庫サマリーを取得（ダッシュボード用）

**レスポンス**

```json
{
  "data": {
    "by_status": {
      "ordered": 5,
      "shipped": 3,
      "delivered": 2,
      "paid": 10
    },
    "this_month": {
      "sales": 1500000,
      "purchases": 1200000,
      "gross_profit": 300000,
      "shipping_cost": 15000,
      "net_profit": 285000
    }
  }
}
```

---

## 2. 価格 API

### GET /api/prices

価格履歴を取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| model_name | string | No | 機種名でフィルター |
| storage | string | No | 容量でフィルター |
| days | number | No | 過去N日分（デフォルト: 30） |

---

### GET /api/prices/latest

最新価格を取得

**レスポンス**

```json
{
  "data": [
    {
      "model_name": "iPhone 17 Pro Max",
      "storage": "256GB",
      "price": 203000,
      "captured_at": "2026-01-17T01:00:00Z"
    }
  ]
}
```

---

## 3. メール API

### POST /api/mail/webhook

Cloudflare Email Workerからのメール受信

**リクエストボディ**

```json
{
  "from": "noreply@orders.apple.com",
  "to": "import@rt-mail.uk",
  "subject": "ご注文の確認 - W1234567890",
  "text": "...",
  "html": "..."
}
```

**処理フロー**

1. 件名からメール種類を判定
2. 注文番号を抽出
3. 該当する在庫レコードを作成 or 更新
4. email_logsにログを保存

---

### GET /api/emails

メール取り込み履歴を取得

**クエリパラメータ**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| status | string | No | success / failed / skipped |
| limit | number | No | 取得件数 |
| after | string | No | この日時以降（ISO8601） |

**レスポンス**

```json
{
  "data": [
    {
      "id": "uuid",
      "email_type": "order_confirmation",
      "subject": "ご注文の確認 - W1234567890",
      "order_number": "W1234567890",
      "status": "success",
      "received_at": "2026-01-17T10:30:00Z"
    }
  ]
}
```

---

## 4. マスタ API

### Apple Accounts

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/apple-accounts | 一覧取得 |
| POST | /api/apple-accounts | 新規登録 |
| PUT | /api/apple-accounts/[id] | 更新 |
| DELETE | /api/apple-accounts/[id] | 削除 |

### Contact Emails

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/contact-emails | 一覧取得 |
| POST | /api/contact-emails | 新規登録 |
| PUT | /api/contact-emails/[id] | 更新 |
| DELETE | /api/contact-emails/[id] | 削除 |

### Contact Phones

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/contact-phones | 一覧取得 |
| POST | /api/contact-phones | 新規登録 |
| PUT | /api/contact-phones/[id] | 更新 |
| DELETE | /api/contact-phones/[id] | 削除 |

### Payment Methods

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/payment-methods | 一覧取得 |
| POST | /api/payment-methods | 新規登録 |
| PUT | /api/payment-methods/[id] | 更新 |
| DELETE | /api/payment-methods/[id] | 削除 |

---

## 5. 発送・ポイント API

### Shipments（発送管理）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/shipments | 一覧取得 |
| POST | /api/shipments | 新規登録 |
| PUT | /api/shipments/[id] | 更新 |

### Rewards（ポイント・特典）

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/rewards | 一覧取得 |
| GET | /api/rewards/summary | 月別サマリー |
| POST | /api/rewards | 新規登録 |

---

## 6. ダッシュボード API

### GET /api/dashboard

ダッシュボード用の集計データを取得

**レスポンス**

```json
{
  "data": {
    "this_month": {
      "sales": 1500000,
      "purchases": 1200000,
      "gross_profit": 300000,
      "shipping_cost": 15000,
      "net_profit": 285000,
      "sold_count": 8
    },
    "rewards_this_month": {
      "gift_card": 5000,
      "credit_card_point": 3000,
      "total": 8000
    },
    "inventory_by_status": {
      "ordered": 5,
      "shipped": 3,
      "delivered": 2,
      "sent_to_buyer": 1,
      "paid": 10
    },
    "alerts": {
      "delivery_delayed": [
        {
          "inventory_code": "W1234567890-1",
          "original": "2026-01-20",
          "current": "2026-01-27",
          "delay_days": 7
        }
      ],
      "survey_pending": 2
    }
  }
}
```

---

## エラーレスポンス

すべてのAPIは以下の形式でエラーを返す：

```json
{
  "error": "エラーメッセージ"
}
```

| ステータスコード | 説明 |
|----------------|------|
| 400 | リクエストエラー（バリデーション失敗など） |
| 401 | 認証エラー |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |
