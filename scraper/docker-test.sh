# Dockerビルドテスト用スクリプト

# Dockerイメージをビルド
docker build -t resale-tracker-scraper .

# コンテナを実行（環境変数を渡す）
docker run --rm \
  -e SUPABASE_URL=https://sudycxugnvprrrrlkdmm.supabase.co \
  -e SUPABASE_KEY=your_supabase_anon_key \
  resale-tracker-scraper
