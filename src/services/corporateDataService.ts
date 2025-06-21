
// 企業情報取得サービス - 複数の無料データソースを統合
export interface CorporateDataSource {
  name: string;
  url: string;
  description: string;
  type: 'api' | 'scrape' | 'csv';
  enabled: boolean;
  priority: number;
  maxRecords: number;
}

export interface CorporateInfo {
  source: string;
  corporateNumber?: string;
  name: string;
  address?: string;
  prefecture?: string;
  industry?: string;
  capital?: string;
  employees?: string;
  website?: string;
  phone?: string;
  establishedDate?: string;
  isListed?: boolean;
}

export class CorporateDataService {
  private static readonly DATA_SOURCES: CorporateDataSource[] = [
    {
      name: '国税庁法人番号公表サイト',
      url: 'https://www.houjin-bangou.nta.go.jp',
      description: '日本の全法人基本情報（法人番号、住所等）',
      type: 'api',
      enabled: true,
      priority: 1,
      maxRecords: 1000
    },
    {
      name: 'FUMA（フーマ）',
      url: 'https://fumadata.com',
      description: '160万社以上の企業情報、ログイン不要',
      type: 'scrape',
      enabled: true,
      priority: 2,
      maxRecords: 500
    },
    {
      name: 'BIZMAPS',
      url: 'https://bizmaps.jp',
      description: '高鮮度な企業データ、地域・業種検索対応',
      type: 'scrape',
      enabled: true,
      priority: 3,
      maxRecords: 300
    },
    {
      name: 'Musubu（ムスブ）',
      url: 'https://musubu.in',
      description: '無料プランで30件までダウンロード可能',
      type: 'api',
      enabled: true,
      priority: 4,
      maxRecords: 30
    },
    {
      name: 'Ullet（ユーレット）',
      url: 'https://www.ullet.com',
      description: '上場企業の決算・財務データ',
      type: 'scrape',
      enabled: true,
      priority: 5,
      maxRecords: 200
    },
    {
      name: 'Yahoo!ファイナンス',
      url: 'https://finance.yahoo.co.jp',
      description: '上場企業の株価・財務諸表',
      type: 'scrape',
      enabled: true,
      priority: 6,
      maxRecords: 100
    }
  ];

  // 利用可能なデータソース一覧を取得
  static getAvailableDataSources(): CorporateDataSource[] {
    return this.DATA_SOURCES.filter(source => source.enabled);
  }

  // 国税庁法人番号公表サイトから企業情報を取得（モック実装）
  static async fetchFromNTA(prefecture?: string): Promise<CorporateInfo[]> {
    console.log(`📡 国税庁法人番号公表サイトから企業情報取得開始: ${prefecture || '全国'}`);
    
    // 実際の実装では国税庁APIまたはCSVデータを使用
    // ここではモックデータを生成
    const mockData: CorporateInfo[] = [];
    const prefectures = prefecture ? [prefecture] : ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県'];
    
    for (const pref of prefectures) {
      for (let i = 0; i < 50; i++) {
        mockData.push({
          source: '国税庁法人番号公表サイト',
          corporateNumber: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
          name: `${pref}${this.generateCompanyName()} ${i + 1}`,
          address: `${pref}${this.generateAddress()}`,
          prefecture: pref,
          industry: this.generateIndustry(),
          website: Math.random() > 0.3 ? `https://${this.generateDomain()}` : undefined,
          phone: `0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          isListed: Math.random() > 0.9
        });
      }
    }
    
    console.log(`✅ 国税庁データ取得完了: ${mockData.length}社`);
    return mockData;
  }

  // FUMA（フーマ）から企業情報を取得（モック実装）
  static async fetchFromFUMA(industry?: string): Promise<CorporateInfo[]> {
    console.log(`📡 FUMA（フーマ）から企業情報取得開始: ${industry || '全業種'}`);
    
    const mockData: CorporateInfo[] = [];
    const industries = industry ? [industry] : ['製造業', 'IT・通信', '建設業', '小売業', 'サービス業'];
    
    for (const ind of industries) {
      for (let i = 0; i < 40; i++) {
        mockData.push({
          source: 'FUMA（フーマ）',
          name: `${this.generateCompanyName()}${ind === 'IT・通信' ? 'システムズ' : ''}`,
          address: this.generateFullAddress(),
          prefecture: this.generatePrefecture(),
          industry: ind,
          capital: this.generateCapital(),
          employees: this.generateEmployees(),
          website: Math.random() > 0.2 ? `https://${this.generateDomain()}` : undefined,
          establishedDate: this.generateEstablishedDate(),
          isListed: Math.random() > 0.8
        });
      }
    }
    
    console.log(`✅ FUMAデータ取得完了: ${mockData.length}社`);
    return mockData;
  }

