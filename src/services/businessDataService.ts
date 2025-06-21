import { Business } from '@/types/business';

// 認証不要でアクセス可能な実際のオープンデータソース
const DATA_SOURCES = [
  {
    name: '総務省 法人番号公表サイト',
    url: 'https://www.houjin-bangou.nta.go.jp/download/zenken/',
    type: 'csv' as const,
    enabled: false, // 一時的に無効化
    description: '全国の法人データ（CSV形式）- CORS制限のため一時無効'
  },
  {
    name: '中小企業庁 下請適正取引等推進のためのガイドライン',
    url: 'https://www.chusho.meti.go.jp/keiei/torihiki/2016/160316shitaukeGL.pdf',
    type: 'document' as const,
    enabled: false,
    description: 'PDF文書（企業リストではないため無効化）'
  },
  {
    name: 'e-Stat 政府統計ポータル（経済センサス）',
    url: 'https://www.e-stat.go.jp/api/1.0/app/json/getSimpleDataset?appId=API_KEY&lang=J&dataSetId=0003348423',
    type: 'api' as const,
    enabled: false,
    description: 'APIキーが必要のため現在無効'
  },
  {
    name: 'オープンデータ カタログサイト（地方自治体）',
    url: 'https://www.data.go.jp/data/dataset?res_format=CSV&organization=tokyo',
    type: 'catalog' as const,
    enabled: false, // 一時的に無効化
    description: '東京都のオープンデータ - CORS制限のため一時無効'
  },
  {
    name: '模擬企業データ生成器',
    url: 'internal://mock-data-generator',
    type: 'mock' as const,
    enabled: true,
    description: '開発・テスト用の模擬企業データ'
  }
];

// 進捗コールバック型
export type ProgressCallback = (status: string, progress: number, total: number) => void;

