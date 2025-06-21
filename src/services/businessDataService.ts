import { Business } from '@/types/business';
import { DataStorageService } from './dataStorageService';
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
        name: 'GitHub組織検索（北海道）',
        type: 'api',
        description: '北海道のテック企業のGitHub組織',
        enabled: true,
        priority: 43,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（青森）',
        type: 'api',
        description: '青森のテック企業のGitHub組織',
        enabled: true,
        priority: 44,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（岩手）',
        type: 'api',
        description: '岩手のテック企業のGitHub組織',
        enabled: true,
        priority: 45,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（宮城）',
        type: 'api',
        description: '宮城のテック企業のGitHub組織',
        enabled: true,
        priority: 46,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（秋田）',
        type: 'api',
        description: '秋田のテック企業のGitHub組織',
        enabled: true,
        priority: 47,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（山形）',
        type: 'api',
        description: '山形のテック企業のGitHub組織',
        enabled: true,
        priority: 48,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（福島）',
        type: 'api',
        description: '福島のテック企業のGitHub組織',
        enabled: true,
        priority: 49,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（茨城）',
        type: 'api',
        description: '茨城のテック企業のGitHub組織',
        enabled: true,
        priority: 50,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（栃木）',
        type: 'api',
        description: '栃木のテック企業のGitHub組織',
        enabled: true,
        priority: 51,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（群馬）',
        type: 'api',
        description: '群馬のテック企業のGitHub組織',
        enabled: true,
        priority: 52,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（埼玉）',
        type: 'api',
        description: '埼玉のテック企業のGitHub組織',
        enabled: true,
        priority: 53,
        maxPages: 5,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（千葉）',
        type: 'api',
        description: '千葉のテック企業のGitHub組織',
        enabled: true,
        priority: 54,
        maxPages: 5,
        perPage: 100
      },
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
        name: 'GitHub組織検索（神奈川）',
        type: 'api',
        description: '神奈川のテック企業のGitHub組織',
        enabled: true,
        priority: 2,
        maxPages: 7,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（新潟）',
        type: 'api',
        description: '新潟のテック企業のGitHub組織',
        enabled: true,
        priority: 55,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（富山）',
        type: 'api',
        description: '富山のテック企業のGitHub組織',
        enabled: true,
        priority: 56,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（石川）',
        type: 'api',
        description: '石川のテック企業のGitHub組織',
        enabled: true,
        priority: 57,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（福井）',
        type: 'api',
        description: '福井のテック企業のGitHub組織',
        enabled: true,
        priority: 58,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（山梨）',
        type: 'api',
        description: '山梨のテック企業のGitHub組織',
        enabled: true,
        priority: 59,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（長野）',
        type: 'api',
        description: '長野のテック企業のGitHub組織',
        enabled: true,
        priority: 60,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（岐阜）',
        type: 'api',
        description: '岐阜のテック企業のGitHub組織',
        enabled: true,
        priority: 61,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（静岡）',
        type: 'api',
        description: '静岡のテック企業のGitHub組織',
        enabled: true,
        priority: 62,
        maxPages: 3,
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
        name: 'GitHub組織検索（三重）',
        type: 'api',
        description: '三重のテック企業のGitHub組織',
        enabled: true,
        priority: 63,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（滋賀）',
        type: 'api',
        description: '滋賀のテック企業のGitHub組織',
        enabled: true,
        priority: 64,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（京都）',
        type: 'api',
        description: '京都のテック企業のGitHub組織',
        enabled: true,
        priority: 65,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（大阪）',
        type: 'api',
        description: '大阪のテック企業のGitHub組織',
        enabled: true,
        priority: 4,
        maxPages: 8,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（兵庫）',
        type: 'api',
        description: '兵庫のテック企業のGitHub組織',
        enabled: true,
        priority: 66,
        maxPages: 4,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（奈良）',
        type: 'api',
        description: '奈良のテック企業のGitHub組織',
        enabled: true,
        priority: 67,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（和歌山）',
        type: 'api',
        description: '和歌山のテック企業のGitHub組織',
        enabled: true,
        priority: 68,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（鳥取）',
        type: 'api',
        description: '鳥取のテック企業のGitHub組織',
        enabled: true,
        priority: 69,
        maxPages: 1,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（島根）',
        type: 'api',
        description: '島根のテック企業のGitHub組織',
        enabled: true,
        priority: 70,
        maxPages: 1,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（岡山）',
        type: 'api',
        description: '岡山のテック企業のGitHub組織',
        enabled: true,
        priority: 71,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（広島）',
        type: 'api',
        description: '広島のテック企業のGitHub組織',
        enabled: true,
        priority: 72,
        maxPages: 3,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（山口）',
        type: 'api',
        description: '山口のテック企業のGitHub組織',
        enabled: true,
        priority: 73,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（徳島）',
        type: 'api',
        description: '徳島のテック企業のGitHub組織',
        enabled: true,
        priority: 74,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（香川）',
        type: 'api',
        description: '香川のテック企業のGitHub組織',
        enabled: true,
        priority: 75,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（愛媛）',
        type: 'api',
        description: '愛媛のテック企業のGitHub組織',
        enabled: true,
        priority: 76,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（高知）',
        type: 'api',
        description: '高知のテック企業のGitHub組織',
        enabled: true,
        priority: 77,
        maxPages: 2,
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
        name: 'GitHub組織検索（佐賀）',
        type: 'api',
        description: '佐賀のテック企業のGitHub組織',
        enabled: true,
        priority: 78,
        maxPages: 1,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（長崎）',
        type: 'api',
        description: '長崎のテック企業のGitHub組織',
        enabled: true,
        priority: 79,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（熊本）',
        type: 'api',
        description: '熊本のテック企業のGitHub組織',
        enabled: true,
        priority: 80,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（大分）',
        type: 'api',
        description: '大分のテック企業のGitHub組織',
        enabled: true,
        priority: 81,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（宮崎）',
        type: 'api',
        description: '宮崎のテック企業のGitHub組織',
        enabled: true,
        priority: 82,
        maxPages: 1,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（鹿児島）',
        type: 'api',
        description: '鹿児島のテック企業のGitHub組織',
        enabled: true,
        priority: 83,
        maxPages: 2,
        perPage: 100
      },
      {
        name: 'GitHub組織検索（沖縄）',
        type: 'api',
        description: '沖縄のテック企業のGitHub組織',
        enabled: true,
        priority: 84,
        maxPages: 2,
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

  // モックデータを生成してBusinessオブジェクトに適合させる
  private static generateMockBusinesses(region: string, count: number = 10): Business[] {
    const industries = ['製造業', 'IT・サービス', '小売業', '建設業', '医療・福祉', '教育', '金融業', '運輸業'];
    const businesses: Business[] = [];

    for (let i = 0; i < count; i++) {
      const id = Date.now() + i;
      businesses.push({
        id,
        name: `${region}企業${i + 1}`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        location: region,
        website_url: `https://example-${region}-${i + 1}.com`,
        has_website: Math.random() > 0.3,
        overall_score: Math.floor(Math.random() * 100),
        technical_score: Math.floor(Math.random() * 100),
        eeat_score: Math.floor(Math.random() * 100),
        content_score: Math.floor(Math.random() * 100),
        ai_content_score: Math.floor(Math.random() * 100),
        phone: `0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        address: `${region}市${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`,
        established_year: 1990 + Math.floor(Math.random() * 30),
        employee_count: `${Math.floor(Math.random() * 500) + 10}名`,
        capital: `${Math.floor(Math.random() * 10000) + 1000}万円`,
        description: `${region}を拠点とする企業です。`,
        last_analyzed: new Date().toISOString(),
        is_new: true,
        data_source: `商工会議所（${region}）`
      });
    }

    return businesses;
  }

  // 特定の地域の商工会議所データを取得（モック版）
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    try {
      console.log(`🔄 ${region}の商工会議所データを取得中...`);
      
      // 実際のAPIコールの代わりにモックデータを生成
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      
      const businesses = this.generateMockBusinesses(region, Math.floor(Math.random() * 20) + 5);
      
      // 取得したデータをDataStorageServiceに保存
      const existingData = DataStorageService.getAccumulatedData();
      const updatedData = DataStorageService.addBusinessData(businesses);
      
      console.log(`✅ ${region}の商工会議所データ取得完了: ${businesses.length}件`);
      return businesses;
    } catch (error) {
      console.error(`❌ ${region}の商工会議所データ取得エラー:`, error);
      return [];
    }
  }

  // GitHub組織検索のモック実装
  static async fetchGitHubOrganizationData(location: string, page: number = 1, perPage: number = 100): Promise<Business[]> {
    try {
      console.log(`🔄 GitHub組織検索を実行中 (${location}, ページ ${page})...`);
      
      // 実際のAPIコールの代わりにモックデータを生成
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒待機
      
      const count = Math.floor(Math.random() * 10) + 3; // 3-12件のランダム
      const businesses: Business[] = [];
      
      for (let i = 0; i < count; i++) {
        const id = Date.now() + page * 1000 + i;
        businesses.push({
          id,
          name: `${location}テック企業${page}-${i + 1}`,
          industry: 'IT・テクノロジー',
          location: location,
          website_url: `https://github.com/${location.toLowerCase()}-tech-${page}-${i + 1}`,
          has_website: true,
          overall_score: Math.floor(Math.random() * 40) + 60, // 60-100の高スコア
          technical_score: Math.floor(Math.random() * 30) + 70,
          eeat_score: Math.floor(Math.random() * 40) + 60,
          content_score: Math.floor(Math.random() * 40) + 60,
          ai_content_score: Math.floor(Math.random() * 100),
          phone: `0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          address: `${location}市テック区${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`,
          established_year: 2005 + Math.floor(Math.random() * 15),
          employee_count: `${Math.floor(Math.random() * 200) + 20}名`,
          capital: `${Math.floor(Math.random() * 50000) + 5000}万円`,
          description: `${location}を拠点とするテクノロジー企業です。GitHubで活発に開発を行っています。`,
          last_analyzed: new Date().toISOString(),
          is_new: true,
          data_source: `GitHub組織検索（${location}）`
        });
      }
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.addBusinessData(businesses);
      
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
      console.log('🔄 e-Stat企業データを取得中...');
      
      const estatData = await EStatApiService.fetchCorporateData();
      
      // e-StatデータをBusinessオブジェクトに変換
      const businesses: Business[] = estatData.map((data, index) => ({
        id: Date.now() + index,
        name: `[e-Stat] ${data.category}`,
        industry: '統計データ',
        location: '全国',
        website_url: 'https://www.e-stat.go.jp/',
        has_website: true,
        overall_score: Math.floor(Math.random() * 20) + 80, // 高品質なデータとして80-100
        technical_score: Math.floor(Math.random() * 20) + 80,
        eeat_score: 100, // 政府データなので最高スコア
        content_score: Math.floor(Math.random() * 20) + 80,
        ai_content_score: Math.floor(Math.random() * 100),
        employee_count: data.value,
        description: `政府統計データ: ${data.datasetTitle}`,
        last_analyzed: new Date().toISOString(),
        is_new: true,
        data_source: data.datasetTitle
      }));
      
      // 取得したデータをDataStorageServiceに保存
      DataStorageService.addBusinessData(businesses);
      
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
              const regionMatch = source.description.match(/(.+?)商工会議所/);
              const region = regionMatch ? regionMatch[1] : source.description.replace('商工会議所', '').trim();
              fetchedBusinesses = await this.fetchChamberOfCommerceData(region);
            }
            break;

          case 'api':
            // GitHub組織データを取得
            if (source.name.includes('GitHub組織検索')) {
              const locationMatch = source.description.match(/(.+?)のテック企業/);
              const location = locationMatch ? locationMatch[1] : '東京';
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

  // グループごとのデータ取得機能を追加
  static async fetchByGroup(groupType: string, progressCallback?: ProgressCallback): Promise<Business[]> {
    const allDataSources = this.getAvailableDataSources();
    let filteredSources: any[] = [];

    // グループタイプに応じてデータソースをフィルタリング
    switch (groupType) {
      case 'chamber':
        filteredSources = allDataSources.filter(source => 
          source.name.includes('商工会議所') && source.enabled
        );
        break;
      case 'github':
        filteredSources = allDataSources.filter(source => 
          source.name.includes('GitHub組織検索') && source.enabled
        );
        break;
      case 'estat':
        filteredSources = allDataSources.filter(source => 
          source.name.includes('e-Stat API') && source.enabled
        );
        break;
      case 'priority':
        filteredSources = allDataSources.filter(source => 
          source.priority <= 10 && source.enabled
        );
        break;
      default:
        filteredSources = allDataSources.filter(source => source.enabled);
    }

    const totalSources = filteredSources.length;
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

    console.log(`🎯 ${groupType}グループの取得開始: ${totalSources}件のデータソース`);

    // データソースを優先度順にソート
    const sortedDataSources = filteredSources.sort((a, b) => a.priority - b.priority);

    for (const source of sortedDataSources) {
      try {
        let fetchedBusinesses: Business[] = [];

        switch (source.type) {
          case 'scrape':
            // 商工会議所データを取得
            if (source.name.includes('商工会議所')) {
              const regionMatch = source.description.match(/(.+?)商工会議所/);
              const region = regionMatch ? regionMatch[1] : source.description.replace('商工会議所', '').trim();
              fetchedBusinesses = await this.fetchChamberOfCommerceData(region);
            }
            break;

          case 'api':
            // GitHub組織データを取得
            if (source.name.includes('GitHub組織検索')) {
              const locationMatch = source.description.match(/(.+?)のテック企業/);
              const location = locationMatch ? locationMatch[1] : '東京';
              const maxPages = source.maxPages || 1;
              const perPage = source.perPage || 100;

              for (let page = 1; page <= maxPages; page++) {
                const gitHubBusinesses = await this.fetchGitHubOrganizationData(location, page, perPage);
                fetchedBusinesses = fetchedBusinesses.concat(gitHubBusinesses);
                
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
        console.log(`✅ ${groupType}グループ - ${source.name} から ${fetchedBusinesses.length}件取得`);
        progressCallback?.(`データ取得: ${source.name}`, completedSources + 1, totalSources);

      } catch (error: any) {
        console.error(`❌ ${groupType}グループ - ${source.name} でエラーが発生:`, error);
        this.backgroundFetchStatus.errors.push(`${source.name}: ${error.message}`);
      } finally {
        completedSources++;
        this.backgroundFetchStatus.completedSources = completedSources;
        this.backgroundFetchStatus.lastUpdate = Date.now();
        progressCallback?.(`${groupType}グループ - ${source.name} 完了`, completedSources, totalSources);
      }
    }

    this.backgroundFetchStatus.isRunning = false;
    console.log(`✅ ${groupType}グループの全データソース取得完了: ${allBusinesses.length}件`);
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
