"""
モバイルミックスのサイトからスクリーンショットを取得するスクレイパー
"""
import os
from datetime import datetime
from playwright.sync_api import sync_playwright


class MobileMixScraper:
    def __init__(self, output_dir: str = "screenshots"):
        self.url = "https://mobile-mix.jp/"
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def capture_screenshot(self) -> str:
        """
        モバイルミックスのサイトにアクセスしてスクリーンショットを取得
        
        Returns:
            str: 保存したスクリーンショットのファイルパス
        """
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
                
                # Cookie同意ボタンがあれば処理（サイトによって異なる）
                try:
                    # 一般的なCookie同意ボタンのセレクタを試す
                    cookie_selectors = [
                        'button:has-text("同意")',
                        'button:has-text("Accept")',
                        'button:has-text("OK")',
                        '.cookie-accept',
                        '#cookie-accept'
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
                
                # スクリーンショットを保存
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                screenshot_path = os.path.join(self.output_dir, f"mobile_mix_{timestamp}.png")
                
                # フルページスクリーンショット
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"スクリーンショット保存: {screenshot_path}")
                
                return screenshot_path
                
            except Exception as e:
                print(f"エラー: {e}")
                raise
            finally:
                browser.close()


if __name__ == "__main__":
    scraper = MobileMixScraper()
    screenshot_path = scraper.capture_screenshot()
    print(f"完了: {screenshot_path}")
