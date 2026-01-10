"""
モバイルミックスのサイトから価格情報を取得するスクレイパー
DOM要素から直接価格を抽出（OCRは使用しない）
"""
import os
import re
from datetime import datetime
from typing import List, Dict
from playwright.sync_api import sync_playwright


class MobileMixScraper:
    def __init__(self, output_dir: str = "screenshots"):
        self.url = "https://mobile-mix.jp/"
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def parse_model_and_storage(self, text: str) -> tuple:
        """
        モデル名テキストから機種名と容量を分離
        
        Args:
            text: "iPhone 17 Pro Max 256GB" のようなテキスト
            
        Returns:
            tuple: (model_name, storage)
        """
        # 容量パターン（256GB, 1TBなど）
        storage_match = re.search(r'(\d+(?:GB|TB))', text)
        if storage_match:
            storage = storage_match.group(1)
            # 容量部分を除いた残りがモデル名
            model_name = text[:storage_match.start()].strip()
        else:
            model_name = text.strip()
            storage = "不明"
        
        return model_name, storage
    
    def parse_price(self, price_text: str) -> int:
        """
        価格テキストを数値に変換
        
        Args:
            price_text: "203,000円" のようなテキスト
            
        Returns:
            int: 価格（円）
        """
        # 数字とカンマのみ抽出
        price_str = re.sub(r'[^\d,]', '', price_text)
        # カンマを削除して数値に変換
        return int(price_str.replace(',', ''))
    
    def extract_prices(self) -> List[Dict]:
        """
        モバイルミックスのサイトから価格情報を抽出
        
        Returns:
            List[Dict]: 価格情報のリスト
        """
        prices = []
        captured_at = datetime.now()
        
        with sync_playwright() as p:
            # Chromiumブラウザを起動
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            page = context.new_page()
            
            try:
                print(f"アクセス中: {self.url}")
                page.goto(self.url, wait_until="networkidle", timeout=60000)
                
                # Cookie同意ボタンがあれば処理
                try:
                    cookie_selectors = [
                        'button:has-text("同意")',
                        'button:has-text("Accept")',
                        'button:has-text("OK")',
                    ]
                    for selector in cookie_selectors:
                        if page.locator(selector).count() > 0:
                            page.locator(selector).first.click()
                            page.wait_for_timeout(1000)
                            break
                except Exception as e:
                    print(f"Cookie同意処理スキップ: {e}")
                
                # ページが完全に読み込まれるまで待機
                page.wait_for_timeout(3000)
                
                # スクリーンショットを保存（デバッグ用）
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_path = os.path.join(self.output_dir, f"mobile_mix_{timestamp}.png")
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"スクリーンショット保存: {screenshot_path}")
                
                # 価格テーブルの行を取得
                # サイトの構造に応じて適切なセレクタを使用
                # 一般的なパターンを試す
                
                # パターン1: テーブル行
                rows = page.query_selector_all('table tr, tbody tr')
                
                print(f"\n価格情報を抽出中... ({len(rows)}行を検出)")
                
                for row in rows:
                    try:
                        # 行のテキストを取得
                        row_text = row.inner_text()
                        
                        # iPhoneを含む行のみ処理
                        if 'iPhone' not in row_text:
                            continue
                        
                        # 行内のセルを取得
                        cells = row.query_selector_all('td, th')
                        
                        if len(cells) >= 2:
                            # 最初のセルに機種名、後のセルに価格があると仮定
                            model_text = cells[0].inner_text().strip()
                            
                            # 価格を含むセルを探す
                            price_text = None
                            for cell in cells[1:]:
                                cell_text = cell.inner_text().strip()
                                if '円' in cell_text and re.search(r'\d', cell_text):
                                    price_text = cell_text
                                    break
                            
                            if price_text:
                                # モデル名と容量を分離
                                model_name, storage = self.parse_model_and_storage(model_text)
                                
                                # 価格を数値に変換
                                price = self.parse_price(price_text)
                                
                                prices.append({
                                    'model_name': model_name,
                                    'storage': storage,
                                    'price': price,
                                    'color_note': None,
                                    'captured_at': captured_at.isoformat()
                                })
                                
                                print(f"  ✓ {model_name} {storage}: {price:,}円")
                    
                    except Exception as e:
                        # 個別の行のエラーはスキップ
                        continue
                
                print(f"\n合計 {len(prices)}件の価格情報を抽出しました")
                
                return prices
                
            except Exception as e:
                print(f"エラー: {e}")
                raise
            finally:
                browser.close()


if __name__ == "__main__":
    scraper = MobileMixScraper()
    prices = scraper.extract_prices()
    
    print("\n" + "=" * 60)
    print("抽出された価格情報:")
    print("=" * 60)
    for i, price in enumerate(prices, 1):
        print(f"{i}. {price['model_name']} {price['storage']}: {price['price']:,}円")
