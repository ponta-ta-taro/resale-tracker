"""
イオシスのサイトから価格情報を取得するスクレイパー
HTMLテーブル形式、静的ページ
"""
import re
from datetime import datetime
from typing import List, Dict
from playwright.sync_api import sync_playwright
from base_scraper import BaseScraper


class IosysScraper(BaseScraper):
    def __init__(self, output_dir: str = "screenshots"):
        super().__init__(
            source="iosys",
            url="https://k-tai-iosys.com/pricelist/smartphone/iphone/",
            output_dir=output_dir
        )
    
    def extract_prices(self) -> List[Dict]:
        """
        イオシスのサイトから価格情報を抽出
        
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
                
                # テーブルが表示されるまで待機
                page.wait_for_selector('table.table-hover', timeout=30000)
                page.wait_for_timeout(2000)
                
                # スクリーンショットを保存
                self.save_screenshot(page)
                
                # 価格テーブルの行を取得
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
                            # 最初のセルに機種名
                            model_text = cells[0].inner_text().strip()
                            
                            # 価格を含むセルを探す（未使用品と中古品の両方）
                            for i, cell in enumerate(cells[1:], 1):
                                cell_text = cell.inner_text().strip()
                                
                                # 価格が含まれているかチェック
                                if '円' in cell_text and re.search(r'\d', cell_text):
                                    # モデル名と容量を分離
                                    model_name, storage = self.parse_model_and_storage(model_text)
                                    
                                    # 価格を数値に変換
                                    price = self.parse_price(cell_text)
                                    
                                    if price > 0:
                                        # 未使用品か中古品かを判定（セルの位置やヘッダーから）
                                        color_note = "未使用品" if i == 1 else "中古品"
                                        
                                        # 価格データを作成
                                        price_data = self.create_price_data(
                                            model_name=model_name,
                                            storage=storage,
                                            price=price,
                                            color_note=color_note,
                                            captured_at=captured_at
                                        )
                                        prices.append(price_data)
                                        
                                        print(f"  ✓ {model_name} {storage} ({color_note}): {price:,}円")
                    
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
    scraper = IosysScraper()
    prices = scraper.extract_prices()
    
    print("\n" + "=" * 60)
    print("抽出された価格情報:")
    print("=" * 60)
    for i, price in enumerate(prices, 1):
        print(f"{i}. {price['model_name']} {price['storage']} ({price['color_note']}): {price['price']:,}円")
