# ResaleTracker V2 - データベース定義

## 1. テーブル一覧

| テーブル名 | 説明 | RLS |
|-----------|------|-----|
| `inventory` | 在庫管理（メイン） | ユーザー別 |
| `price_history` | 買取価格履歴 | 全員共有（読取のみ） |
| `apple_accounts` | Apple IDマスタ | ユーザー別 |
| `contact_emails` | 連絡先メールマスタ | ユーザー別 |
| `contact_phones` | 連絡先電話番号マスタ | ユーザー別 |
| `payment_methods` | 支払い方法マスタ | ユーザー別 |
| `shipments` | 発送管理（送料） | ユーザー別 |
| `rewards` | ポイント・特典管理 | ユーザー別 |
| `email_logs` | メール取り込み履歴 | ユーザー別 |

---

## 2. テーブル定義

### 2.1 inventory（在庫管理）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK（自動生成） |
| user_id | uuid | NO | RLS用 |
| inventory_code | text | NO | 識別コード（例: W1234567890-1）UNIQUE |
| order_number | text | NO | Apple注文番号 |
| item_index | integer | NO | 同一注文内の連番（1, 2, ...） |
| model_name | text | YES | 機種名（iPhone 17 Pro など） |
| storage | text | YES | 容量（256GB など） |
| color | text | YES | カラー |
| serial_number | text | YES | シリアル番号 |
| imei | text | YES | IMEI番号 |
| status | text | NO | ステータス（デフォルト: ordered） |
| purchase_price | integer | YES | 仕入価格 |
| expected_price | integer | YES | 予想売価（注文時） |
| actual_price | integer | YES | 実売価格 |
| order_date | date | YES | 注文日 |
| expected_delivery_start | date | YES | お届け予定日（開始） |
| expected_delivery_end | date | YES | お届け予定日（終了） |
| original_delivery_start | date | YES | 当初お届け予定日（開始） |
| original_delivery_end | date | YES | 当初お届け予定日（終了） |
| delivered_at | date | YES | 納品日 |
| carrier | text | YES | Apple配送業者 |
| tracking_number | text | YES | Apple追跡番号 |
| order_token | text | YES | Apple注文トークン（ゲスト注文ページ直接アクセス用） |
| purchase_source | text | YES | 仕入先（Apple Store / Amazon） |
| apple_account_id | uuid | YES | FK → apple_accounts.id |
| contact_email_id | uuid | YES | FK → contact_emails.id |
| contact_phone_id | uuid | YES | FK → contact_phones.id |
| payment_method_id | uuid | YES | FK → payment_methods.id |
| sold_to | text | YES | 販売先（モバイルミックス など） |
| buyer_carrier | text | YES | 買取業者への配送業者 |
| buyer_tracking_number | text | YES | 買取業者への伝票番号 |
| shipped_to_buyer_at | date | YES | 買取発送日 |
| sold_at | date | YES | 売却日 |
| paid_at | date | YES | 入金日 |
| receipt_received_at | date | YES | 領収書受領日 |
| shipment_id | uuid | YES | FK → shipments.id |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |
| updated_at | timestamptz | NO | 更新日時 |

**ユニーク制約**: `(order_number, item_index)`

**ステータス値**:
- `ordered` - 注文確定
- `processing` - 処理中
- `preparing_shipment` - 配送準備中
- `shipped` - 出荷完了
- `delivered` - 配送済み
- `sent_to_buyer` - 買取発送済み
- `buyer_completed` - 買取手続完了
- `paid` - 入金済み
- `receipt_received` - 領収書受領

---

### 2.2 price_history（買取価格履歴）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| model_name | text | NO | 機種名 |
| storage | text | NO | 容量 |
| price | integer | NO | 買取価格 |
| color_note | text | YES | 色・備考 |
| captured_at | timestamptz | NO | 取得日時 |
| created_at | timestamptz | NO | 作成日時 |

**備考**: 全ユーザーで共有（RLSは読取のみ許可）

