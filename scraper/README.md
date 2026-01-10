# ResaleTracker Scraper

モバイルミックスの価格データを自動収集するPythonスクレイパー

## セットアップ

### 1. Python環境

Python 3.8以上が必要です。

### 2. 依存パッケージのインストール

```bash
cd scraper
pip install -r requirements.txt
```

### 3. Playwrightのセットアップ

```bash
playwright install chromium
```

### 4. Tesseractのインストール

#### Windows
1. https://github.com/UB-Mannheim/tesseract/wiki からインストーラーをダウンロード
2. インストール時に「Additional language data」で日本語(jpn)を選択
3. 環境変数PATHにTesseractのパスを追加（例: `C:\Program Files\Tesseract-OCR`）

#### macOS
```bash
brew install tesseract tesseract-lang
```

#### Linux
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-jpn
```

### 5. 環境変数の設定

`.env`ファイルに以下を設定（既に作成済み）:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 使い方

### メインスクリプトの実行

```bash
python main.py
```

これにより以下が自動実行されます:
1. モバイルミックスのサイトにアクセス
2. フルページスクリーンショットを取得
3. OCRで価格情報を抽出
4. Supabaseに保存

### 個別スクリプトの実行

#### スクリーンショットのみ取得
```bash
python scraper.py
```

#### OCR処理のみ実行
```bash
python ocr_processor.py screenshots/mobile_mix_20240110_120000.png
```

#### データベース接続テスト
```bash
python db_client.py
```

## ファイル構成

- `main.py` - メインスクリプト（全処理を統合）
- `scraper.py` - Playwrightでスクリーンショット取得
- `ocr_processor.py` - Tesseract OCRで価格抽出
- `db_client.py` - Supabaseへのデータ保存
- `requirements.txt` - Python依存パッケージ
- `.env` - 環境変数（Gitで管理しない）
- `screenshots/` - スクリーンショット保存先（自動作成）

## トラブルシューティング

### Tesseractが見つからない
```
pytesseract.pytesseract.TesseractNotFoundError
```
→ Tesseractをインストールし、PATHを通してください

### OCRで価格が抽出できない
- `screenshots/`フォルダのスクリーンショットを確認
- サイトのレイアウトが変更されている可能性
- OCRパターン（正規表現）の調整が必要

### Supabase接続エラー
- `.env`ファイルの設定を確認
- SupabaseのURLとKeyが正しいか確認
- `price_history`テーブルが作成されているか確認
