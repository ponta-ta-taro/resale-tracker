"""
メインスクリプト: 4社のスクレイピング → DB保存を一連で実行
"""
import sys
import time
from scraper import MobileMixScraper
from iosys_scraper import IosysScraper
from netoff_scraper import NetoffScraper
from janpara_scraper import JanparaScraper
from db_client import SupabaseClient


def main():
    """
    メイン処理:
    1. 4社のサイトから価格情報を抽出
    2. Supabaseに一括保存
    """
    print("=" * 60)
    print("ResaleTracker - 価格データ収集スクリプト（4社）")
    print("=" * 60)
    
    # スクレイパーのリスト
    scrapers = [
        ("モバイルミックス", MobileMixScraper()),
        ("イオシス", IosysScraper()),
        ("ネットオフ", NetoffScraper()),
        ("じゃんぱら", JanparaScraper()),
    ]
    
    all_prices = []
    success_count = 0
    error_count = 0
    
    # 各サイトから価格情報を抽出
    for i, (name, scraper) in enumerate(scrapers, 1):
        try:
            print(f"\n[{i}/4] {name} - 価格情報を抽出中...")
            prices = scraper.extract_prices()
            
            if prices:
                print(f"✓ {len(prices)}件の価格情報を抽出しました")
                all_prices.extend(prices)
                success_count += 1
            else:
                print(f"⚠ 価格情報が抽出できませんでした")
                error_count += 1
            
            # 次のサイトまで2秒待機（最後のサイトは待機不要）
            if i < len(scrapers):
                print("  次のサイトまで2秒待機...")
                time.sleep(2)
                
        except Exception as e:
            print(f"✗ {name}でエラーが発生しました: {e}")
            error_count += 1
            # エラーが発生しても他のサイトは継続
            continue
    
    # 結果サマリー
    print("\n" + "=" * 60)
    print(f"抽出完了: 成功 {success_count}社 / 失敗 {error_count}社")
    print(f"合計 {len(all_prices)}件の価格情報を取得")
    print("=" * 60)
    
    # データベースに保存
    if all_prices:
        print(f"\n[保存] データベースに保存中... (合計 {len(all_prices)}件)")
        try:
            db_client = SupabaseClient()
            saved_count = db_client.save_prices(all_prices)
            print(f"✓ {saved_count}件をデータベースに保存しました")
        except Exception as e:
            print(f"⚠ データベース保存エラー: {e}")
            print("  - Supabase設定を確認してください")
            print("  - price_historyテーブルが作成されているか確認してください")
            return 1
    else:
        print("\n⚠ 価格情報が1件も抽出できませんでした")
        print("  - サイトの構造が変更されている可能性があります")
        print("  - スクリーンショットを確認してください")
        return 1
    
    # 抽出された価格情報のサマリーを表示
    print("\n抽出された価格情報（最初の10件）:")
    for i, price in enumerate(all_prices[:10], 1):
        source_name = {
            'mobile_mix': 'モバイルミックス',
            'iosys': 'イオシス',
            'netoff': 'ネットオフ',
            'janpara': 'じゃんぱら'
        }.get(price['source'], price['source'])
        
        color_info = f" ({price['color_note']})" if price.get('color_note') else ""
        print(f"  {i}. [{source_name}] {price['model_name']} {price['storage']}{color_info}: {price['price']:,}円")
    
    if len(all_prices) > 10:
        print(f"  ... 他 {len(all_prices) - 10}件")
    
    print("\n" + "=" * 60)
    print("完了！")
    print("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
