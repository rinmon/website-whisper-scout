
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
    return await this.fetchFromEdgeFunction('scraping', onProgress);
  }

  static async fetchAll(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('all', onProgress);
  }

  static async fetchPriority(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return await this.fetchFromEdgeFunction('priority', onProgress);
  }

  private static async fetchFromEdgeFunction(
    dataSourceGroup: string, 
    onProgress?: ProgressCallback
  ): Promise<BusinessPayload[]> {
    try {
      onProgress?.(`${this.getGroupLabel(dataSourceGroup)}のデータ取得を開始...`, 1, 3);

      // 開発用：即座にモックデータを返す
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機（プログレス表示のため）
      
      onProgress?.(`データを生成中...`, 2, 3);
      
      // モックデータ生成
      const mockBusinesses: BusinessPayload[] = [
        {
          name: `サンプル企業1 (${this.getGroupLabel(dataSourceGroup)})`,
          website_url: 'https://example1.com',
          has_website: true,
          location: '東京都',
          industry: 'IT・サービス',
          phone: '03-1234-5678',
          address: '東京都港区',
          data_source: dataSourceGroup,
          is_new: true
        },
        {
          name: `サンプル企業2 (${this.getGroupLabel(dataSourceGroup)})`,
          website_url: 'https://example2.com',
          has_website: true,
          location: '東京都',
          industry: '製造業',
          phone: '03-9876-5432',
          address: '東京都渋谷区',
          data_source: dataSourceGroup,
          is_new: true
        },
        {
          name: `サンプル企業3 (${this.getGroupLabel(dataSourceGroup)})`,
          website_url: '',
          has_website: false,
          location: '東京都',
          industry: '小売業',
          phone: '03-5555-1234',
          address: '東京都新宿区',
          data_source: dataSourceGroup,
          is_new: true
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機

      onProgress?.(`✅ ${mockBusinesses.length}社のデータを取得完了`, 3, 3);
      
      console.log(`✅ ${this.getGroupLabel(dataSourceGroup)}完了: ${mockBusinesses.length}社（モック）`);
      return mockBusinesses;

    } catch (error) {
      console.error(`❌ ${this.getGroupLabel(dataSourceGroup)}エラー:`, error);
      onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : 'データ取得に失敗'}`, 3, 3);
      throw error;
    }
  }

  private static getGroupLabel(group: string): string {
    const groupData = dataSourceGroups.find(g => g.value === group);
    return groupData ? groupData.label : group;
  }
}

export type { CorporateDataSource, CorporateInfo };
