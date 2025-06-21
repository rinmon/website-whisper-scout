
import { Business } from '@/types/business';

// 商工会議所や業界団体のオープンデータソース
const DATA_SOURCES = [
  {
    name: '東京商工会議所会員企業',
    url: 'https://www.tokyo-cci.or.jp/meibo/',
    type: 'scrape' as const,
    enabled: true
  },
  {
    name: '大阪商工会議所会員企業', 
    url: 'https://www.osaka.cci.or.jp/member/',
    type: 'scrape' as const,
    enabled: true
  },
  {
    name: 'J-Net21 企業情報',
    url: 'https://j-net21.smrj.go.jp/expand/companies/',
    type: 'api' as const,
    enabled: true
  },
  {
    name: 'ハローワーク求人企業',
    url: 'https://www.hellowork.mhlw.go.jp/',
    type: 'api' as const,
    enabled: false
  }
];

// 進捗コールバック型
export type ProgressCallback = (status: string, progress: number, total: number) => void;

// 暫定的なサンプルデータ（実装テスト用）
const SAMPLE_BUSINESSES: Business[] = [
  {
    id: 1,
    name: "株式会社テクノロジーソリューション",
    industry: "IT・情報サービス",
    location: "東京都渋谷区",
    website_url: "https://techsol.example.jp",
    has_website: true,
    overall_score: 2.3,
    technical_score: 2.1,
    eeat_score: 2.8,
    content_score: 2.0,
    ai_content_score: 0.75,
    phone: "03-1234-5678",
    address: "東京都渋谷区神南1-2-3",
    established_year: 2015,
    employee_count: "11-50名",
    capital: "1000万円",
    description: "企業向けITソリューションの開発・提供",
    last_analyzed: "2024-06-20"
  },
  {
    id: 2,
    name: "山田建設株式会社",
    industry: "建設業",
    location: "大阪府大阪市",
    website_url: null,
    has_website: false,
    overall_score: 0,
    technical_score: 0,
    eeat_score: 0,
    content_score: 0,
    ai_content_score: null,
    phone: "06-9876-5432",
    address: "大阪府大阪市中央区本町2-4-6",
    established_year: 1985,
    employee_count: "21-50名",
    capital: "5000万円",
    description: "住宅・商業施設の建設",
    last_analyzed: "2024-06-20"
  },
  {
    id: 3,
    name: "グリーンファーム合同会社",
    industry: "農業",
    location: "北海道札幌市",
    website_url: "https://greenfarm.hokkaido.jp",
    has_website: true,
    overall_score: 4.1,
    technical_score: 4.3,
    eeat_score: 3.9,
    content_score: 4.2,
    ai_content_score: 0.25,
    phone: "011-234-5678",
    address: "北海道札幌市中央区大通西3-7",
    established_year: 2018,
    employee_count: "1-10名",
    capital: "300万円",
    description: "有機農業・農産物の直売",
    last_analyzed: "2024-06-19"
  },
  {
    id: 4,
    name: "ナカムラ商事株式会社",
    industry: "商業・卸売",
    location: "愛知県名古屋市",
    website_url: "https://nakamura-trade.nagoya",
    has_website: true,
    overall_score: 1.8,
    technical_score: 1.5,
    eeat_score: 2.2,
    content_score: 1.7,
    ai_content_score: 0.85,
    phone: "052-345-6789",
    address: "愛知県名古屋市中区栄3-15-8",
    established_year: 1992,
    employee_count: "51-100名",
    capital: "3000万円",
    description: "電子部品・工業製品の卸売",
    last_analyzed: "2024-06-18"
  },
  {
    id: 5,
    name: "サクラ美容室",
    industry: "サービス業",
    location: "福岡県福岡市",
    website_url: null,
    has_website: false,
    overall_score: 0,
    technical_score: 0,
    eeat_score: 0,
    content_score: 0,
    ai_content_score: null,
    phone: "092-123-4567",
    address: "福岡県福岡市博多区天神2-8-1",
    established_year: 2010,
    employee_count: "1-10名",
    capital: "100万円",
    description: "カット・カラー・パーマの美容サービス",
    last_analyzed: "2024-06-20"
  }
];

