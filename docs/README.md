# ResaleTracker V2 - ドキュメント

## 📚 ドキュメント一覧

| ファイル | 説明 | 対象者 |
|---------|------|--------|
| [SPEC.md](./SPEC.md) | 仕様書（要件・機能・画面） | 全員 |
| [DATABASE.md](./DATABASE.md) | データベース定義 | 開発者 |
| [API.md](./API.md) | APIエンドポイント一覧 | 開発者 |
| [RULES.md](./RULES.md) | コーディング規約・開発ルール | 開発者 |
| [SETUP.md](./SETUP.md) | 環境構築手順 | 開発者 |
| [HANDOVER.md](./HANDOVER.md) | 引き継ぎメモ（最新状況） | 全員 |

---

## 📁 フォルダ構成

```
docs/
├── README.md           # このファイル
├── SPEC.md             # 仕様書
├── DATABASE.md         # テーブル定義
├── API.md              # API仕様
├── RULES.md            # 開発ルール
├── SETUP.md            # 環境構築
├── HANDOVER.md         # 引き継ぎメモ
├── email-samples/      # メールサンプル
│   ├── apple-account/      # Apple ID注文
│   ├── apple-guest-gmail/  # ゲスト注文
│   └── amazon/             # Amazon購入
└── handover/           # 過去の引き継ぎアーカイブ
```

---

## 🔰 初めての方へ

### 1. まず読むべきドキュメント

1. **SPEC.md** - プロジェクトの全体像を把握
2. **HANDOVER.md** - 現在の状況と次にやるべきことを確認

### 2. 開発を始める前に

1. **SETUP.md** - 環境構築手順に従ってセットアップ
2. **RULES.md** - コーディング規約を確認
3. **DATABASE.md** - テーブル構造を把握
4. **API.md** - APIの仕様を確認

---

## 🔄 ドキュメント更新ルール

### HANDOVER.md
- **毎回のチャット終了時**に最新状態に更新する
- 大きな節目では `docs/handover/` にアーカイブ

### その他のドキュメント
- 機能追加・変更時に該当ドキュメントを更新
- APIを追加したら API.md を更新
- テーブルを変更したら DATABASE.md を更新

---

## 📧 メールサンプルについて

`email-samples/` フォルダには、Appleからのメールサンプルを格納。  
メールパーサー開発時の参照用。

各フォルダにREADME.mdがあり、パース対象フィールドを明記している。

| フォルダ | 説明 | 形式 |
|---------|------|------|
| apple-account/ | Apple ID紐付き注文 | PDF |
| apple-guest-gmail/ | ゲスト注文（Gmail連絡先） | EML |
| amazon/ | Amazon購入 | EML |
