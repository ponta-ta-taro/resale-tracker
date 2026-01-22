"""
ベーススクレイパークラス
全スクレイパーの共通処理を提供
"""
import os
import re
from datetime import datetime
from typing import List, Dict
from playwright.sync_api import sync_playwright


class BaseScraper:
    def __init__(self, source: str, url: str, output_dir: str = "screenshots"):
        """
        ベーススクレイパーの初期化
        
        Args:
            source: 業者名（例: 'mobile_mix', 'iosys'）
            url: スクレイピング対象URL
            output_dir: スクリーンショット保存先ディレクトリ
        """
        self.source = source
        self.url = url
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
        if price_str:
            return int(price_str.replace(',', ''))
        return 0
    
    def create_price_data(
        self, 
        model_name: str, 
        storage: str, 
        price: int, 
        color_note: str = None,
        captured_at: datetime = None
    ) -> Dict:
        """
        価格データの辞書を作成
        
        Args:
            model_name: 機種名
            storage: 容量
            price: 価格（円）
            color_note: 色・備考（オプション）
            captured_at: 取得日時（省略時は現在時刻）
            
        Returns:
            Dict: 価格データ
        """
        if captured_at is None:
            captured_at = datetime.now()
        
        return {
            'source': self.source,
            'model_name': model_name,
            'storage': storage,
            'price': price,
            'color_note': color_note,
            'captured_at': captured_at.isoformat()
        }
    
    def save_screenshot(self, page, suffix: str = "") -> str:
        """
        スクリーンショットを保存
        
        Args:
            page: Playwrightのページオブジェクト
            suffix: ファイル名のサフィックス（オプション）
            
        Returns:
            str: 保存したファイルパス
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.source}_{timestamp}"
        if suffix:
            filename += f"_{suffix}"
        filename += ".png"
        
        screenshot_path = os.path.join(self.output_dir, filename)
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"  スクリーンショット保存: {screenshot_path}")
        
        return screenshot_path
    
    def extract_prices(self) -> List[Dict]:
        """
        価格情報を抽出（サブクラスでオーバーライド必須）
        
        Returns:
            List[Dict]: 価格情報のリスト
        """
        raise NotImplementedError("extract_prices() must be implemented in subclass")
