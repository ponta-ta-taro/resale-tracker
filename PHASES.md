# ResaleTracker - 開発フェーズ定義

## 概要

ResaleTrackerは6つのフェーズに分けて段階的に開発を進めます。
各フェーズは独立してデプロイ可能な状態を目指します。

---

## Phase 1: プロジェクト初期セットアップ

### 目標
Next.jsプロジェクトの作成とSupabase連携の基盤を構築する。

### タスク

1. **Next.jsプロジェクト初期化**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --use-npm --eslint
   ```
   - src/ directory: No
   - import alias: No（デフォルト @/*）

2. **パッケージインストール**
   ```bash
   npm install @supabase/supabase-js recharts date-fns
   ```

3. **ディレクトリ構成作成**
   ```
   resale-tracker/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   └── api/
   │       └── prices/
   │           └── route.ts
   ├── components/
   │   ├── PriceChart.tsx
   │   └── PriceTable.tsx
   ├── lib/
   │   └── supabase.ts
   └── types/
       └── index.ts
   ```

4. **型定義作成**（types/index.ts）

5. **Supabaseクライアント設定**（lib/supabase.ts）

6. **環境変数テンプレート作成**（.env.local.example）

7. **ダッシュボードUI作成**（app/page.tsx）
   - タイトル「ResaleTracker」
   - 価格推移グラフのプレースホルダー
   - 価格一覧テーブルのプレースホルダー

8. **GitHubリポジトリ作成・プッシュ**

### 完了条件
- [ ] `npm run dev` でエラーなく起動
- [ ] http://localhost:3000 でダッシュボードが表示される
- [ ] GitHubにプッシュ完了

---

## Phase 2: 自動スクレイピング（Playwright + OCR）

### 目標
モバイルミックスのサイトから自動で価格データを取得する仕組みを構築する。

### タスク

1. **Pythonプロジェクト作成**
   ```
   resale-tracker/
   └── scraper/
       ├── requirements.txt
       ├── scraper.py
       ├── ocr_processor.py
       └── db_client.py
   ```

2. **必要なPythonパッケージ**
   ```
   playwright
   pytesseract
   Pillow
   supabase
   python-dotenv
   ```

3. **Playwrightセットアップ**
   ```bash
   playwright install chromium
   ```

4. **スクレイピングスクリプト作成**（scraper.py）
   - モバイルミックスにアクセス
   - Cookie同意などを処理
   - フルページスクリーンショット取得
   - 画像を保存

5. **OCR処理スクリプト作成**（ocr_processor.py）
   - スクリーンショットからテキスト抽出
   - 正規表現で価格情報をパース
   - 構造化データに変換

6. **DB保存スクリプト作成**（db_client.py）
   - Supabaseに接続
   - 価格データを保存

7. **メインスクリプト統合**
   - スクレイピング → OCR → DB保存を一連の流れで実行

8. **ローカルでテスト実行**

### 完了条件
- [ ] `python scraper/scraper.py` で価格データがSupabaseに保存される
- [ ] OCRで正しく価格が抽出される（精度90%以上）

---

## Phase 3: Renderデプロイ + 定期実行

### 目標
スクレイピングを毎日自動実行する環境を構築する。

### タスク

1. **Render用設定ファイル作成**
   ```
   scraper/
   ├── Dockerfile
   └── render.yaml
   ```

2. **Dockerfile作成**
   - Python 3.11ベース
   - Playwright + Chromium
   - Tesseract OCR（日本語対応）

3. **Renderプロジェクト作成**
   - Background Worker として設定
   - 環境変数設定（Supabase接続情報）

4. **Cron Job設定**
   - 毎日 AM 10:00（JST）に実行
   - または Render Cron Jobs を使用

5. **エラー通知設定（オプション）**
   - 失敗時にメール or Slack通知

6. **動作確認**
   - 手動トリガーでテスト
   - 翌日の自動実行を確認

### 完了条件
- [ ] Renderにデプロイ完了
- [ ] 毎日自動で価格データが収集される
- [ ] エラー時に気づける仕組みがある

---

## Phase 4: フロントエンド（価格グラフ・一覧表示）

### 目標
収集した価格データを可視化するUIを構築する。

### タスク

1. **価格一覧ページ作成**（app/prices/page.tsx）
   - 全機種の最新価格をテーブル表示
   - 機種名でフィルター
   - 容量でフィルター

2. **価格詳細ページ作成**（app/prices/[model]/page.tsx）
   - 特定機種の価格推移グラフ（Recharts）
   - 価格履歴テーブル
   - 期間フィルター

3. **PriceChartコンポーネント実装**
   - Rechartsで線グラフ
   - 複数機種の比較表示
   - ツールチップで詳細表示

4. **PriceTableコンポーネント実装**
   - ソート機能
   - ページネーション

5. **ダッシュボード更新**
   - 主要機種のグラフ表示
   - 最新価格サマリー

6. **APIエンドポイント実装**
   - GET /api/prices
   - GET /api/prices/latest
   - GET /api/prices/[model]

7. **Vercelにデプロイ**

### 完了条件
- [ ] 価格推移グラフが正しく表示される
- [ ] 価格一覧が表示される
- [ ] Vercelで本番公開

---

## Phase 5: 在庫管理機能

### 目標
仕入れたiPhoneの在庫・利益を管理する機能を追加する。

### タスク

1. **Supabaseにinventoryテーブル作成**

2. **在庫一覧ページ作成**（app/inventory/page.tsx）
   - 在庫一覧テーブル
   - ステータス別フィルター
   - 新規登録ボタン

3. **在庫登録フォーム作成**（app/inventory/new/page.tsx）
   - 機種選択（ドロップダウン）
   - 容量、色、IMEI
   - 仕入れ価格、仕入れ元
   - 販売予想価格

4. **在庫詳細ページ作成**（app/inventory/[id]/page.tsx）
   - 詳細情報表示
   - ステータス変更
   - 編集フォーム
   - 利益計算表示

5. **利益計算ロジック実装**
   - 利益 = 実売価格 - 仕入れ価格
   - 利益率 = 利益 / 仕入れ価格 × 100

6. **ダッシュボードに在庫サマリー追加**
   - ステータス別件数
   - 今月の利益合計

7. **APIエンドポイント実装**
   - CRUD操作

### 完了条件
- [ ] 在庫の登録・編集・削除ができる
- [ ] ステータス管理ができる
- [ ] 利益が自動計算される

---

## Phase 6: 価格予測（Azure ML）

### 目標
過去の価格データから将来の価格トレンドを予測する。

### タスク

1. **Azure MLワークスペース作成**

2. **データエクスポート機能**
   - Supabaseから学習用データをエクスポート

3. **予測モデル構築**
   - 時系列予測モデル
   - 機種別にモデル作成

4. **APIエンドポイント作成**
   - Azure MLの推論エンドポイントを呼び出し

5. **予測結果表示UI**
   - 予測グラフ
   - 売り時・買い時のアドバイス

### 完了条件
- [ ] 価格予測が表示される
- [ ] 予測精度が実用レベル

---

## フェーズ進行ルール

1. **各フェーズは順番に進める**
   - 前のフェーズが完了してから次へ

2. **完了条件をすべて満たしてから次へ**
   - チェックリストを確認

3. **フェーズ完了時はGitHubにコミット**
   - コミットメッセージ: `Phase X complete: [概要]`

4. **問題が発生したらログに記録**
   - DEV_LOG.mdに記載
