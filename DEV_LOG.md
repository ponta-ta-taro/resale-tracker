# ResaleTracker - 開発ログ

## プロジェクト情報

| 項目 | 値 |
|------|-----|
| アプリ名 | ResaleTracker |
| 開始日 | 2026/01/10 |
| 現在のフェーズ | Phase 1 |

---

## 完了したタスク

- [x] プロジェクト仕様決定
- [x] 技術スタック決定
- [x] データベース設計
- [x] ドキュメント作成（SPEC.md, PHASES.md, RULES.md）
- [x] OCR抽出テスト成功

---

## 現在の進捗

### Phase 1: プロジェクト初期セットアップ
- [ ] Next.jsプロジェクト初期化
- [ ] パッケージインストール
- [ ] ディレクトリ構成作成
- [ ] 型定義作成
- [ ] Supabaseクライアント設定
- [ ] ダッシュボードUI作成
- [ ] GitHubにプッシュ

---

## 発生したトラブルと対処法

（まだなし - 発生したら記録する）

### テンプレート
```
### [日付] 問題のタイトル

**症状:**
何が起きたか

**原因:**
なぜ起きたか

**対処法:**
どう解決したか

**参考:**
関連リンクなど
```

---

## メモ

### Supabase設定（Phase 1完了後に実施）

1. https://supabase.com でプロジェクト作成
2. プロジェクト名: `resale-tracker`
3. リージョン: Northeast Asia (Tokyo)
4. テーブル作成SQL:

```sql
-- price_history テーブル
create table price_history (
  id uuid default gen_random_uuid() primary key,
  model_name text not null,
  storage text not null,
  price integer not null,
  color_note text,
  captured_at timestamptz not null,
  created_at timestamptz default now() not null
);

-- models テーブル
create table models (
  id uuid default gen_random_uuid() primary key,
  brand text not null,
  series text not null,
  storage text not null,
  created_at timestamptz default now() not null
);

-- インデックス
create index idx_price_history_model on price_history(model_name, storage);
create index idx_price_history_captured_at on price_history(captured_at);
```

5. 環境変数をコピー:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026/01/10 | プロジェクト開始、ドキュメント作成 |