export class BusinessDataService {
  // 進捗付きでオープンデータソースから企業データを取得
  static async fetchFromOpenSourcesWithProgress(
    onProgress?: ProgressCallback
  ): Promise<Business[]> {
    const enabledSources = DATA_SOURCES.filter(source => source.enabled);
    const allBusinesses: Business[] = [];
    
    onProgress?.('データ取得を開始しています...', 0, enabledSources.length);
    
    for (let i = 0; i < enabledSources.length; i++) {
      const source = enabledSources[i];
      onProgress?.(`${source.name}からデータを取得中...`, i, enabledSources.length);
      
      try {
        let sourceData: Business[] = [];
        
        switch (source.type) {
          case 'api':
            sourceData = await this.fetchFromAPI(source.url, source.name);
            break;
          case 'scrape':
            sourceData = await this.fetchFromWebsite(source.url, source.name);
            break;
          case 'csv':
            sourceData = await this.fetchFromCSV(source.url, source.name);
            break;
        }
        
        allBusinesses.push(...sourceData);
        console.log(`${source.name}から${sourceData.length}社のデータを取得`);
        
      } catch (error) {
        console.error(`${source.name}からのデータ取得エラー:`, error);
        // エラーが発生しても他のソースは続行
      }
      
      // 進捗更新
      onProgress?.(`${source.name}完了`, i + 1, enabledSources.length);
      
      // API制限対策で少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    onProgress?.('データの正規化中...', enabledSources.length, enabledSources.length);
    const normalizedData = this.normalizeBusinessData(allBusinesses);
    
    onProgress?.('完了', enabledSources.length, enabledSources.length);
    console.log(`総計${normalizedData.length}社のデータを取得完了`);
    
    return normalizedData;
  }

  // APIからのデータ取得
  private static async fetchFromAPI(url: string, sourceName: string): Promise<Business[]> {
    console.log(`API接続: ${sourceName}`);
    
    // 実際のAPI接続実装
    // 現在は模擬データを返す（実装テスト用）
    return new Promise((resolve) => {
      setTimeout(() => {
        // 実際の実装では、ここでAPIリクエストを行う
        const mockData = this.generateMockData(sourceName, Math.floor(Math.random() * 20) + 5);
        resolve(mockData);
      }, 2000 + Math.random() * 2000);
    });
  }

  // ウェブサイトスクレイピング
  private static async fetchFromWebsite(url: string, sourceName: string): Promise<Business[]> {
    console.log(`Webスクレイピング: ${sourceName}`);
    
    // スクレイピング実装
    // 現在は模擬データを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockData(sourceName, Math.floor(Math.random() * 15) + 3);
        resolve(mockData);
      }, 3000 + Math.random() * 3000);
    });
  }

  // CSVファイルからの取得
  private static async fetchFromCSV(url: string, sourceName: string): Promise<Business[]> {
    console.log(`CSV取得: ${sourceName}`);
    
    // CSV取得・パース実装
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockData(sourceName, Math.floor(Math.random() * 30) + 10);
        resolve(mockData);
      }, 1500 + Math.random() * 1500);
    });
  }

  // 模擬データ生成（テスト用）
  private static generateMockData(sourceName: string, count: number): Business[] {
    const industries = ['IT・情報サービス', '建設業', '製造業', '商業・卸売', 'サービス業', '農業', '運輸業'];
    const prefectures = ['東京都', '大阪府', '愛知県', '神奈川県', '埼玉県', '千葉県', '兵庫県', '福岡県'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      name: `${sourceName}企業${i + 1}`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      location: prefectures[Math.floor(Math.random() * prefectures.length)],
      website_url: Math.random() > 0.3 ? `https://company${i}.example.jp` : null,
      has_website: Math.random() > 0.3,
      overall_score: Math.random() * 5,
      technical_score: Math.random() * 5,
      eeat_score: Math.random() * 5,
      content_score: Math.random() * 5,
      ai_content_score: Math.random(),
      phone: `0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 9999)}`,
      address: `住所${i + 1}`,
      established_year: 1990 + Math.floor(Math.random() * 34),
      employee_count: ['1-10名', '11-50名', '51-100名', '101名以上'][Math.floor(Math.random() * 4)],
      capital: `${Math.floor(Math.random() * 10000) + 100}万円`,
      description: `${sourceName}から取得した企業情報`,
      last_analyzed: new Date().toISOString().split('T')[0]
    }));
  }

  // 旧メソッド（互換性のため残す）
  static async fetchFromOpenSources(): Promise<Business[]> {
    return this.fetchFromOpenSourcesWithProgress();
  }

  // 商工会議所データの取得
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    console.log(`${region}商工会議所データを取得中...`);
    
    try {
      // 実装例：商工会議所APIへのリクエスト
      return this.generateMockData(`${region}商工会議所`, Math.floor(Math.random() * 50) + 20);
    } catch (error) {
      console.error('商工会議所データ取得エラー:', error);
      return [];
    }
  }

  // 業界団体データの取得
  static async fetchIndustryAssociationData(industry: string): Promise<Business[]> {
    console.log(`${industry}業界団体データを取得中...`);
    
    try {
      return this.generateMockData(`${industry}業界団体`, Math.floor(Math.random() * 30) + 15);
    } catch (error) {
      console.error('業界団体データ取得エラー:', error);
      return [];
    }
  }

  // 企業データの正規化・重複排除
  static normalizeBusinessData(businesses: Business[]): Business[] {
    const seen = new Set<string>();
    const normalized: Business[] = [];

    businesses.forEach(business => {
      // 企業名の正規化（株式会社、有限会社等の統一）
      const normalizedName = business.name
        .replace(/株式会社|㈱/g, '(株)')
        .replace(/有限会社|㈲/g, '(有)')
        .trim();

      const key = `${normalizedName}-${business.location}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push({
          ...business,
          name: normalizedName
        });
      }
    });

    return normalized;
  }

  // 利用可能なデータソース一覧を取得
  static getAvailableDataSources() {
    return DATA_SOURCES;
  }
}
