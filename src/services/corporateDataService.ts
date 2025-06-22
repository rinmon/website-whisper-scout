
import { CorporateDataSource, CorporateInfo } from '@/types/corporateData';
import { getAvailableDataSources } from './corporate/dataSourceConfig';
import { FumaService } from './corporate/fumaService';
import { NtaService } from './corporate/ntaService';
import { MockDataGenerator } from './corporate/mockDataGenerator';

// 企業情報取得サービス - リファクタリング版
export class CorporateDataService {
  // 利用可能なデータソース一覧を取得
  static getAvailableDataSources(): CorporateDataSource[] {
    return getAvailableDataSources();
  }

  // 国税庁法人番号公表サイトから企業情報を取得
  static async fetchFromNTA(prefecture?: string): Promise<CorporateInfo[]> {
    return NtaService.fetchFromNTA(prefecture);
  }

  // FUMA（フーマ）から企業情報を取得
  static async fetchFromFUMA(industry?: string): Promise<CorporateInfo[]> {
    return FumaService.fetchFromFUMA(industry);
  }

  // すべてのデータソースから企業情報を取得
  static async fetchFromAllSources(
    onProgress?: (status: string, current: number, total: number) => void
  ): Promise<CorporateInfo[]> {
    const allData: CorporateInfo[] = [];
    const sources = this.getAvailableDataSources().slice(0, 3); // 上位3つのソースを使用
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      onProgress?.(`${source.name}からデータ取得中...`, i, sources.length);
      
      try {
        let sourceData: CorporateInfo[] = [];
        
        switch (source.name) {
          case '国税庁法人番号公表サイト':
            sourceData = await this.fetchFromNTA();
            break;
          case 'FUMA（フーマ）':
            sourceData = await this.fetchFromFUMA();
            break;
          default:
            // その他のソースは後で実装
            sourceData = await this.generateMockData(source.name, source.maxRecords);
            break;
        }
        
        allData.push(...sourceData);
        
      } catch (error) {
        console.error(`❌ ${source.name}でエラー:`, error);
        // エラーデータは無視して継続
      }
      
      // 進捗更新
      onProgress?.(`${source.name}完了`, i + 1, sources.length);
    }
    
    console.log(`✅ 全データソース取得完了: ${allData.length}社`);
    return allData;
  }

  // モックデータ生成ヘルパー
  private static generateMockData(sourceName: string, maxRecords: number): Promise<CorporateInfo[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = MockDataGenerator.generateMockData(sourceName, Math.min(maxRecords, 50));
        resolve(data);
      }, 1000);
    });
  }
}

// 型エクスポート（後方互換性のため）
export type { CorporateDataSource, CorporateInfo };
