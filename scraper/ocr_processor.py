"""
OCRで価格情報を抽出するプロセッサー
"""
import re
from typing import List, Dict
from datetime import datetime
import pytesseract
from PIL import Image


class OCRProcessor:
    def __init__(self):
        # OCR抽出パターン（SPEC.mdより）
        self.pattern = r'(iPhone\s*[\w\s]+?\d+(?:GB|TB))\s+(\d{1,3}(?:,\d{3})*円)'
        
    def extract_text_from_image(self, image_path: str) -> str:
        """
        画像からテキストを抽出
        
        Args:
            image_path: 画像ファイルのパス
            
        Returns:
            str: 抽出されたテキスト
        """
        try:
            # 画像を開く
            image = Image.open(image_path)
            
            # Tesseract OCRで日本語テキストを抽出
            # lang='jpn+eng' で日本語と英語の両方を認識
            text = pytesseract.image_to_string(image, lang='jpn+eng')
            
            return text
        except Exception as e:
            print(f"OCRエラー: {e}")
            raise
    
    def parse_prices(self, text: str, captured_at: datetime = None) -> List[Dict]:
        """
        テキストから価格情報をパース
        
        Args:
            text: OCRで抽出されたテキスト
            captured_at: スクリーンショット取得日時
            
        Returns:
            List[Dict]: 価格情報のリスト
        """
        if captured_at is None:
            captured_at = datetime.now()
        
        # 正規表現で価格情報を抽出
        matches = re.findall(self.pattern, text)
        
        prices = []
        for match in matches:
            model_storage = match[0].strip()
            price_str = match[1].strip()
            
            # 価格から「円」と「,」を削除して数値に変換
            price = int(price_str.replace('円', '').replace(',', ''))
            
            # モデル名と容量を分離
            # 例: "iPhone 17 Pro Max 256GB" -> model_name="iPhone 17 Pro Max", storage="256GB"
            storage_match = re.search(r'(\d+(?:GB|TB))$', model_storage)
            if storage_match:
                storage = storage_match.group(1)
                model_name = model_storage[:storage_match.start()].strip()
            else:
                model_name = model_storage
                storage = "不明"
            
            # 色・備考情報の抽出（オプション）
            # 実際のサイトの表記に応じて調整が必要
            color_note = None
            
            prices.append({
                'model_name': model_name,
                'storage': storage,
                'price': price,
                'color_note': color_note,
                'captured_at': captured_at.isoformat()
            })
        
        return prices
    
    def process_screenshot(self, screenshot_path: str) -> List[Dict]:
        """
        スクリーンショットから価格情報を抽出
        
        Args:
            screenshot_path: スクリーンショットのパス
            
        Returns:
            List[Dict]: 価格情報のリスト
        """
        print(f"OCR処理開始: {screenshot_path}")
        
        # OCRでテキスト抽出
        text = self.extract_text_from_image(screenshot_path)
        
        # デバッグ用: 抽出されたテキストを表示
        print("=== 抽出されたテキスト（最初の500文字） ===")
        print(text[:500])
        print("=" * 50)
        
        # 価格情報をパース
        prices = self.parse_prices(text)
        
        print(f"抽出された価格情報: {len(prices)}件")
        for price in prices:
            print(f"  - {price['model_name']} {price['storage']}: {price['price']:,}円")
        
        return prices


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python ocr_processor.py <screenshot_path>")
        sys.exit(1)
    
    screenshot_path = sys.argv[1]
    processor = OCRProcessor()
    prices = processor.process_screenshot(screenshot_path)
    
    print(f"\n合計: {len(prices)}件の価格情報を抽出しました")
