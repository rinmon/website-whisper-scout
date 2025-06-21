import { Business } from '@/types/business';
import { DataStorageService } from './dataStorageService';
import { GithubApiService } from './githubApiService';
import { ChamberOfCommerceService } from './chamberOfCommerceService';
import { IndustryAssociationService } from './industryAssociationService';
import { EStatApiService } from './estatApiService';

export type ProgressCallback = (status: string, current: number, total: number) => void;

interface BackgroundFetchStatus {
  isRunning: boolean;
  completedSources: number;
  totalSources: number;
  lastUpdate: number;
  errors: string[];
}

export class BusinessDataService {
  private static instance: BusinessDataService;
  private static dataSources: any[];
  private static backgroundFetchStatus: BackgroundFetchStatus = {
    isRunning: false,
    completedSources: 0,
    totalSources: 0,
    lastUpdate: Date.now(),
    errors: []
  };
  private static backgroundProcess: Promise<void> | null = null;
  private static cache: { [key: string]: any } = {};

  private constructor() {
    // Private constructor to prevent direct construction calls with the `new` operator.
  }

  // シングルトンインスタンスを取得
  static getInstance(): BusinessDataService {
    if (!BusinessDataService.instance) {
      BusinessDataService.instance = new BusinessDataService();
    }
    return BusinessDataService.instance;
  }

  // キャッシュからデータを取得
  static getCache(key: string): any {
    return this.cache[key];
  }

  // データをキャッシュに保存
  static setCache(key: string, data: any): void {
    this.cache[key] = data;
  }

  // キャッシュをクリア
  static clearCache(): void {
    this.cache = {};
  }

  // データソースを設定
  static setDataSources(sources: any[]): void {
    this.dataSources = sources;
  }

