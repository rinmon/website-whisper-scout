
import { CorporateInfo } from '@/types/corporateData';
import { MockDataGenerator } from './mockDataGenerator';

// 国税庁法人番号公表サイト特化のデータ取得サービス
export class NtaService {
  static async fetchFromNTA(prefecture?: string): Promise<CorporateInfo[]> {
    console.log(`📡 国税庁法人番号公表サイトから企業情報取得開始: ${prefecture || '全国'}`);
    
    try {
      // 実際の実装では国税庁APIまたはCSVデータを使用
      // 現在はモックデータを生成
      
      const prefectures = prefecture ? [prefecture] : ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県'];
      const allData: CorporateInfo[] = [];
      
      for (const pref of prefectures) {
        const data = MockDataGenerator.generateMockData('国税庁法人番号公表サイト', 50, pref);
        allData.push(...data);
      }
      
      console.log(`✅ 国税庁データ取得完了: ${allData.length}社`);
      return allData;
      
    } catch (error) {
      console.error(`❌ 国税庁データ取得エラー:`, error);
      // エラーの場合は空配列を返す（エラーデータは無視）
      return [];
    }
  }
}
