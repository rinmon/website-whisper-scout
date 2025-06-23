
import { CorporateDataSource, CorporateInfo } from '@/types/corporateData';
import { getAvailableDataSources } from './corporate/dataSourceConfig';
import { FumaService } from './corporate/fumaService';
import { NtaService } from './corporate/ntaService';
import { BusinessPayload } from '@/types/business';
import { TabelogScraper } from './scraping/tabelogScraper';
import { EkitenScraper } from './scraping/ekitenScraper';
import { MaipreScraper } from './scraping/maipreScraper';

// Progress callback type
export type ProgressCallback = (status: string, current: number, total: number) => void;

const dataSourceGroups = [
  { value: 'all', label: '全データソース' },
  { value: 'nta', label: '国税庁法人番号' },
  { value: 'fuma', label: 'FUMA（フーマ）' },
  { value: 'scraping', label: 'スクレイピング（食べログ・えきてん・まいぷれ）' },
  { value: 'priority', label: '優先度高' },
];

// Helper to convert CorporateInfo to BusinessPayload
const toBusinessPayload = (corp: CorporateInfo): BusinessPayload => ({
  name: corp.name,
  website_url: corp.website || '',
  has_website: !!corp.website,
  location: corp.prefecture || '不明',
  industry: corp.industry || '不明',
  phone: corp.phone || '',
  address: corp.address || '',
  data_source: corp.source,
  is_new: true,
});

async function fetchAndMap(
    fetcher: () => Promise<CorporateInfo[]>,
    onProgress?: ProgressCallback,
    startMsg?: string,
    endMsg?: string
): Promise<BusinessPayload[]> {
    onProgress?.(startMsg || 'データを取得中...', 0, 1);
    const data = await fetcher();
    onProgress?.(endMsg || 'データ取得完了', 1, 1);
    return data.map(toBusinessPayload);
}

async function fetchScrapingData(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
  const allData: BusinessPayload[] = [];
  const prefectures = ['東京都', '大阪府', '愛知県'];
  let currentStep = 0;
  const totalSteps = prefectures.length * 3; // 3つのスクレイピングサイト

  for (const prefecture of prefectures) {
    try {
      // 食べログ
      onProgress?.(`食べログから${prefecture}のデータを取得中...`, currentStep++, totalSteps);
      const tabelogData = await TabelogScraper.scrapeBusinessData(prefecture);
      allData.push(...tabelogData);

      // えきてん
      onProgress?.(`えきてんから${prefecture}のデータを取得中...`, currentStep++, totalSteps);
      const ekitenData = await EkitenScraper.scrapeBusinessData(prefecture);
      allData.push(...ekitenData);

      // まいぷれ
      onProgress?.(`まいぷれから${prefecture}のデータを取得中...`, currentStep++, totalSteps);
      const maipreData = await MaipreScraper.scrapeBusinessData(prefecture);
      allData.push(...maipreData);

    } catch (error) {
      console.error(`${prefecture}のスクレイピングでエラー:`, error);
    }
  }

  return allData;
}

async function fetchMultipleSources(
    sources: CorporateDataSource[],
    onProgress?: ProgressCallback,
    completionMessage: string = '全データソース取得完了'
): Promise<BusinessPayload[]> {
    const allData: CorporateInfo[] = [];
    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        onProgress?.(`${source.name}からデータ取得中...`, i, sources.length);
        try {
            let sourceData: CorporateInfo[] = [];
            switch (source.name) {
                case '国税庁法人番号公表サイト':
                    sourceData = await NtaService.fetchFromNTA();
                    break;
                case 'FUMA（フーマ）':
                    sourceData = await FumaService.fetchFromFUMA();
                    break;
                default:
                    console.warn(`未実装のデータソース: ${source.name}`);
                    break;
            }
            allData.push(...sourceData);
        } catch (error) {
            console.error(`❌ ${source.name}でエラー:`, error);
        }
        onProgress?.(`${source.name}完了`, i + 1, sources.length);
    }
    console.log(`✅ ${completionMessage}: ${allData.length}社`);
    return allData.map(toBusinessPayload);
}

export class CorporateDataService {
  static getDataSourceGroups() {
    return dataSourceGroups;
  }

  static getAvailableDataSources(): CorporateDataSource[] {
    return getAvailableDataSources();
  }

  static async fetchFromNTA(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return fetchAndMap(() => NtaService.fetchFromNTA(), onProgress, '国税庁のデータを取得中...', '国税庁のデータを取得完了');
  }

  static async fetchFromFUMA(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return fetchAndMap(() => FumaService.fetchFromFUMA(), onProgress, 'FUMAのデータを取得中...', 'FUMAのデータを取得完了');
  }

  static async fetchFromScraping(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    onProgress?.('スクレイピングデータを取得中...', 0, 1);
    const data = await fetchScrapingData(onProgress);
    onProgress?.('スクレイピングデータ取得完了', 1, 1);
    return data;
  }

  static async fetchAll(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    const allData: BusinessPayload[] = [];
    let currentStep = 0;
    const totalSteps = 3;

    try {
      // 1. 国税庁データ
      onProgress?.('国税庁データを取得中...', currentStep++, totalSteps);
      const ntaData = await this.fetchFromNTA();
      allData.push(...ntaData);

      // 2. FUMAデータ
      onProgress?.('FUMAデータを取得中...', currentStep++, totalSteps);
      const fumaData = await this.fetchFromFUMA();
      allData.push(...fumaData);

      // 3. スクレイピングデータ
      onProgress?.('スクレイピングデータを取得中...', currentStep++, totalSteps);
      const scrapingData = await this.fetchFromScraping(onProgress);
      allData.push(...scrapingData);

      console.log(`✅ 全データソース取得完了: ${allData.length}社`);
      return allData;
    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      throw error;
    }
  }

  static async fetchPriority(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    // 優先度の高いデータソースのみ取得
    const allData: BusinessPayload[] = [];
    let currentStep = 0;
    const totalSteps = 2;

    try {
      // 1. 国税庁データ（最高優先度）
      onProgress?.('国税庁データを取得中...', currentStep++, totalSteps);
      const ntaData = await this.fetchFromNTA();
      allData.push(...ntaData);

      // 2. スクレイピングデータ（高優先度）
      onProgress?.('スクレイピングデータを取得中...', currentStep++, totalSteps);
      const scrapingData = await this.fetchFromScraping(onProgress);
      allData.push(...scrapingData);

      console.log(`✅ 優先データソース取得完了: ${allData.length}社`);
      return allData;
    } catch (error) {
      console.error('❌ 優先データ取得エラー:', error);
      throw error;
    }
  }
}

export type { CorporateDataSource, CorporateInfo };