export class BusinessDataService {
  // 実際のオープンデータソースから企業データを取得
  static async fetchFromOpenSourcesWithProgress(
    onProgress?: ProgressCallback
  ): Promise<Business[]> {
    const enabledSources = DATA_SOURCES.filter(source => source.enabled);
    const allBusinesses: Business[] = [];
    
    onProgress?.('データ取得を開始...', 0, enabledSources.length);
    
    for (let i = 0; i < enabledSources.length; i++) {
      const source = enabledSources[i];
      onProgress?.(`${source.name}からデータを取得中...`, i, enabledSources.length);
      
      try {
        let sourceData: Business[] = [];
        
        switch (source.type) {
          case 'mock':
            sourceData = await this.generateMockBusinessData();
            break;
          case 'csv':
            sourceData = await this.fetchRealCSVData(source);
            break;
          case 'api':
            sourceData = await this.fetchRealAPIData(source);
            break;
          case 'catalog':
            sourceData = await this.fetchOpenDataCatalog(source);
            break;
          default:
            console.log(`${source.name}: 未対応の形式`);
        }
        
        if (sourceData.length > 0) {
          allBusinesses.push(...sourceData);
          console.log(`✅ ${source.name}から${sourceData.length}社のデータを取得`);
        } else {
          console.log(`⚠️ ${source.name}: データなし`);
        }
        
      } catch (error) {
        console.error(`❌ ${source.name}からのデータ取得エラー:`, error);
        // エラーでもプロセスは継続
      }
      
      onProgress?.(`${source.name}完了`, i + 1, enabledSources.length);
      
      // レート制限対策で待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    onProgress?.('データの正規化処理中...', enabledSources.length, enabledSources.length);
    const normalizedData = this.normalizeBusinessData(allBusinesses);
    
    onProgress?.('データ取得完了', enabledSources.length, enabledSources.length);
    console.log(`🎉 総計${normalizedData.length}社の企業データを取得完了`);
    
    return normalizedData;
  }

  // 模擬企業データ生成
  private static async generateMockBusinessData(): Promise<Business[]> {
    console.log('📊 模擬企業データを生成中...');
    
    const mockCompanies = [
      { name: '田中建設株式会社', industry: '建設業', prefecture: '東京都', hasWebsite: false },
      { name: '山田農園', industry: '農業', prefecture: '北海道', hasWebsite: false },
      { name: '佐藤工業有限会社', industry: '製造業', prefecture: '愛知県', hasWebsite: true, score: 2.1 },
      { name: '鈴木商事', industry: '商業・卸売', prefecture: '大阪府', hasWebsite: true, score: 1.8 },
      { name: '高橋システム開発', industry: 'IT・情報サービス', prefecture: '東京都', hasWebsite: true, score: 3.2 },
      { name: '渡辺運送', industry: '運輸業', prefecture: '神奈川県', hasWebsite: false },
      { name: '伊藤清掃サービス', industry: 'サービス業', prefecture: '埼玉県', hasWebsite: true, score: 2.8 },
      { name: '加藤電気工事', industry: '建設業', prefecture: '千葉県', hasWebsite: false },
      { name: '松本機械製作所', industry: '製造業', prefecture: '静岡県', hasWebsite: true, score: 2.5 },
      { name: '小林食品', industry: '製造業', prefecture: '福岡県', hasWebsite: true, score: 3.0 },
      { name: '中村塗装', industry: '建設業', prefecture: '兵庫県', hasWebsite: false },
      { name: '林農産物販売', industry: '農業', prefecture: '茨城県', hasWebsite: false },
      { name: '木村ITコンサル', industry: 'IT・情報サービス', prefecture: '東京都', hasWebsite: true, score: 3.8 },
      { name: '斉藤物流', industry: '運輸業', prefecture: '愛知県', hasWebsite: true, score: 2.3 },
      { name: '吉田印刷', industry: '製造業', prefecture: '京都府', hasWebsite: true, score: 2.6 },
      { name: '清水不動産', industry: 'サービス業', prefecture: '東京都', hasWebsite: true, score: 3.1 },
      { name: '森田金属加工', industry: '製造業', prefecture: '大阪府', hasWebsite: false },
      { name: '池田商店', industry: '商業・卸売', prefecture: '広島県', hasWebsite: false },
      { name: '橋本環境サービス', industry: 'サービス業', prefecture: '宮城県', hasWebsite: true, score: 2.9 },
      { name: '福田建築設計', industry: '建設業', prefecture: '福岡県', hasWebsite: true, score: 3.4 }
    ];

    const businesses: Business[] = mockCompanies.map((company, index) => {
      const hasWebsite = company.hasWebsite;
      const score = company.score || 0;
      
      return {
        id: Date.now() + index,
        name: company.name,
        industry: company.industry,
        location: company.prefecture,
        website_url: hasWebsite ? `https://www.${company.name.replace(/株式会社|有限会社|農園|商事|システム開発|運送|サービス|工事|製作所|食品|塗装|販売|コンサル|物流|印刷|不動産|加工|商店|設計/g, '').toLowerCase()}.co.jp` : null,
        has_website: hasWebsite,
        overall_score: score,
        technical_score: hasWebsite ? Math.max(0, score - 0.5 + Math.random() * 0.5) : 0,
        eeat_score: hasWebsite ? Math.max(0, score - 0.3 + Math.random() * 0.6) : 0,
        content_score: hasWebsite ? Math.max(0, score - 0.2 + Math.random() * 0.4) : 0,
        ai_content_score: hasWebsite ? Math.random() : null,
        description: '模擬データとして生成された企業情報',
        last_analyzed: new Date().toISOString().split('T')[0]
      };
    });

    console.log(`✅ ${businesses.length}社の模擬データを生成しました`);
    return businesses;
  }

  // 実際のCSVデータ取得（法人番号公表サイト等）
  private static async fetchRealCSVData(source: any): Promise<Business[]> {
    console.log(`📊 実際のCSV取得開始: ${source.name}`);
    
    try {
      // CORS回避のためプロキシを使用
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.contents) {
        // 実際のCSVデータを解析
        return this.parseRealCSVContent(data.contents, source.name);
      }
      
      throw new Error('CSVコンテンツの取得に失敗');
      
    } catch (error) {
      console.error(`CSV取得エラー:`, error);
      return [];
    }
  }

