"""
メインスクリプト: スクレイピング → OCR → DB保存を一連で実行
"""
import sys
from scraper import MobileMixScraper
from ocr_processor import OCRProcessor
from db_client import SupabaseClient


def main():
    """
    メイン処理:
    1. モバイルミックスのサイトからスクリーンショットを取得
    2. OCRで価格情報を抽出
    3. Supabaseに保存
    """
    print("=" * 60)
    print("ResaleTracker - 価格データ収集スクリプト")
    print("=" * 60)
    
    try:
        # Step 1: スクリーンショット取得
        print("\n[1/3] スクリーンショット取得中...")
        scraper = MobileMixScraper()
        screenshot_path = scraper.capture_screenshot()
        print(f"✓ スクリーンショット保存完了: {screenshot_path}")
        
        # Step 2: OCRで価格抽出
        print("\n[2/3] OCR処理中...")
        processor = OCRProcessor()
        prices = processor.process_screenshot(screenshot_path)
        print(f"✓ {len(prices)}件の価格情報を抽出しました")
        
        if not prices:
            print("\n⚠ 価格情報が抽出できませんでした")
            print("  - スクリーンショットを確認してください")
            print("  - OCRパターンが正しいか確認してください")
            return 1
        
        # Step 3: Supabaseに保存
        print("\n[3/3] データベースに保存中...")
        db_client = SupabaseClient()
        saved_count = db_client.save_prices(prices)
        print(f"✓ {saved_count}件をデータベースに保存しました")
        
        print("\n" + "=" * 60)
        print("完了！")
        print("=" * 60)
        
        # 保存された価格情報のサマリーを表示
        print("\n保存された価格情報:")
        for i, price in enumerate(prices[:10], 1):  # 最初の10件のみ表示
            print(f"  {i}. {price['model_name']} {price['storage']}: {price['price']:,}円")
        
        if len(prices) > 10:
            print(f"  ... 他 {len(prices) - 10}件")
        
        return 0
        
    except Exception as e:
        print(f"\n✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
