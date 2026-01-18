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
- [x] **email_logs記録機能**: 実際のDB構造に合わせて修正
- [x] **在庫詳細ページ**: Reactエラー修正（データサニタイゼーション）

---

## 次にやること

1. **出荷通知メールのテスト**（Gmailに届き次第）
2. **email_logs確認UIの作成**
3. **請求書PDF対応**（シリアル番号登録）

---

## 注意事項

### 保持するデータ
- `price_history`テーブル：モバイルミックスからのスクレイピングデータ（毎朝10時自動取得）
- `users`関連：認証情報

### 破棄してOKなデータ
- `inventory_v1_backup`：V1のテストデータのみ、本番運用データなし

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
