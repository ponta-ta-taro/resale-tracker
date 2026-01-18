# ResaleTracker 開発引き継ぎメモ

> **運用ルール**
> - このファイルは常に最新の状態に上書き更新する
> - 大きな進捗（Phase完了、新機能実装完了）があったら `docs/handover/日付.md` にアーカイブ
> - 決定事項・技術詳細は `docs/V2_DECISIONS.md` を参照

---

## 現在の状態

**Phase 2 進行中** - 注文確認メール自動取り込み完了

---

## 本番URL

| サービス | URL |
|---------|-----|
| **Webサイト** | https://resale-tracker-opal.vercel.app |
| **GitHub** | https://github.com/ponta-ta-taro/resale-tracker |
| **Supabase** | https://supabase.com/dashboard （プロジェクト: resale-tracker） |
| **Render** | https://dashboard.render.com （サービス: resale-tracker-scraper） |
| **Cloudflare** | Email Worker（import@rt-mail.uk） |

---

## 完了済み（直近）

- [x] **Phase 1**: DB基盤構築完了（8テーブル作成、RLS設定）
- [x] **在庫管理UI**: 一覧・登録・編集ページ、ステータス進捗バー
- [x] **Phase 2 注文確認メール**:
  - /api/mail/webhook 全面改修（Gmail転送対応）
  - 注文確認メールのパース・在庫登録
  - 複数商品対応（item_index）
  - 実メールでのテスト成功（W1699438321: 2台登録）
  - order_token抽出・保存機能追加（将来のスクレイピング用）
  - **order_token取得方法判明**: メール内URLからは取得不可、リダイレクト経由で取得可能
- [x] **email_logs記録機能**: 実際のDB構造に合わせて修正
- [x] **在庫詳細ページ**: Reactエラー修正（データサニタイゼーション）
- [x] **React error #438修正**: Client Componentで use(params) → useParams() に変更、API側で明示的カラム選択
- [x] **お届け日変更メールサンプル追加**: 02a_delivery_date_update（email-samples/README.md更新）
- [x] **order_token HTML抽出修正**: text/html部分からもorder_token抽出可能に（フォールバック処理追加）
- [x] **スキーマキャッシュ問題解決**: `NOTIFY pgrst, 'reload schema'` で対応
- [x] **order_token自動取得機能**: リダイレクト経由でtoken取得するヘルパー関数追加、メール本文に無い場合のフォールバック動作実装
- [x] **email_logs確認UI**: 期間/種類/結果フィルター、行展開、生メール・パース結果モーダル、受信アドレス列
- [x] **email_logs保存充実化**: raw_content保存、parsed_data詳細化（機種名、価格、日付等）
- [x] **「Appleで確認」ボタン**: 在庫詳細ページにApple注文ステータスへのリンクボタン追加（contact_email使用）
- [x] **ステータス進捗バー上揃え**: 円とラベルを2行に分離、段差解消
- [x] **設定画面バグ修正**:
  - Apple ID登録（POST）: user_id追加でRLS違反解消
  - Apple ID更新（PUT）: 認証追加 + バリデーション修正（名前のみ必須、ゲストID対応）
  - Apple ID削除（DELETE）: 認証追加
  - クレジットカード登録（POST）: user_id追加でRLS違反解消
  - 締め日・支払日に「末日」選択肢追加（値: 31）
- [x] **Next.js 14 Dynamic Server Usage修正**: 全19 APIルートに`export const dynamic = 'force-dynamic'`追加
- [x] **設定画面バグ修正完了**:
  - 連絡先メールアドレス重複登録防止（POST/PUT両方、maybeSingle使用）
  - 電話番号登録修正（DBカラム: phone→phone_number, notes→label, is_active追加）
  - エラーメッセージ改善（APIからの具体的なメッセージを表示）
  - 全マスタの重複チェック追加（電話番号、Apple ID、支払い方法）
  - 締め日・支払日「末日」→「31日」表示に変更
- [x] **メール転送テスト**: Cloudflare Worker → Vercel Webhook の接続確認完了
- [x] **転送元メールアドレス認証**: contact_emails に登録されたアドレスからの転送のみ処理される仕組みを確認
- [x] **email_logs結果表示改善**: スキップ（未対応）/スキップ（重複）を区別、色分け表示
- [x] **お届け日変更メール対応**: delivery_updateメール種別追加、パーサー実装、在庫更新
- [x] **Gmail転送対応**: quoted-printableデコードのUTF-8対応、class属性に依存しないパーサー
- [x] **お届け予定日上書き問題修正**: UPDATE時にexpected_deliveryは保護（上書きしない）
- [x] **重複検出ロジック実装**: 同じメール再転送時に「スキップ（重複）」表示、カウント追跡
- [x] **order_token関連コード削除**: 毎回変わるセッショントークンで不要と判明、51行削減
- [x] **DB整理**: inventory.order_tokenカラム削除、inventory_v1_backupテーブル削除
- [x] **Gmail過去メール一括転送テスト**: 成功、注文確認・お届け日変更が正常処理
- [x] **iCloud転送動作確認**: Gmail転送と同様に処理可能と判明
- [x] **配送通知パーサー確認**: 「お客様の商品は配送中です」は既に対応済み、tracking_number取得OK
- [x] **iCloudパーサー修正**: `<blockquote type="cite">`ラッパー除去、color抽出の正規表現厳密化
- [x] **Amazon対応**: 注文確認・発送・配達通知のパーサー実装完了
  - `lib/amazonMailParser.ts` 新規作成
  - 注文番号形式: `xxx-xxxxxxx-xxxxxxx`
  - 在庫コード形式: `A{order_number}-{item_index}`
  - source='amazon' で識別
  - 配送時間帯対応（例: 5:00 AM - 11:59 AM）

