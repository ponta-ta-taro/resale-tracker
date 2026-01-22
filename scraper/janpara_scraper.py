"""
じゃんぱらのサイトから価格情報を取得するスクレイパー
動的コンテンツ（Playwright必要）
"""
import re
from datetime import datetime
from typing import List, Dict
from playwright.sync_api import sync_playwright
from base_scraper import BaseScraper


class JanparaScraper(BaseScraper):
    def __init__(self, output_dir: str = "screenshots"):
        super().__init__(
            source="janpara",
            url="https://buy.janpara.co.jp/buy/search?outClsCode=78",
            output_dir=output_dir
        )
    
    def extract_prices(self) -> List[Dict]:
        """
        じゃんぱらのサイトから価格情報を抽出
        
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
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = context.new_page()
            
            try:
                print(f"アクセス中: {self.url}")
                page.goto(self.url, wait_until="networkidle", timeout=60000)
                
                # 動的コンテンツの読み込みを待機
                page.wait_for_timeout(3000)
                
                # スクリーンショットを保存
                self.save_screenshot(page)
                
                # 価格情報を含む要素を取得
                # サイトの構造に応じて適切なセレクタを使用
                items = page.query_selector_all('.item, .product, [class*="buy"], [class*="price"]')
                
                print(f"\n価格情報を抽出中... ({len(items)}要素を検出)")
                
                for item in items:
                    try:
                        item_text = item.inner_text()
                        
                        # iPhoneを含む要素のみ処理
                        if 'iPhone' not in item_text:
                            continue
                        
                        # モデル名と価格を抽出
                        lines = item_text.split('\n')
                        model_text = None
                        price_text = None
                        
                        for line in lines:
                            line = line.strip()
                            if 'iPhone' in line:
                                model_text = line
                            elif '円' in line and re.search(r'\d', line):
                                price_text = line
                        
                        if model_text and price_text:
                            # モデル名と容量を分離
                            model_name, storage = self.parse_model_and_storage(model_text)
                            
                            # 価格を数値に変換
                            price = self.parse_price(price_text)
                            
                            if price > 0:
                                # 価格データを作成
                                price_data = self.create_price_data(
                                    model_name=model_name,
                                    storage=storage,
                                    price=price,
                                    color_note=None,
                                    captured_at=captured_at
                                )
                                prices.append(price_data)
                                
                                print(f"  ✓ {model_name} {storage}: {price:,}円")
                    
                    except Exception as e:
                        # 個別の要素のエラーはスキップ
                        continue
                
                print(f"\n合計 {len(prices)}件の価格情報を抽出しました")
                
                return prices
                
            except Exception as e:
                print(f"エラー: {e}")
                raise
            finally:
                browser.close()


if __name__ == "__main__":
    scraper = JanparaScraper()
    prices = scraper.extract_prices()
    
    print("\n" + "=" * 60)
    print("抽出された価格情報:")
    print("=" * 60)
    for i, price in enumerate(prices, 1):
        print(f"{i}. {price['model_name']} {price['storage']}: {price['price']:,}円")