  // 利用可能なデータソース一覧を取得 - 全国47都道府県対応
  static getAvailableDataSources() {
    return [
      // 商工会議所（全国版）
      {
        name: '商工会議所（北海道）',
        type: 'scrape',
        description: '札幌商工会議所',
        enabled: true,
        priority: 1,
        maxPages: 20,
        perPage: 100
      },
      {
        name: '商工会議所（青森）',
        type: 'scrape',
        description: '青森商工会議所',
        enabled: true,
        priority: 2,
        maxPages: 15,
        perPage: 100
      },
      {
        name: '商工会議所（岩手）',
        type: 'scrape',
        description: '盛岡商工会議所',
        enabled: true,
        priority: 3,
        maxPages: 15,
        perPage: 100
      },
      {
        name: '商工会議所（宮城）',
        type: 'scrape',
        description: '仙台商工会議所',
        enabled: true,
        priority: 4,
        maxPages: 18,
        perPage: 100
      },
      {
        name: '商工会議所（秋田）',
        type: 'scrape',
        description: '秋田商工会議所',
        enabled: true,
        priority: 5,
        maxPages: 12,
        perPage: 100
      },
      {
        name: '商工会議所（山形）',
        type: 'scrape',
        description: '山形商工会議所',
        enabled: true,
        priority: 6,
        maxPages: 12,
        perPage: 100
      },
      {
        name: '商工会議所（福島）',
        type: 'scrape',
        description: '福島商工会議所',
        enabled: true,
        priority: 7,
        maxPages: 15,
        perPage: 100
      },
      {
        name: '商工会議所（茨城）',
        type: 'scrape',
        description: '水戸商工会議所',
        enabled: true,
        priority: 8,
        maxPages: 16,
        perPage: 100
      },
      {
        name: '商工会議所（栃木）',
        type: 'scrape',
        description: '宇都宮商工会議所',
        enabled: true,
        priority: 9,
        maxPages: 15,
        perPage: 100
      },
      {
        name: '商工会議所（群馬）',
        type: 'scrape',
        description: '前橋商工会議所',
        enabled: true,
        priority: 10,
        maxPages: 14,
        perPage: 100
      },
      {
        name: '商工会議所（埼玉）',
        type: 'scrape',
        description: 'さいたま商工会議所',
        enabled: true,
        priority: 11,
        maxPages: 25,
        perPage: 100
      },
      {
        name: '商工会議所（千葉）',
        type: 'scrape',
        description: '千葉商工会議所',
        enabled: true,
        priority: 12,
        maxPages: 22,
        perPage: 100
      },
      {
        name: '商工会議所（東京）',
        type: 'scrape',
        description: '東京商工会議所',
        enabled: true,
        priority: 1,
        maxPages: 50,
        perPage: 100
      },
      {
        name: '商工会議所（神奈川）',
        type: 'scrape',
        description: '横浜商工会議所',
        enabled: true,
        priority: 2,
        maxPages: 35,
        perPage: 100
      },
      {
        name: '商工会議所（新潟）',
        type: 'scrape',
        description: '新潟商工会議所',
        enabled: true,
        priority: 13,
        maxPages: 16,
        perPage: 100
      },
      {
        name: '商工会議所（富山）',
        type: 'scrape',
        description: '富山商工会議所',
        enabled: true,
        priority: 14,
        maxPages: 12,
        perPage: 100
      },
      {
        name: '商工会議所（石川）',
        type: 'scrape',
        description: '金沢商工会議所',
        enabled: true,
        priority: 15,
        maxPages: 13,
        perPage: 100
      },
      {
        name: '商工会議所（福井）',
        type: 'scrape',
        description: '福井商工会議所',
        enabled: true,
        priority: 16,
        maxPages: 11,
        perPage: 100
      },
      {
        name: '商工会議所（山梨）',
        type: 'scrape',
        description: '甲府商工会議所',
        enabled: true,
        priority: 17,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（長野）',
        type: 'scrape',
        description: '長野商工会議所',
        enabled: true,
        priority: 18,
        maxPages: 14,
        perPage: 100
      },
      {
        name: '商工会議所（岐阜）',
        type: 'scrape',
        description: '岐阜商工会議所',
        enabled: true,
        priority: 19,
        maxPages: 13,
        perPage: 100
      },
      {
        name: '商工会議所（静岡）',
        type: 'scrape',
        description: '静岡商工会議所',
        enabled: true,
        priority: 20,
        maxPages: 18,
        perPage: 100
      },
      {
        name: '商工会議所（愛知）',
        type: 'scrape',
        description: '名古屋商工会議所',
        enabled: true,
        priority: 3,
        maxPages: 40,
        perPage: 100
      },
      {
        name: '商工会議所（三重）',
        type: 'scrape',
        description: '津商工会議所',
        enabled: true,
        priority: 21,
        maxPages: 12,
        perPage: 100
      },
      {
        name: '商工会議所（滋賀）',
        type: 'scrape',
        description: '大津商工会議所',
        enabled: true,
        priority: 22,
        maxPages: 11,
        perPage: 100
      },
      {
        name: '商工会議所（京都）',
        type: 'scrape',
        description: '京都商工会議所',
        enabled: true,
        priority: 23,
        maxPages: 20,
        perPage: 100
      },
      {
        name: '商工会議所（大阪）',
        type: 'scrape',
        description: '大阪商工会議所',
        enabled: true,
        priority: 4,
        maxPages: 45,
        perPage: 100
      },
      {
        name: '商工会議所（兵庫）',
        type: 'scrape',
        description: '神戸商工会議所',
        enabled: true,
        priority: 24,
        maxPages: 22,
        perPage: 100
      },
      {
        name: '商工会議所（奈良）',
        type: 'scrape',
        description: '奈良商工会議所',
        enabled: true,
        priority: 25,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（和歌山）',
        type: 'scrape',
        description: '和歌山商工会議所',
        enabled: true,
        priority: 26,
        maxPages: 9,
        perPage: 100
      },
      {
        name: '商工会議所（鳥取）',
        type: 'scrape',
        description: '鳥取商工会議所',
        enabled: true,
        priority: 27,
        maxPages: 8,
        perPage: 100
      },
      {
        name: '商工会議所（島根）',
        type: 'scrape',
        description: '松江商工会議所',
        enabled: true,
        priority: 28,
        maxPages: 8,
        perPage: 100
      },
      {
        name: '商工会議所（岡山）',
        type: 'scrape',
        description: '岡山商工会議所',
        enabled: true,
        priority: 29,
        maxPages: 15,
        perPage: 100
      },
      {
        name: '商工会議所（広島）',
        type: 'scrape',
        description: '広島商工会議所',
        enabled: true,
        priority: 30,
        maxPages: 18,
        perPage: 100
      },
      {
        name: '商工会議所（山口）',
        type: 'scrape',
        description: '山口商工会議所',
        enabled: true,
        priority: 31,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（徳島）',
        type: 'scrape',
        description: '徳島商工会議所',
        enabled: true,
        priority: 32,
        maxPages: 9,
        perPage: 100
      },
      {
        name: '商工会議所（香川）',
        type: 'scrape',
        description: '高松商工会議所',
        enabled: true,
        priority: 33,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（愛媛）',
        type: 'scrape',
        description: '松山商工会議所',
        enabled: true,
        priority: 34,
        maxPages: 11,
        perPage: 100
      },
      {
        name: '商工会議所（高知）',
        type: 'scrape',
        description: '高知商工会議所',
        enabled: true,
        priority: 35,
        maxPages: 8,
        perPage: 100
      },
      {
        name: '商工会議所（福岡）',
        type: 'scrape',
        description: '福岡商工会議所',
        enabled: true,
        priority: 5,
        maxPages: 30,
        perPage: 100
      },
      {
        name: '商工会議所（佐賀）',
        type: 'scrape',
        description: '佐賀商工会議所',
        enabled: true,
        priority: 36,
        maxPages: 8,
        perPage: 100
      },
      {
        name: '商工会議所（長崎）',
        type: 'scrape',
        description: '長崎商工会議所',
        enabled: true,
        priority: 37,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（熊本）',
        type: 'scrape',
        description: '熊本商工会議所',
        enabled: true,
        priority: 38,
        maxPages: 12,
        perPage: 100
      },
      {
        name: '商工会議所（大分）',
        type: 'scrape',
        description: '大分商工会議所',
        enabled: true,
        priority: 39,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（宮崎）',
        type: 'scrape',
        description: '宮崎商工会議所',
        enabled: true,
        priority: 40,
        maxPages: 9,
        perPage: 100
      },
      {
        name: '商工会議所（鹿児島）',
        type: 'scrape',
        description: '鹿児島商工会議所',
        enabled: true,
        priority: 41,
        maxPages: 10,
        perPage: 100
      },
      {
        name: '商工会議所（沖縄）',
        type: 'scrape',
        description: '那覇商工会議所',
        enabled: true,
        priority: 42,
        maxPages: 8,
        perPage: 100
      },
      // GitHub組織検索（全国版）
      {
        name: 'GitHub組織検索（東京）',
        type: 'api',
        description: '東京のテック企業のGitHub組織',
        enabled: true,
        priority: 1,
        maxPages: 10,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（大阪）',
        type: 'api',
        description: '大阪のテック企業のGitHub組織',
        enabled: true,
        priority: 2,
        maxPages: 8,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（愛知）',
        type: 'api',
        description: '愛知のテック企業のGitHub組織',
        enabled: true,
        priority: 3,
        maxPages: 6,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（神奈川）',
        type: 'api',
        description: '神奈川のテック企業のGitHub組織',
        enabled: true,
        priority: 4,
        maxPages: 7,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（福岡）',
        type: 'api',
        description: '福岡のテック企業のGitHub組織',
        enabled: true,
        priority: 5,
        maxPages: 5,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（北海道）',
        type: 'api',
        description: '北海道のテック企業のGitHub組織',
        enabled: true,
        priority: 6,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（宮城）',
        type: 'api',
        description: '宮城のテック企業のGitHub組織',
        enabled: true,
        priority: 7,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（広島）',
        type: 'api',
        description: '広島のテック企業のGitHub組織',
        enabled: true,
        priority: 8,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（静岡）',
        type: 'api',
        description: '静岡のテック企業のGitHub組織',
        enabled: true,
        priority: 9,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（京都）',
        type: 'api',
        description: '京都のテック企業のGitHub組織',
        enabled: true,
        priority: 10,
        maxPages: 4,
        perPage: 100
      },
      // e-Stat API
      {
        name: 'e-Stat API（経済センサス）',
        type: 'api',
        description: '政府統計の企業データ',
        enabled: true,
        priority: 1,
        maxPages: 1,
        perPage: 1000
      },
      {
        name: 'e-Stat API（法人企業統計）',
        type: 'api',
        description: '法人企業の財務統計',
        enabled: true,
        priority: 2,
        maxPages: 1,
        perPage: 1000
      }
    ];
  }

