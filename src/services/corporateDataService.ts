import { CorporateDataSource, CorporateInfo } from '@/types/corporateData';
import { getAvailableDataSources } from './corporate/dataSourceConfig';
import { FumaService } from './corporate/fumaService';
import { NtaService } from './corporate/ntaService';
import { MockDataGenerator } from './corporate/mockDataGenerator';
import { BusinessPayload } from '@/types/business';

// Progress callback type
export type ProgressCallback = (status: string, current: number, total: number) => void;

const dataSourceGroups = [
  { value: 'all', label: '全データソース' },
  { value: 'nta', label: '国税庁法人番号' },
  { value: 'fuma', label: 'FUMA（フーマ）' },
  { value: 'listed', label: '上場企業特化' },
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
                    sourceData = await CorporateDataService.generateMockData(source.name, source.maxRecords);
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

  static async fetchFromListed(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    return fetchAndMap(() => FumaService.fetchFromFUMA('上場企業'), onProgress, '上場企業データを取得中...', '上場企業データを取得完了');
  }

  static async fetchAll(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    const sources = this.getAvailableDataSources().filter(s => s.enabled);
    return fetchMultipleSources(sources, onProgress, '全データソース取得完了');
  }

  static async fetchPriority(onProgress?: ProgressCallback): Promise<BusinessPayload[]> {
    const sources = this.getAvailableDataSources().filter(s => s.enabled && s.priority <= 3);
    return fetchMultipleSources(sources, onProgress, '優先データソース取得完了');
  }

  static generateMockData(sourceName: string, maxRecords: number): Promise<CorporateInfo[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = MockDataGenerator.generateMockData(sourceName, Math.min(maxRecords, 50));
        resolve(data);
      }, 1000);
    });
  }
}

export type { CorporateDataSource, CorporateInfo };