  // すべてのデータソースから企業情報を取得
  static async fetchFromAllSources(
    onProgress?: (status: string, current: number, total: number) => void
  ): Promise<CorporateInfo[]> {
    const allData: CorporateInfo[] = [];
    const sources = this.getAvailableDataSources().slice(0, 3); // 上位3つのソースを使用
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      onProgress?.(`${source.name}からデータ取得中...`, i, sources.length);
      
      try {
        let sourceData: CorporateInfo[] = [];
        
        switch (source.name) {
          case '国税庁法人番号公表サイト':
            sourceData = await this.fetchFromNTA();
            break;
          case 'FUMA（フーマ）':
            sourceData = await this.fetchFromFUMA();
            break;
          default:
            // その他のソースは後で実装
            sourceData = await this.generateMockData(source.name, source.maxRecords);
            break;
        }
        
        allData.push(...sourceData);
        
      } catch (error) {
        console.error(`❌ ${source.name}でエラー:`, error);
      }
      
      // 進捗更新
      onProgress?.(`${source.name}完了`, i + 1, sources.length);
    }
    
    console.log(`✅ 全データソース取得完了: ${allData.length}社`);
    return allData;
  }

  // モックデータ生成ヘルパー
  private static generateMockData(sourceName: string, maxRecords: number): Promise<CorporateInfo[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data: CorporateInfo[] = [];
        for (let i = 0; i < Math.min(maxRecords, 50); i++) {
          data.push({
            source: sourceName,
            name: `${this.generateCompanyName()} ${i + 1}`,
            address: this.generateFullAddress(),
            prefecture: this.generatePrefecture(),
            industry: this.generateIndustry(),
            website: Math.random() > 0.4 ? `https://${this.generateDomain()}` : undefined,
            isListed: Math.random() > 0.85
          });
        }
        resolve(data);
      }, 1000);
    });
  }

  // データ生成ユーティリティ
  private static generateCompanyName(): string {
    const prefixes = ['株式会社', '有限会社', '合同会社'];
    const names = ['アルファ', 'ベータ', 'ガンマ', 'デルタ', 'イプシロン', 'ゼータ', 'エータ', 'シータ'];
    const suffixes = ['商事', '工業', 'システム', 'サービス', '商会', '産業', '技研', 'エンジニアリング'];
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${names[Math.floor(Math.random() * names.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  private static generatePrefecture(): string {
    const prefs = ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県', '北海道', '宮城県', '埼玉県', '千葉県', '兵庫県'];
    return prefs[Math.floor(Math.random() * prefs.length)];
  }

  private static generateIndustry(): string {
    const industries = ['製造業', 'IT・通信', '建設業', '小売業', 'サービス業', '運輸業', '不動産業', '金融業'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private static generateAddress(): string {
    const areas = ['中央区', '港区', '新宿区', '渋谷区', '品川区', '大田区', '世田谷区'];
    return `${areas[Math.floor(Math.random() * areas.length)]}${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 20) + 1}-${Math.floor(Math.random() * 20) + 1}`;
  }

  private static generateFullAddress(): string {
    return `${this.generatePrefecture()}${this.generateAddress()}`;
  }

  private static generateCapital(): string {
    const amounts = ['1000万円', '5000万円', '1億円', '5億円', '10億円', '100億円'];
    return amounts[Math.floor(Math.random() * amounts.length)];
  }

  private static generateEmployees(): string {
    const ranges = ['1-10人', '11-50人', '51-100人', '101-300人', '301-1000人', '1000人以上'];
    return ranges[Math.floor(Math.random() * ranges.length)];
  }

  private static generateEstablishedDate(): string {
    const year = Math.floor(Math.random() * 50) + 1974; // 1974-2024
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  private static generateDomain(): string {
    const companies = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
    const tlds = ['co.jp', 'com', 'jp', 'net'];
    return `${companies[Math.floor(Math.random() * companies.length)]}.${tlds[Math.floor(Math.random() * tlds.length)]}`;
  }
}
