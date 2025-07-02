
import { CorporateDataSource, CorporateInfo } from '@/types/corporateData';
import { getAvailableDataSources } from './corporate/dataSourceConfig';
import { BusinessPayload } from '@/types/business';
import { supabase } from '@/integrations/supabase/client';

// Progress callback type
export type ProgressCallback = (status: string, current: number, total: number) => void;

const dataSourceGroups = [
  { value: 'all', label: '全データソース' },
  { value: 'nta', label: '国税庁法人番号' },
  { value: 'fuma', label: 'FUMA（フーマ）' },
  { value: 'scraping', label: 'スクレイピング（食べログ・えきてん・まいぷれ）' },
  { value: 'priority', label: '優先度高' },
];

export class CorporateDataService {
  static getDataSourceGroups() {
    return dataSourceGroups;
  }

  static getAvailableDataSources(): CorporateDataSource[] {
    return getAvailableDataSources();
  }

  static async fetchFromNTA(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('nta', onProgress);
  }

  static async fetchFromFUMA(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('fuma', onProgress);
  }

  static async fetchFromScraping(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromScrapingSources(onProgress);
  }

  static async fetchAll(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('all', onProgress);
  }

  static async fetchPriority(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('priority', onProgress);
  }

  private static async fetchFromScrapingSources(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    try {
      onProgress?.('サーバーサイドでスクレイピング開始...', 0, 3);
      
      // Edge Functionを呼び出してスクレイピング実行
      const response = await supabase.functions.invoke('scrape-business-data', {
        body: {
          source: 'all',
          prefecture: '東京都',
          limit: 25
        }
      });

      if (response.error) {
        throw new Error(`Edge Function error: ${response.error.message}`);
      }

      const { businesses } = response.data;
      
      if (!businesses || !Array.isArray(businesses)) {
        throw new Error('Invalid response format from scraping service');
      }

      onProgress?.(`✅ ${businesses.length}社の実データ取得完了`, 3, 3);
      
      console.log(`✅ Edge Functionスクレイピング完了: ${businesses.length}社（実データ）`);
      return businesses;

    } catch (error) {
      console.error('❌ スクレイピングエラー:', error);
      onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : 'スクレイピングに失敗'}`, 3, 3);
      throw error;
    }
  }

  private static async fetchFromEdgeFunction(
    dataSourceGroup: string, 
    onProgress?: ProgressCallback
  ): Promise<BusinessPayload[]> {
    try {
      onProgress?.(`${this.getGroupLabel(dataSourceGroup)}のデータ取得中...`, 0, 1);
      
      // Edge Functionを呼び出し
      const response = await supabase.functions.invoke('scrape-business-data', {
        body: {
          source: dataSourceGroup,
          prefecture: '東京都',
          limit: 25
        }
      });

      if (response.error) {
        throw new Error(`Edge Function error: ${response.error.message}`);
      }

      const { businesses } = response.data;
      
      if (!businesses || !Array.isArray(businesses)) {
        throw new Error('Invalid response format from scraping service');
      }

      onProgress?.(`✅ ${businesses.length}社のデータ取得完了`, 1, 1);
      
      console.log(`✅ Edge Function完了: ${businesses.length}社`);
      return businesses;

    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : 'データ取得に失敗'}`, 1, 1);
      throw error;
    }
  }

  private static getGroupLabel(group: string): string {
    const groupData = dataSourceGroups.find(g => g.value === group);
    return groupData ? groupData.label : group;
  }
}

export type { CorporateDataSource, CorporateInfo };
