# GitHub セットアップガイド

## リポジトリの作成とプッシュ

### 1. GitHubでリポジトリを作成

1. https://github.com/new にアクセス
2. 以下の設定でリポジトリを作成:
   - **Repository name**: `resale-tracker`
   - **Description**: iPhone買取価格追跡アプリ - 自動スクレイピング + Next.js ダッシュボード
   - **Public** または **Private** を選択
   - **Initialize this repository with:** すべてチェックを外す（既存のリポジトリをプッシュするため）

### 2. リモートリポジトリを追加してプッシュ

リポジトリ作成後、以下のコマンドを実行:

```bash
# リモートリポジトリを追加（YOUR_USERNAMEを自分のGitHubユーザー名に置き換え）
git remote add origin https://github.com/YOUR_USERNAME/resale-tracker.git

# ブランチ名をmainに変更（既にmasterの場合）
git branch -M main

# プッシュ
git push -u origin main
```

### 3. 確認

プッシュ成功後、以下を確認:
- https://github.com/YOUR_USERNAME/resale-tracker にアクセス
- すべてのファイルがプッシュされていることを確認
- `.env.local` と `scraper/.env` が含まれていないことを確認

## 現在のGit状態

```
On branch master
nothing to commit, working tree clean
```

すべての変更がコミット済みで、プッシュ準備完了です。

## コミット履歴

```
629f1f2 chore: .gitignoreにscraper/.envを追加
b2fee4e feat: テーブルの並び順をグラフと統一
90cb72b feat: UI改善 - 機種並び順変更、無制限選択、クリアボタン追加
61c19be Phase 4 complete: フロントエンド実装 - グラフと一覧表示
56f7d49 Phase 3 complete: Renderデプロイ設定を追加
7b37062 feat: Supabase連携完了 - 12件の価格データ保存成功
9605c1b docs: Supabaseセットアップガイドとデータベース初期化SQLを追加
5fd6ecf refactor: OCRからDOM取得への変更 - 12件の価格抽出成功
9e2176b Phase 2 complete: 自動スクレイピング（Playwright + OCR）
...
```

## トラブルシューティング

### リモートが既に存在する場合

```bash
# 既存のリモートを削除
git remote remove origin

# 新しいリモートを追加
git remote add origin https://github.com/YOUR_USERNAME/resale-tracker.git
```

### ブランチ名の確認

```bash
# 現在のブランチ名を確認
git branch

# masterからmainに変更
git branch -M main
```

### 認証エラーの場合

GitHubの認証方法:
1. **Personal Access Token (推奨)**
   - Settings → Developer settings → Personal access tokens → Generate new token
   - `repo` スコープを選択
   - トークンをパスワードとして使用

2. **SSH**
   - SSH鍵を設定済みの場合: `git@github.com:YOUR_USERNAME/resale-tracker.git`