---

### 2.3 apple_accounts（Apple IDマスタ）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| name | text | NO | 表示名（例: メインApple ID、ゲスト1） |
| email | text | YES | Apple ID（メールアドレス） |
| is_guest | boolean | NO | ゲストIDかどうか |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |

---

### 2.4 contact_emails（連絡先メールマスタ）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| email | text | NO | メールアドレス |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |

---

### 2.5 contact_phones（連絡先電話番号マスタ）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| phone_number | text | NO | 電話番号 |
| label | text | YES | ラベル |
| is_active | boolean | NO | 有効フラグ（デフォルト: true） |
| created_at | timestamptz | NO | 作成日時 |

---

### 2.6 payment_methods（支払い方法マスタ）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| name | text | NO | 名前（例: 楽天カード、PayPayカード） |
| card_last4 | text | YES | カード下4桁 |
| card_brand | text | YES | ブランド（VISA, Mastercard など） |
| point_rate | decimal | YES | ポイント還元率（%） |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |

---

### 2.7 shipments（発送管理）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| shipped_to | text | NO | 発送先（モバイルミックス など） |
| carrier | text | YES | 配送業者 |
| tracking_number | text | YES | 追跡番号 |
| shipping_cost | integer | YES | 送料（円） |
| shipped_at | date | YES | 発送日 |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |

**リレーション**: inventory.shipment_id → shipments.id（多対1）

---

### 2.8 rewards（ポイント・特典管理）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| type | text | NO | 種類（gift_card / credit_card_point） |
| amount | integer | NO | 金額・ポイント数 |
| description | text | YES | 説明（例: 楽天ギフトカード購入） |
| earned_at | date | NO | 獲得日 |
| related_inventory_id | uuid | YES | FK → inventory.id（紐付く在庫） |
| notes | text | YES | 備考 |
| created_at | timestamptz | NO | 作成日時 |

**type値**:
- `gift_card` - ギフトカード還元
- `credit_card_point` - クレカポイント

---

### 2.9 email_logs（メール取り込み履歴）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | PK |
| user_id | uuid | NO | RLS用 |
| email_type | text | NO | メール種類 |
| subject | text | YES | 件名 |
| sender | text | YES | 送信元 |
| order_number | text | YES | 抽出した注文番号 |
| raw_content | text | YES | 生メール内容 |
| parsed_data | jsonb | YES | パース結果（JSON） |
| status | text | NO | 処理ステータス（success / failed / skipped） |
| error_message | text | YES | エラーメッセージ |
| received_at | timestamptz | NO | メール受信日時 |
| processed_at | timestamptz | NO | 処理日時 |
| created_at | timestamptz | NO | 作成日時 |

**email_type値**:
- `order_confirmation` - 注文確認
- `order_thanks` - 注文ありがとう
- `shipping_notification` - 出荷通知
- `invoice` - 請求書
- `survey` - アンケート
- `unknown` - 不明

---

## 3. ER図（リレーション）

```
apple_accounts ─┐
                │
contact_emails ─┼──→ inventory ←── shipments
                │         │
contact_phones ─┤         │
                │         ↓
payment_methods─┘     rewards

price_history（独立）

email_logs（独立）
```

---

## 4. インデックス

| テーブル | カラム | 用途 |
|---------|--------|------|
| inventory | user_id | RLSフィルター |
| inventory | order_number | 注文番号検索 |
| inventory | status | ステータスフィルター |
| inventory | inventory_code | ユニーク識別 |
| price_history | model_name, storage | 機種別検索 |
| price_history | captured_at | 日付ソート |
| email_logs | user_id | RLSフィルター |
| email_logs | order_number | 注文紐付け |

---

## 5. RLSポリシー

### 基本ルール
- `user_id = auth.uid()` でフィルター
- SELECT / INSERT / UPDATE / DELETE すべてに適用

### 例外
- `price_history`: 全ユーザーSELECT可能（共有データ）
