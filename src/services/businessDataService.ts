
import { Business } from '@/types/business';

// 商工会議所や業界団体のオープンデータソース
const DATA_SOURCES = [
  {
    name: '東京商工会議所会員企業',
    url: 'https://example-tokyo-cci.jp/api/members',
    type: 'api' as const
  },
  {
    name: '大阪商工会議所会員企業', 
    url: 'https://example-osaka-cci.jp/members.csv',
    type: 'csv' as const
  },
  {
    name: 'IT業界団体会員企業',
    url: 'https://example-it-association.jp/api/companies',
    type: 'api' as const
  }
];

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
  // オープンデータソースから企業データを取得
  static async fetchFromOpenSources(): Promise<Business[]> {
    console.log('オープンデータソースから企業データを取得中...');
    
    // 実際の実装では、ここで各データソースからAPIコールまたはCSV取得
    // 現在はサンプルデータを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`${SAMPLE_BUSINESSES.length}社のデータを取得しました`);
        resolve(SAMPLE_BUSINESSES);
      }, 1500);
    });
  }

  // 商工会議所データの取得
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    console.log(`${region}商工会議所データを取得中...`);
    
    // 実装例：商工会議所APIへのリクエスト
    try {
      // const response = await fetch(`https://api.${region}-cci.jp/members`);
      // const data = await response.json();
      // return this.parseBusinessData(data);
      
      // 暫定的にサンプルデータを返す
      return SAMPLE_BUSINESSES.filter(b => b.location.includes(region));
    } catch (error) {
      console.error('商工会議所データ取得エラー:', error);
      return [];
    }
  }

  // 業界団体データの取得
  static async fetchIndustryAssociationData(industry: string): Promise<Business[]> {
    console.log(`${industry}業界団体データを取得中...`);
    
    try {
      // 実装例：業界団体APIへのリクエスト
      // const response = await fetch(`https://api.${industry}-association.jp/companies`);
      // const data = await response.json();
      
      // 暫定的にサンプルデータを返す
      return SAMPLE_BUSINESSES.filter(b => b.industry.includes(industry));
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