---

## 次にやること

1. **パーサー修正後の再テスト**
   - Vercelデプロイ確認
   - inventoryデータをクリア（`DELETE FROM inventory;`）
   - Gmail/iCloudからメール再転送
   - colorが正しく抽出されるか確認

2. **Amazon対応テスト**
   - Amazon注文確認メール転送テスト
   - Amazon発送通知テスト
   - Amazon配達完了テスト
   - email_logs UI確認

3. **買取販売情報の記入・テスト**

---

## 注意事項

### 保持するデータ
- `price_history`テーブル：モバイルミックスからのスクレイピングデータ（毎朝10時自動取得）
- `users`関連：認証情報

### 破棄してOKなデータ
- `inventory_v1_backup`：V1のテストデータのみ、本番運用データなし

---

## 技術メモ

### Apple注文ステータスページURL
- 正しいURL: `https://secure8.store.apple.com/jp/shop/order/guest/{order_number}/{contact_email}`
- order_tokenは不要（一時的なセッショントークンで使えない）

### Apple注文ページのスクレイピング
- ページはJavaScript SPA（`<div id="portal">` のみ）
- 単純なfetchでは中身取得不可
- Puppeteer等ヘッドレスブラウザが必要

### メール転送形式の違い

| 転送元 | 形式 | 対応状況 |
|--------|------|----------|
| Gmail | 元のAppleメールがほぼそのまま | ✅ 対応済み |
| iCloud | 「iCloudから送信」ラッパーで包まれる | ❌ 要対応 |

### Webhook認証
- `contact_emails` テーブルに登録されたメールアドレスからの転送のみ処理
- 未登録アドレスは「No user found for email」でスキップ

### Gmail転送時のエンコーディング
- HTMLパートはquoted-printable形式
- `=XX` 形式をバイト配列に変換後、UTF-8としてデコードが必要
- class属性が削除されるため、正規表現で直接抽出する

### メール種別と処理

| 件名パターン | email_type | 処理内容 |
|-------------|-----------|---------|
| ご注文の確認 | order | 在庫登録（upsert） |
| ご注文に関するお知らせ | delivery_update | お届け日更新 |

### お届け予定日の保護ルール
- 注文確認メール再処理時、`expected_delivery_start/end`は更新しない
- `original_expected_delivery_start/end`のみ設定（未設定の場合）
- お届け日変更メールのみが`expected_delivery`を更新可能

### iCloud転送の構造
- 「iCloudから送信」ラッパーで包まれる
- 元メールは `<blockquote type="cite">` 内に格納
- パーサーで前処理としてラッパー除去を実装済み
- ログに「📧 iCloud wrapper detected」と表示される

### colorフィールドのバグと修正
- 問題: 正規表現が「コズミックオレンジ」以降のテキスト全体を取り込んでいた
- 修正: 価格記号（¥、円）や配送キーワード（出荷、お届け、配送）で停止するよう変更
- 既存データ修正用: `scripts/fix_color_field.sql`

### Amazon Email Parsing

#### 差出人アドレス
- 注文確認: `auto-confirm@amazon.co.jp`
- 発送通知: `shipment-tracking@amazon.co.jp`
- 配達状況: `shipment-tracking@amazon.co.jp` (件名で判別)

#### 注文番号形式
- Amazon: `xxx-xxxxxxx-xxxxxxx` (例: `250-8477857-2415055`)
- Apple: `Wxxxxxxxxxx`

#### 在庫コード形式
- Amazon: `A{order_number}-{item_index}` (例: `A250-8477857-2415055-1`)
- Apple: `W{order_number}-{item_index}` (例: `W1234567890-1`)

#### 配送時間帯
- Amazonは時間帯まで指定される (例: 「明日5:00 午前～11:59 午前」)
- `expected_delivery_start/end` に時刻付きで保存
- 「明日」「本日」は実際の日付に変換

#### Source識別
- `inventory.source = 'amazon'` で Amazon注文を識別
- `inventory.source = 'apple_store'` で Apple注文を識別

---

## 参照ドキュメント

| ファイル | 内容 |
|----------|------|
| `V2_DECISIONS.md` | **決定事項・技術詳細** |
| `SPEC.md` | V2仕様書（要件、機能、画面構成） |
| `DATABASE.md` | テーブル定義（9テーブル） |
| `API.md` | APIエンドポイント一覧 |
| `RULES.md` | コーディング規約 |
| `SETUP.md` | 環境構築手順 |
| `email-samples/` | メールサンプル |
| `handover/` | アーカイブ（過去の引き継ぎメモ） |

---

## Antigravityへの指示テンプレート

```
[タスクの説明]

## 参照ドキュメント
- docs/DATABASE.md
- docs/SPEC.md

## やること
1. xxx
2. xxx

## 修正ファイル
- xxx.tsx
- xxx.ts

## 完了したらプッシュして報告
```
