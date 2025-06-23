
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
      onProgress?.(`${this.getGroupLabel(dataSourceGroup)}のデータ取得を開始...`, 0, 2);

      console.log(`🚀 Edge Function呼び出し: ${dataSourceGroup}`);
      
      const { data, error } = await supabase.functions.invoke('scrape-business-data', {
        body: { 
          dataSourceGroup: dataSourceGroup,
          prefecture: '東京都' 
        }
      });

      if (error) {
        console.error('Edge Function エラー:', error);
        throw new Error(`データ取得エラー: ${error.message}`);
      }

      onProgress?.(`データベースから企業データを取得中...`, 1, 2);

      // データベースから最新の企業データを取得
      const { data: businesses, error: dbError } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (dbError) {
        console.error('データベース取得エラー:', dbError);
        throw new Error(`データベースエラー: ${dbError.message}`);
      }

      // BusinessPayload形式に変換
      const businessPayloads: BusinessPayload[] = (businesses || []).map(business => ({
        name: business.name,
        website_url: business.website_url || '',
        has_website: business.has_website || false,
        location: business.location || '不明',
        industry: business.industry || '不明',
        phone: business.phone || '',
        address: business.address || '',
        data_source: business.data_source || '不明',
        is_new: business.is_new || true
      }));

      onProgress?.(`✅ ${data.message || '取得完了'}`, 2, 2);
      
      console.log(`✅ ${this.getGroupLabel(dataSourceGroup)}完了: ${businessPayloads.length}社`);
      return businessPayloads;

    } catch (error) {
      console.error(`❌ ${this.getGroupLabel(dataSourceGroup)}エラー:`, error);
      onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : 'データ取得に失敗'}`, 2, 2);
      throw error;
    }
  }

  private static getGroupLabel(group: string): string {
    const groupData = dataSourceGroups.find(g => g.value === group);
    return groupData ? groupData.label : group;
  }
}

export type { CorporateDataSource, CorporateInfo };
