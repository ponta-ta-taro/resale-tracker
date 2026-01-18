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

---

## 次にやること

1. **Gmailからのメール転送テスト**
   - Gmail転送形式なら既存パーサーで動くはず
   - 過去のApple注文確認メールを `import@rt-mail.uk` に転送

2. **iCloud転送形式対応**（Gmail成功後）
   - 問題: iCloudは「iCloudから送信 転送メッセージの内容:」ラッパーを追加する
   - 結果: 注文番号・日付が取得できずDBエラー（`invalid input syntax for type date: ""`）
   - 対応: 前処理でラッパーを剥がしてから既存パーサーに渡す

3. **日付フィールドのNULL対応**
   - 空文字でINSERTするとエラーになる
   - 空の場合はNULLを渡すように修正

4. **買取販売情報の記入・テスト**
5. **買取伝票の追跡リンク機能**

---

## 注意事項

### 保持するデータ
- `price_history`テーブル：モバイルミックスからのスクレイピングデータ（毎朝10時自動取得）
- `users`関連：認証情報

### 破棄してOKなデータ
- `inventory_v1_backup`：V1のテストデータのみ、本番運用データなし

---

## 技術メモ

### order_token取得方法
- メール内URL: `https://store.apple.com/xc/jp/vieworder/{注文番号}/{メールアドレス}/`
- ↓ リダイレクト
- 実URL: `https://secure9.store.apple.com/jp/shop/order/guest/{注文番号}/{token}`
- fetch with `redirect: 'manual'` → Locationヘッダーからtoken抽出

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
