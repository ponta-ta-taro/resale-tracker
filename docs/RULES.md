# ResaleTracker V2 - 開発ルール

## 1. 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Google OAuth) |
| グラフ | Recharts |
| メール処理 | Cloudflare Email Workers |
| ホスティング | Vercel |
| 価格スクレイピング | Python + Playwright (Render) |

---

## 2. ディレクトリ構成

```
resale-tracker/
├── app/                      # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx              # ダッシュボード
│   ├── inventory/
│   │   ├── page.tsx          # 在庫一覧
│   │   ├── new/page.tsx      # 在庫登録
│   │   └── [id]/page.tsx     # 在庫詳細・編集
│   ├── prices/
│   │   └── page.tsx          # 価格一覧
│   ├── emails/
│   │   └── page.tsx          # メール履歴
│   ├── settings/
│   │   ├── page.tsx          # 設定トップ
│   │   ├── apple-accounts/
│   │   ├── contacts/
│   │   └── payment-methods/
│   ├── login/
│   │   └── page.tsx          # ログイン
│   ├── auth/
│   │   └── callback/route.ts # 認証コールバック
│   └── api/
│       ├── inventory/
│       ├── prices/
│       ├── emails/
│       ├── mail/webhook/     # メール受信Webhook
│       └── dashboard/
├── components/               # 再利用コンポーネント
│   ├── ui/                   # 汎用UI
│   ├── Header.tsx
│   ├── StatusProgressBar.tsx
│   └── ...
├── lib/                      # ユーティリティ
│   ├── supabase.ts           # ブラウザ用クライアント
│   ├── supabase-server.ts    # サーバー用クライアント
│   └── utils.ts
├── types/                    # 型定義
│   └── index.ts
├── docs/                     # ドキュメント
│   ├── SPEC.md
│   ├── DATABASE.md
│   ├── RULES.md
│   ├── HANDOVER.md
│   └── email-samples/        # メールサンプル
└── scraper/                  # 価格スクレイピング（Python）
```

---

## 3. 命名規則

### ファイル名

| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `StatusProgressBar.tsx` |
| ページ | 小文字 | `app/inventory/page.tsx` |
| API Route | 小文字 | `app/api/inventory/route.ts` |
| ユーティリティ | camelCase | `lib/supabase.ts` |
| 型定義 | PascalCase | `types/index.ts` |

### 変数・関数名

| 種類 | 規則 | 例 |
|------|------|-----|
| 変数 | camelCase | `inventoryList` |
| 定数 | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| 関数 | camelCase | `fetchInventory()` |
| コンポーネント | PascalCase | `InventoryTable` |
| 型・インターフェース | PascalCase | `Inventory` |
| イベントハンドラ | handle + 動詞 | `handleSubmit` |

### データベース

| 種類 | 規則 | 例 |
|------|------|-----|
| テーブル名 | snake_case | `price_history` |
| カラム名 | snake_case | `order_number` |

---

## 4. コーディング規約

### TypeScript

```typescript
// ❌ Bad: any型
const data: any = fetchData();

// ✅ Good: 型を明示
const data: Inventory[] = fetchData();
```

### コンポーネント

```typescript
// ✅ Good: Props型を定義
interface InventoryTableProps {
  items: Inventory[];
  onSelect: (id: string) => void;
}

export default function InventoryTable({ items, onSelect }: InventoryTableProps) {
  // ...
}
```

### Server Components vs Client Components

- **デフォルトはServer Components**（データフェッチ用）
- **`'use client'`は必要な時だけ**（イベントハンドラ、useState等）

---

## 5. API設計

### レスポンス形式

```typescript
// 成功時
{
  "data": [...],
  "count": 100
}

// エラー時
{
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（GET, PUT） |
| 201 | 作成成功（POST） |
| 400 | リクエストエラー |
| 401 | 認証エラー |
| 404 | Not Found |
| 500 | サーバーエラー |

---

## 6. Git運用

### ブランチ

- `main`: 本番環境（Vercelに自動デプロイ）
- `v2-rebuild`: V2開発用ブランチ

### コミットメッセージ

```
[タイプ]: 概要

例:
feat: 在庫登録フォームを追加
fix: ステータス更新のバグを修正
docs: SPEC.mdを更新
refactor: InventoryTableをリファクタリング
style: コードフォーマットを修正
chore: パッケージを更新
```

---

## 7. Antigravityへの指示ルール

### 基本フォーマット

```
[タスクの説明]

## 参照ドキュメント
- docs/SPEC.md（要件）
- docs/DATABASE.md（テーブル定義）

## やること
1. xxx
2. xxx

## 修正ファイル
- app/inventory/page.tsx
- types/index.ts

## 注意点
- xxxに気をつける

## 完了したら
GitHubにプッシュして報告してください。
確認なしでAll Acceptで進めてOK。
```

### 重要なルール

1. **ドキュメントを参照させる** - SPEC.md、DATABASE.mdを必ず指定
2. **修正ファイルを明示** - どのファイルを触るか具体的に
3. **確認なしで進める** - 途中の質問を減らす
4. **完了報告を求める** - 何を作ったか把握する

---

## 8. 環境変数

### 必須

```
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Vercel設定

Settings → Environment Variables で設定

---

## 9. 禁止事項

1. **`any`型の多用** - 型が分からない場合は`unknown`を使う
2. **console.logの放置** - デバッグ後は削除
3. **ハードコーディング** - 環境依存の値は環境変数に
4. **未使用のimport** - ESLintで検出されるので削除
5. **巨大なコンポーネント** - 300行超えたら分割を検討

---

## 10. チェックリスト

### 新機能追加時
- [ ] 型定義を追加したか
- [ ] エラーハンドリングを実装したか
- [ ] RLSポリシーを確認したか

### コミット前
- [ ] `npm run build` が通るか
- [ ] 未使用のimportがないか
- [ ] console.logを削除したか

### デプロイ前
- [ ] 環境変数は設定されているか
- [ ] ビルドエラーがないか
