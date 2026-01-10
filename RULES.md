# ResaleTracker - 開発ルール

## コーディング規約

### 言語・フレームワーク

- **TypeScript**を使用（anyは極力避ける）
- **Next.js App Router**を使用
- **Tailwind CSS**でスタイリング

### ファイル命名規則

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| コンポーネント | PascalCase | `PriceChart.tsx` |
| ページ | 小文字 | `app/prices/page.tsx` |
| ユーティリティ | camelCase | `lib/supabase.ts` |
| 型定義 | PascalCase | `types/index.ts` |
| API Route | 小文字 | `app/api/prices/route.ts` |

### 変数・関数命名規則

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| 変数 | camelCase | `priceHistory` |
| 定数 | UPPER_SNAKE_CASE | `MAX_ITEMS` |
| 関数 | camelCase | `fetchPrices()` |
| コンポーネント | PascalCase | `PriceChart` |
| 型・インターフェース | PascalCase | `PriceHistory` |
| イベントハンドラ | handle + 動詞 | `handleSubmit` |

### ディレクトリ構成

```
resale-tracker/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── prices/
│   │   ├── page.tsx
│   │   └── [model]/
│   │       └── page.tsx
│   ├── inventory/          # Phase 5
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── api/
│       ├── prices/
│       │   └── route.ts
│       └── inventory/      # Phase 5
│           └── route.ts
├── components/             # 再利用可能なコンポーネント
│   ├── ui/                 # 汎用UIコンポーネント
│   ├── PriceChart.tsx
│   ├── PriceTable.tsx
│   └── ...
├── lib/                    # ユーティリティ・設定
│   ├── supabase.ts
│   └── utils.ts
├── types/                  # 型定義
│   └── index.ts
├── scraper/                # Phase 2: Pythonスクレイパー
│   ├── requirements.txt
│   ├── scraper.py
│   ├── ocr_processor.py
│   └── db_client.py
└── docs/                   # ドキュメント
    ├── SPEC.md
    ├── PHASES.md
    └── RULES.md
```

---

## コンポーネント設計ルール

### 1. Server Components をデフォルトに

- データフェッチはServer Componentsで行う
- インタラクティブな部分のみ `'use client'` を使用

### 2. コンポーネントの分割基準

- 1ファイル200行以内を目安
- 再利用可能なものは `components/` に切り出す
- ページ固有のものはページファイル内でOK

### 3. Propsの型定義

```typescript
// Good
interface PriceChartProps {
  data: PriceHistory[];
  modelName: string;
}

export default function PriceChart({ data, modelName }: PriceChartProps) {
  // ...
}
```

---

## API設計ルール

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
| 404 | Not Found |
| 500 | サーバーエラー |

### エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}
```

---

## Git運用ルール

### ブランチ戦略

- `main`: 本番環境（Vercelに自動デプロイ）
- 基本的にmainに直接プッシュでOK（個人開発のため）

### コミットメッセージ

```
[タイプ]: 概要

例:
feat: 価格一覧ページを追加
fix: グラフ表示のバグを修正
docs: READMEを更新
refactor: PriceTableコンポーネントをリファクタリング
style: コードフォーマットを修正
chore: パッケージを更新
```

### フェーズ完了時

```
Phase X complete: 概要
```

---

## Supabaseルール

### テーブル命名

- 小文字スネークケース: `price_history`, `inventory`

### カラム命名

- 小文字スネークケース: `model_name`, `created_at`

### RLS（Row Level Security）

- 今回は個人利用のため、RLSは無効でOK
- 将来的にマルチユーザー対応する場合は有効化

---

## 禁止事項

1. **`any`型の多用**
   - 型が分からない場合は `unknown` を使い、型ガードで絞り込む

2. **console.logの放置**
   - デバッグ後は削除する
   - 本番用のログは `console.error` のみ

3. **ハードコーディング**
   - 環境依存の値は環境変数に
   - マジックナンバーは定数に

4. **未使用のimport/変数**
   - ESLintで検出されるので削除する

5. **巨大なコンポーネント**
   - 300行を超えたら分割を検討

---

## Antigravity向け指示ルール

### 指示の出し方

1. **フェーズを明示する**
   ```
   Phase 1を開始してください。
   SPEC.md、PHASES.md、RULES.mdを読んで進めてください。
   ```

2. **完了報告を求める**
   ```
   完了したら、何を作成したか報告してください。
   ```

3. **All Acceptで進める**
   - 基本的にすべての変更を受け入れる
   - 明らかにおかしい場合のみ介入

### トラブル時

1. エラーメッセージをコピー
2. Claudeに報告
3. Claudeが修正プロンプトを作成
4. Antigravityに修正を依頼

---

## チェックリスト

### 新機能追加時
- [ ] 型定義を追加したか
- [ ] エラーハンドリングを実装したか
- [ ] コンポーネントは適切に分割されているか

### コミット前
- [ ] `npm run build` が通るか
- [ ] 未使用のimportがないか
- [ ] console.logを削除したか

### デプロイ前
- [ ] 環境変数は設定されているか
- [ ] ビルドエラーがないか
