
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
      onProgress?.('実際のWebサイトからスクレイピング開始...', 0, 4);
      
      const allBusinesses: BusinessPayload[] = [];
      
      // 食べログからスクレイピング
      onProgress?.('食べログからデータ取得中...', 1, 4);
      const { TabelogScraper } = await import('./scraping/tabelogScraper');
      const tabelogData = await TabelogScraper.scrapeBusinesses('東京都', 10);
      
      tabelogData.forEach(business => {
        allBusinesses.push({
          name: business.name,
          website_url: business.url || '',
          has_website: !!business.url,
          location: business.area || '東京都',
          industry: business.genre || '飲食業',
          phone: '',
          address: business.area || '',
          data_source: '食べログ',
          is_new: true
        });
      });

      // えきてんからスクレイピング
      onProgress?.('えきてんからデータ取得中...', 2, 4);
      const { EkitenScraper } = await import('./scraping/ekitenScraper');
      const ekitenData = await EkitenScraper.scrapeBusinesses('東京都', 8);
      
      ekitenData.forEach(business => {
        allBusinesses.push({
          name: business.name,
          website_url: business.url || '',
          has_website: !!business.url,
          location: business.area || '東京都',
          industry: business.category || 'サービス業',
          phone: '',
          address: business.address || business.area || '',
          data_source: 'えきてん',
          is_new: true
        });
      });

      // まいぷれからスクレイピング
      onProgress?.('まいぷれからデータ取得中...', 3, 4);
      const { MaipreScraper } = await import('./scraping/maipreScraper');
      const maipreData = await MaipreScraper.scrapeBusinesses('東京都', 5);
      
      maipreData.forEach(business => {
        allBusinesses.push({
          name: business.name,
          website_url: business.url || '',
          has_website: !!business.url,
          location: business.area || '東京都',
          industry: business.category || '地域サービス',
          phone: '',
          address: business.area || '',
          data_source: 'まいぷれ',
          is_new: true
        });
      });

      onProgress?.(`✅ ${allBusinesses.length}社の実データ取得完了`, 4, 4);
      
      console.log(`✅ スクレイピング完了: ${allBusinesses.length}社（実データ）`);
      return allBusinesses;

    } catch (error) {
      console.error('❌ スクレイピングエラー:', error);
      onProgress?.(`❌ エラー: ${error instanceof Error ? error.message : 'スクレイピングに失敗'}`, 4, 4);
      throw error;
    }
  }

  private static async fetchFromEdgeFunction(
    dataSourceGroup: string, 
    onProgress?: ProgressCallback
  ): Promise<BusinessPayload[]> {
    // スクレイピング以外のデータソース用（現在は簡易実装）
    onProgress?.(`${this.getGroupLabel(dataSourceGroup)}のデータ取得中...`, 1, 1);
    return [];
  }

  private static getGroupLabel(group: string): string {
    const groupData = dataSourceGroups.find(g => g.value === group);
    return groupData ? groupData.label : group;
  }
}

export type { CorporateDataSource, CorporateInfo };