  // オープンデータカタログサイトからの取得
  private static async fetchOpenDataCatalog(source: any): Promise<Business[]> {
    console.log(`🏛️ オープンデータカタログ取得: ${source.name}`);
    
    try {
      // data.go.jpのようなオープンデータカタログから企業データを検索
      const searchUrl = 'https://www.data.go.jp/data/api/1/dataset_tag_autocomplete?query=企業&limit=10';
      
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const catalogData = await response.json();
        return this.parseOpenDataCatalog(catalogData, source.name);
      }
      
      return [];
      
    } catch (error) {
      console.error(`カタログ取得エラー:`, error);
      return [];
    }
  }

  // 実際のAPIデータ取得
  private static async fetchRealAPIData(source: any): Promise<Business[]> {
    console.log(`🔗 実際のAPI接続: ${source.name}`);
    
    try {
      const response = await fetch(source.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BusinessScoutingTool/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const apiData = await response.json();
      return this.parseRealAPIResponse(apiData, source.name);
      
    } catch (error) {
      console.error(`API接続エラー:`, error);
      return [];
    }
  }

  // 実際のCSVコンテンツ解析
  private static parseRealCSVContent(csvContent: string, sourceName: string): Business[] {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        console.log('CSV行数不足');
        return [];
      }
      
      // ヘッダー行を解析
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('CSV headers:', headers.slice(0, 5)); // 最初の5列だけログ出力
      
      const businesses: Business[] = [];
      
      // データ行を処理（最大100行まで）
      for (let i = 1; i < Math.min(lines.length, 101); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length >= 3) { // 最低限のデータがある場合
          const business = this.convertRealCSVToBusiness(headers, values, sourceName, i);
          if (business) {
            businesses.push(business);
          }
        }
      }
      
      return businesses;
      
    } catch (error) {
      console.error('CSV解析エラー:', error);
      return [];
    }
  }

  // 実際のAPI応答解析
  private static parseRealAPIResponse(apiData: any, sourceName: string): Business[] {
    try {
      console.log('API response structure:', Object.keys(apiData));
      
      let dataArray = [];
      
      // 一般的なAPI応答構造を試行
      if (Array.isArray(apiData)) {
        dataArray = apiData;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        dataArray = apiData.data;
      } else if (apiData.results && Array.isArray(apiData.results)) {
        dataArray = apiData.results;
      } else if (apiData.items && Array.isArray(apiData.items)) {
        dataArray = apiData.items;
      }
      
      return dataArray.slice(0, 50).map((item, index) => 
        this.convertRealAPIToBusiness(item, sourceName, index)
      ).filter(Boolean);
      
    } catch (error) {
      console.error('API解析エラー:', error);
      return [];
    }
  }

  // オープンデータカタログ解析
  private static parseOpenDataCatalog(catalogData: any, sourceName: string): Business[] {
    try {
      const businesses: Business[] = [];
      
      if (catalogData.result && Array.isArray(catalogData.result)) {
        catalogData.result.forEach((item: any, index: number) => {
          if (item.name && item.name.includes('企業')) {
            businesses.push({
              id: Date.now() + index,
              name: item.name || `企業データ${index + 1}`,
              industry: this.extractIndustryFromText(item.title || item.name),
              location: this.extractLocationFromAddress(item.title || item.name),
              website_url: item.url || null,
              has_website: !!item.url,
              overall_score: 0,
              technical_score: 0,
              eeat_score: 0,
              content_score: 0,
              ai_content_score: null,
              description: `${sourceName}のオープンデータカタログより`,
              last_analyzed: new Date().toISOString().split('T')[0]
            });
          }
        });
      }
      
      return businesses;
      
    } catch (error) {
      console.error('カタログ解析エラー:', error);
      return [];
    }
  }

  // 実際のCSV行を企業データに変換
  private static convertRealCSVToBusiness(headers: string[], values: string[], sourceName: string, index: number): Business | null {
    try {
      // 一般的な列名パターンを検索
      const namePattern = /名称|会社名|企業名|商号|法人名/i;
      const addressPattern = /住所|所在地|本店|address/i;
      const industryPattern = /業種|業界|事業|industry/i;
      
      const nameIndex = headers.findIndex(h => namePattern.test(h));
      const addressIndex = headers.findIndex(h => addressPattern.test(h));
      const industryIndex = headers.findIndex(h => industryPattern.test(h));
      
      const name = nameIndex >= 0 ? values[nameIndex] : `実データ企業${index}`;
      const address = addressIndex >= 0 ? values[addressIndex] : this.getRandomLocation();
      const industry = industryIndex >= 0 ? values[industryIndex] : this.extractIndustryFromText(name);
      
      // 空データをスキップ
      if (!name || name.length < 2) {
        return null;
      }
      
      return {
        id: Date.now() + index,
        name: name.substring(0, 100), // 長すぎる名前を制限
        industry,
        location: this.extractLocationFromAddress(address),
        website_url: null, // CSVには通常含まれない
        has_website: false,
        overall_score: 0,
        technical_score: 0,
        eeat_score: 0,
        content_score: 0,
        ai_content_score: null,
        description: `${sourceName}からの実際のデータ`,
        last_analyzed: new Date().toISOString().split('T')[0]
      };
      
    } catch (error) {
      console.error('CSV行変換エラー:', error);
      return null;
    }
  }

  // 実際のAPI項目を企業データに変換
  private static convertRealAPIToBusiness(item: any, sourceName: string, index: number): Business | null {
    try {
      const name = item.name || item.company_name || item.title || `API企業${index + 1}`;
      
      if (!name || name.length < 2) {
        return null;
      }
      
      return {
        id: Date.now() + index,
        name: name.substring(0, 100),
        industry: item.industry || this.extractIndustryFromText(name),
        location: item.location || item.address || this.getRandomLocation(),
        website_url: item.website || item.url || null,
        has_website: !!(item.website || item.url),
        overall_score: 0,
        technical_score: 0,
        eeat_score: 0,
        content_score: 0,
        ai_content_score: null,
        description: `${sourceName}からの実際のAPIデータ`,
        last_analyzed: new Date().toISOString().split('T')[0]
      };
      
    } catch (error) {
      console.error('API項目変換エラー:', error);
      return null;
    }
  }

  // テキストから業界を推定
  private static extractIndustryFromText(text: string): string {
    const industryKeywords = {
      'IT・情報サービス': ['IT', 'システム', 'ソフト', 'プログラム', '情報', 'コンサル'],
      '建設業': ['建設', '工事', '土木', '建築', '住宅', '塗装', '設計'],
      '製造業': ['製造', '工場', '生産', '機械', '部品', '金属', '加工', '印刷', '食品'],
      '商業・卸売': ['商事', '商会', '卸', '貿易', '販売', '商店'],
      'サービス業': ['サービス', '清掃', '警備', '人材', '不動産', '環境'],
      '運輸業': ['運輸', '運送', '配送', '物流', '交通'],
      '農業': ['農業', '農協', '農産', '畜産', '漁業', '農園']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'その他';
  }

  // 住所から都道府県を抽出
  private static extractLocationFromAddress(address: string): string {
    const prefectures = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
                        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
                        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
                        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
                        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
                        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
                        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
    
    for (const prefecture of prefectures) {
      if (address.includes(prefecture)) {
        return prefecture;
      }
    }
    
    return this.getRandomLocation();
  }

  private static getRandomIndustry(): string {
    const industries = ['IT・情報サービス', '建設業', '製造業', '商業・卸売', 'サービス業', '農業', '運輸業'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  private static getRandomLocation(): string {
    const prefectures = ['東京都', '大阪府', '愛知県', '神奈川県', '埼玉県', '千葉県', '兵庫県', '福岡県'];
    return prefectures[Math.floor(Math.random() * prefectures.length)];
  }

  // 旧メソッド（互換性のため）
  static async fetchFromOpenSources(): Promise<Business[]> {
    return this.fetchFromOpenSourcesWithProgress();
  }

  // 企業データの正規化・重複排除
  static normalizeBusinessData(businesses: Business[]): Business[] {
    const seen = new Set<string>();
    const normalized: Business[] = [];

    businesses.forEach(business => {
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

  // 商工会議所データの取得（実装）
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    console.log(`${region}商工会議所の実データを取得中...`);
    // 実装は後日
    return [];
  }

  // 業界団体データの取得（実装）
  static async fetchIndustryAssociationData(industry: string): Promise<Business[]> {
    console.log(`${industry}業界団体の実データを取得中...`);
    // 実装は後日
    return [];
  }
}
