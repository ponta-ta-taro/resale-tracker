# ResaleTracker - プロジェクト仕様書

## 概要

**ResaleTracker**は、iPhone転売ビジネスのための価格管理・分析アプリケーションです。

モバイルミックス（https://mobile-mix.jp/）の買取価格を自動収集し、価格推移の可視化、在庫管理、利益計算を行います。将来的にはAzure Machine Learningを使った価格予測機能も実装予定です。

---

## 主要機能

### 1. 価格データ自動収集
- Playwrightでモバイルミックスのサイトにアクセス
- フルページスクリーンショットを取得
- Tesseract OCRで価格情報を抽出
- 毎日定時に自動実行（Render Cron Job）

### 2. 価格推移グラフ
- 機種別の買取価格推移を線グラフで表示
- 期間フィルター（1週間、1ヶ月、3ヶ月、全期間）
- 複数機種の比較表示

### 3. 在庫管理
- 仕入れたiPhoneのステータス管理
- ステータス: 発注済み → 納品待ち → 販売中 → 売却済み → 入金済み
- 各iPhoneの仕入れ価格、販売予想価格、実売価格を記録

### 4. 利益計算
- 仕入れ価格と実売価格から利益を自動計算
- 利益率の表示
- 月別・機種別の利益サマリー

### 5. 価格予測（Phase 6で実装）
- Azure Machine Learningで価格トレンドを予測
- 売り時・買い時のアドバイス表示

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js | 14.x (App Router) |
| スタイリング | Tailwind CSS | 3.x |
| 言語 | TypeScript | 5.x |
| データベース | Supabase (PostgreSQL) | - |
| グラフ | Recharts | 2.x |
| 日付処理 | date-fns | 3.x |
| スクレイピング | Playwright (Python) | - |
| OCR | Tesseract | - |
| 定期実行 | Render Background Worker | - |
| ホスティング（フロント） | Vercel | - |
| 価格予測（将来） | Azure Machine Learning | - |

---

## データベース設計

### テーブル: price_history（価格履歴）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | 主キー（自動生成） |
| model_name | text | NO | 機種名（例: "iPhone 17 Pro Max"） |
| storage | text | NO | 容量（例: "256GB"） |
| price | integer | NO | 価格（円） |
| color_note | text | YES | 色・備考（例: "全色", "スカイブルー-2,000円"） |
| captured_at | timestamptz | NO | スクショ取得日時 |
| created_at | timestamptz | NO | レコード作成日時（デフォルト: now()） |

### テーブル: models（機種マスタ）

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | 主キー |
| brand | text | NO | ブランド（例: "Apple"） |
| series | text | NO | シリーズ（例: "iPhone 17 Pro Max"） |
| storage | text | NO | 容量（例: "256GB"） |
| created_at | timestamptz | NO | 作成日時 |

### テーブル: inventory（在庫管理）※Phase 5で実装

| カラム | 型 | NULL | 説明 |
|--------|-----|------|------|
| id | uuid | NO | 主キー |
| model_name | text | NO | 機種名 |
| storage | text | NO | 容量 |
| color | text | YES | 色 |
| imei | text | YES | IMEI番号 |
| status | text | NO | ステータス |
| purchase_price | integer | YES | 仕入れ価格 |
| expected_price | integer | YES | 販売予想価格 |
| actual_price | integer | YES | 実売価格 |
| purchase_source | text | YES | 仕入れ元 |
| ordered_at | timestamptz | YES | 発注日 |
| arrived_at | timestamptz | YES | 納品日 |
| sold_at | timestamptz | YES | 販売日 |
| paid_at | timestamptz | YES | 入金日 |
| notes | text | YES | メモ |
| created_at | timestamptz | NO | 作成日時 |
| updated_at | timestamptz | NO | 更新日時 |

#### statusの値
- `ordered`: 発注済み
- `arrived`: 納品済み（在庫あり）
- `selling`: 販売中
- `sold`: 売却済み（入金待ち）
- `paid`: 入金済み（完了）

---

## 画面構成

### ダッシュボード（/）
- 価格推移グラフ（主要機種）
- 最新価格一覧
- 在庫サマリー（Phase 5以降）

### 価格一覧（/prices）
- 全機種の最新価格テーブル
- 機種でフィルター
- CSVエクスポート

### 価格詳細（/prices/[model]）
- 特定機種の価格推移グラフ
- 価格履歴テーブル

### 在庫管理（/inventory）※Phase 5
- 在庫一覧
- ステータス別フィルター
- 新規登録フォーム

### 在庫詳細（/inventory/[id]）※Phase 5
- 在庫詳細・編集
- ステータス変更
- 利益計算表示

---

## API設計

### 価格関連

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/prices | 価格一覧取得 |
| GET | /api/prices/latest | 最新価格取得 |
| GET | /api/prices/[model] | 特定機種の価格履歴 |
| POST | /api/prices | 価格データ登録（OCR結果） |

### 在庫関連（Phase 5）

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/inventory | 在庫一覧取得 |
| GET | /api/inventory/[id] | 在庫詳細取得 |
| POST | /api/inventory | 在庫登録 |
| PUT | /api/inventory/[id] | 在庫更新 |
| DELETE | /api/inventory/[id] | 在庫削除 |

---

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## データソース

- **モバイルミックス公式サイト**: https://mobile-mix.jp/
- **モバイルミックスX**: https://x.com/mobilemix2015

### OCR抽出パターン（参考）

```python
pattern = r'(iPhone\s*[\w\s]+?\d+(?:GB|TB))\s+(\d{1,3}(?:,\d{3})*円)'
```
