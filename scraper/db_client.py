"""
Supabaseデータベースクライアント
"""
import os
from typing import List, Dict
from supabase import create_client, Client
from dotenv import load_dotenv


class SupabaseClient:
    def __init__(self):
        # 環境変数を読み込み
        load_dotenv()
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URLとSUPABASE_KEYを.envファイルに設定してください")
        
        # Supabaseクライアントを作成
        self.client: Client = create_client(supabase_url, supabase_key)
        print("Supabase接続完了")
    
    def save_prices(self, prices: List[Dict]) -> int:
        """
        価格情報をSupabaseに保存
        
        Args:
            prices: 価格情報のリスト
            
        Returns:
            int: 保存された件数
        """
        if not prices:
            print("保存する価格情報がありません")
            return 0
        
        try:
            # price_historyテーブルに挿入
            response = self.client.table('price_history').insert(prices).execute()
            
            saved_count = len(response.data) if response.data else 0
            print(f"Supabaseに{saved_count}件の価格情報を保存しました")
            
            return saved_count
            
        except Exception as e:
            print(f"データベース保存エラー: {e}")
            raise
    
    def get_latest_prices(self, limit: int = 10) -> List[Dict]:
        """
        最新の価格情報を取得
        
        Args:
            limit: 取得件数
            
        Returns:
            List[Dict]: 価格情報のリスト
        """
        try:
            response = self.client.table('price_history')\
                .select('*')\
                .order('captured_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            print(f"データベース取得エラー: {e}")
            raise
    
    def check_connection(self) -> bool:
        """
        データベース接続をテスト
        
        Returns:
            bool: 接続成功ならTrue
        """
        try:
            # price_historyテーブルから1件取得してみる
            response = self.client.table('price_history').select('id').limit(1).execute()
            print("データベース接続テスト: OK")
            return True
        except Exception as e:
            print(f"データベース接続テスト: NG - {e}")
            return False


if __name__ == "__main__":
    # 接続テスト
    client = SupabaseClient()
    client.check_connection()
    
    # 最新の価格情報を取得
    latest = client.get_latest_prices(5)
    print(f"\n最新の価格情報 ({len(latest)}件):")
    for item in latest:
        print(f"  - {item.get('model_name')} {item.get('storage')}: {item.get('price'):,}円")
