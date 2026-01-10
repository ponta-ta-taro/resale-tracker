# ResaleTracker Scraper - Dockerfile
# Python 3.11 + Playwright + Chromium

FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムパッケージの更新と必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Python依存パッケージをコピー
COPY requirements.txt .

# Python依存パッケージをインストール
RUN pip install --no-cache-dir -r requirements.txt

# Playwright Chromiumをインストール
RUN playwright install chromium

# アプリケーションコードをコピー
COPY . .

# スクリーンショット保存用ディレクトリを作成
RUN mkdir -p screenshots

# main.pyを実行
CMD ["python", "main.py"]
