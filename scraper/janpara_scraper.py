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
                # domcontentloadedで待機（networkidleは使わない）
                page.goto(self.url, wait_until="domcontentloaded", timeout=90000)
                
                # 商品コンテナが表示されるまで待機
                page.wait_for_selector('div.col', timeout=30000)
                page.wait_for_timeout(2000)  # 追加の待機
                
                # スクリーンショットを保存
                self.save_screenshot(page)
                
                # 商品コンテナを取得
                items = page.query_selector_all('div.col')
                
                print(f"\n価格情報を抽出中... ({len(items)}要素を検出)")
                
                for item in items:
                    try:
                        # 機種名を取得
                        model_elem = item.query_selector('p.tit')
                        if not model_elem:
                            continue
                        
                        model_text = model_elem.inner_text().strip()
                        
                        # iPhoneを含むもののみ処理
                        if 'iPhone' not in model_text:
                            continue
                        
                        # モデル名と容量を分離
                        model_name, storage = self.parse_model_and_storage(model_text)
                        
                        # 未使用品価格を取得
                        unused_elem = item.query_selector('div.unused p.price')
                        if unused_elem:
                            price_text = unused_elem.inner_text().strip()
                            price = self.parse_price(price_text)
                            
                            if price > 0:
                                price_data = self.create_price_data(
                                    model_name=model_name,
                                    storage=storage,
                                    price=price,
                                    color_note="未使用品",
                                    captured_at=captured_at
                                )
                                prices.append(price_data)
                                print(f"  ✓ {model_name} {storage} (未使用品): {price:,}円")
                        
                        # 中古品価格を取得
                        used_elem = item.query_selector('div.used p.price')
                        if used_elem:
                            price_text = used_elem.inner_text().strip()
                            # "～115,000円" のような表記から数値を抽出
                            price = self.parse_price(price_text)
                            
                            if price > 0:
                                price_data = self.create_price_data(
                                    model_name=model_name,
                                    storage=storage,
                                    price=price,
                                    color_note="中古品",
                                    captured_at=captured_at
                                )
                                prices.append(price_data)
                                print(f"  ✓ {model_name} {storage} (中古品): {price:,}円")
                    
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