  // 特定の地域の商工会議所データを取得
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    try {
      const chamber = new ChamberOfCommerceService(region);
      const businesses = await chamber.fetchBusinesses();
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.saveBusinesses(businesses);
      
      console.log(`✅ ${region}の商工会議所データ取得完了: ${businesses.length}件`);
      return businesses;
    } catch (error) {
      console.error(`❌ ${region}の商工会議所データ取得エラー:`, error);
      return [];
    }
  }

  // 特定の業界の業界団体データを取得
  static async fetchIndustryAssociationData(industry: string): Promise<Business[]> {
    try {
      const association = new IndustryAssociationService(industry);
      const businesses = await association.fetchBusinesses();
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.saveBusinesses(businesses);
      
      console.log(`✅ ${industry}の業界団体データ取得完了: ${businesses.length}件`);
      return businesses;
    } catch (error) {
      console.error(`❌ ${industry}の業界団体データ取得エラー:`, error);
      return [];
    }
  }

  // GitHub APIから組織情報を取得
  static async fetchGitHubOrganizationData(location: string, page: number = 1, perPage: number = 100): Promise<Business[]> {
    try {
      const githubService = new GithubApiService();
      const organizations = await githubService.searchOrganizations(location, page, perPage);
      
      // 取得したデータをBusinessオブジェクトに変換
      const businesses: Business[] = organizations.map(org => ({
        name: org.login,
        website_url: org.blog || org.html_url,
        location: org.location || location,
        industry: 'Technology',
        employee_count: org.followers,
        source: 'GitHub',
        data_source: `GitHub Organization Search (${location})`,
        url: org.html_url,
        priority: 5,
        logo_url: org.avatar_url,
        description: org.description,
        is_sample: true,
        prefecture: location,
        created_at: new Date(org.created_at).getTime(),
        updated_at: new Date(org.updated_at).getTime(),
      }));
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.saveBusinesses(businesses);
      
      console.log(`✅ GitHub組織データ取得完了 (${location}, ページ ${page}): ${businesses.length}件`);
      return businesses;
    } catch (error) {
      console.error(`❌ GitHub組織データ取得エラー (${location}, ページ ${page}):`, error);
      return [];
    }
  }

  // e-Stat APIから企業情報を取得
  static async fetchEStatCorporateData(): Promise<Business[]> {
    try {
      const estatData = await EStatApiService.fetchCorporateData();
      
      // e-StatデータをBusinessオブジェクトに変換
      const businesses: Business[] = estatData.map(data => ({
        name: `[e-Stat] ${data.category}`,
        industry: '統計データ',
        employee_count: data.value,
        source: 'e-Stat',
        data_source: data.datasetTitle,
        priority: 3,
        is_sample: true,
        prefecture: '全国',
        created_at: Date.now(),
        updated_at: Date.now(),
      }));
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.saveBusinesses(businesses);
      
      console.log(`✅ e-Stat企業データ取得完了: ${businesses.length}件`);
      return businesses;
    } catch (error) {
      console.error('❌ e-Stat企業データ取得エラー:', error);
      return [];
    }
  }

  // 複数のオープンソースからデータを取得（全国対応版、進捗表示付き）
  static async fetchFromOpenSourcesWithProgress(progressCallback?: ProgressCallback): Promise<Business[]> {
    const allDataSources = this.getAvailableDataSources();
    const totalSources = allDataSources.length;
    let completedSources = 0;
    let allBusinesses: Business[] = [];

    // バックグラウンド処理の状態を初期化
    this.backgroundFetchStatus = {
      isRunning: true,
      completedSources: 0,
      totalSources: totalSources,
      lastUpdate: Date.now(),
      errors: []
    };

    // データソースを優先度順にソート
    const sortedDataSources = allDataSources.sort((a, b) => a.priority - b.priority);

    for (const source of sortedDataSources) {
      if (!source.enabled) {
        console.warn(`🚧 データソース ${source.name} は無効です`);
        completedSources++;
        this.backgroundFetchStatus.completedSources = completedSources;
        this.backgroundFetchStatus.lastUpdate = Date.now();
        continue;
      }

      try {
        let fetchedBusinesses: Business[] = [];

        switch (source.type) {
          case 'scrape':
            // 商工会議所データを取得
            if (source.name.includes('商工会議所')) {
              const region = source.description.replace('商工会議所', '').trim();
              fetchedBusinesses = await this.fetchChamberOfCommerceData(region);
            }
            break;

          case 'api':
            // GitHub組織データを取得
            if (source.name.includes('GitHub組織検索')) {
              const location = source.description.match(/（(.*?)）/)?.[1] || '東京';
              const maxPages = source.maxPages || 1;
              const perPage = source.perPage || 100;

              for (let page = 1; page <= maxPages; page++) {
                const gitHubBusinesses = await this.fetchGitHubOrganizationData(location, page, perPage);
                fetchedBusinesses = fetchedBusinesses.concat(gitHubBusinesses);
                
                // 進捗コールバックを呼び出す
                progressCallback?.(`GitHub組織検索 (${location}, ページ ${page})`, page, maxPages);
              }
            }
            // e-Stat APIから企業データを取得
            else if (source.name.includes('e-Stat API')) {
              const estatBusinesses = await this.fetchEStatCorporateData();
              fetchedBusinesses = fetchedBusinesses.concat(estatBusinesses);
            }
            break;

          default:
            console.warn(`🚧 未知のデータソースタイプ: ${source.type}`);
            break;
        }

        allBusinesses = allBusinesses.concat(fetchedBusinesses);
        console.log(`✅ データソース ${source.name} から ${fetchedBusinesses.length}件取得`);
        progressCallback?.(`データ取得: ${source.name}`, completedSources + 1, totalSources);

      } catch (error: any) {
        console.error(`❌ データソース ${source.name} でエラーが発生:`, error);
        this.backgroundFetchStatus.errors.push(`${source.name}: ${error.message}`);
      } finally {
        completedSources++;
        this.backgroundFetchStatus.completedSources = completedSources;
        this.backgroundFetchStatus.lastUpdate = Date.now();
        progressCallback?.(`データソース完了: ${source.name}`, completedSources, totalSources);
      }
    }

    this.backgroundFetchStatus.isRunning = false;
    console.log('✅ 全てのデータソースからのデータ取得完了');
    return allBusinesses;
  }

  // バックグラウンドでのデータ取得を開始
  static startBackgroundFetch() {
    if (this.backgroundProcess) {
      console.log('🔄 バックグラウンド処理は既に実行中です');
      return;
    }

    console.log('🚀 バックグラウンド処理を開始します');
    this.backgroundFetchStatus.isRunning = true;
    this.backgroundProcess = this.runBackgroundFetch();
  }

  // バックグラウンドでのデータ取得処理
  private static async runBackgroundFetch(): Promise<void> {
    try {
      // プログレスコールバックはコンソールにログを出すだけ
      const progressCallback: ProgressCallback = (status, current, total) => {
        console.log(`[バックグラウンド] ${status} (${current}/${total})`);
      };

      // データ取得処理を実行
      await this.fetchFromOpenSourcesWithProgress(progressCallback);
      console.log('✅ バックグラウンド処理が完了しました');
    } catch (error) {
      console.error('❌ バックグラウンド処理中にエラーが発生:', error);
    } finally {
      this.backgroundFetchStatus.isRunning = false;
      this.backgroundProcess = null;
    }
  }

  // バックグラウンド処理を停止
  static stopBackgroundFetch() {
    if (this.backgroundProcess) {
      console.log('🛑 バックグラウンド処理を停止します');
      this.backgroundFetchStatus.isRunning = false;
      this.backgroundProcess = null;
    } else {
      console.log('🚧 バックグラウンド処理は実行されていません');
    }
  }

  // バックグラウンド処理の状態を取得
  static getBackgroundFetchStatus(): BackgroundFetchStatus {
    return this.backgroundFetchStatus;
  }

  // e-Stat APIキーを設定
  static async setEStatApiKey(appId: string): Promise<boolean> {
    try {
      const isValid = await EStatApiService.testApiKey(appId);
      if (isValid) {
        EStatApiService.setAppId(appId);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('APIキー設定エラー:', error);
      return false;
    }
  }

  // データを全削除
  static clearAllData() {
    DataStorageService.clearAllData();
    this.clearCache();
    console.log('🗑️ サービス層のデータも削除');
  }
}
