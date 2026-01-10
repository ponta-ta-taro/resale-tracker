"""
メインスクリプト: スクレイピング → DB保存を一連で実行
"""
import sys
from scraper import MobileMixScraper
from db_client import SupabaseClient


def main():
    """
    メイン処理:
    1. モバイルミックスのサイトから価格情報を抽出（DOM取得）
    2. Supabaseに保存
    """
    print("=" * 60)
    print("ResaleTracker - 価格データ収集スクリプト")
    print("=" * 60)
    
    try:
        # Step 1: 価格情報を抽出
        print("\n[1/2] 価格情報を抽出中...")
        scraper = MobileMixScraper()
        prices = scraper.extract_prices()
        print(f"✓ {len(prices)}件の価格情報を抽出しました")
        
        if not prices:
            print("\n⚠ 価格情報が抽出できませんでした")
            print("  - サイトの構造が変更されている可能性があります")
            print("  - スクリーンショットを確認してください")
            return 1
        
        # Step 2: Supabaseに保存
        print("\n[2/2] データベースに保存中...")
        try:
            db_client = SupabaseClient()
            saved_count = db_client.save_prices(prices)
            print(f"✓ {saved_count}件をデータベースに保存しました")
        except Exception as e:
            print(f"⚠ データベース保存をスキップ: {e}")
            print("  - Supabase設定を確認してください")
            print("  - price_historyテーブルが作成されているか確認してください")
        
        print("\n" + "=" * 60)
        print("完了！")
        print("=" * 60)
        
        # 抽出された価格情報のサマリーを表示
        print("\n抽出された価格情報:")
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
