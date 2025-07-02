import { ScrapingService } from './scrapingService';

export interface TabelogBusiness {
  name: string;
  url?: string;
  rating?: number;
  area?: string;
  genre?: string;
}

export class TabelogScraper {
  private static readonly BASE_URL = 'https://tabelog.com';
  private static readonly PREFECTURE_MAP: Record<string, string> = {
    '東京都': 'tokyo',
    '大阪府': 'osaka',
    '愛知県': 'aichi',
    '神奈川県': 'kanagawa',
    '福岡県': 'fukuoka',
    '北海道': 'hokkaido',
    '京都府': 'kyoto',
    '兵庫県': 'hyogo',
    '埼玉県': 'saitama',
    '千葉県': 'chiba'
  };

  static async scrapeBusinesses(prefecture: string = '東京都', limit: number = 20): Promise<TabelogBusiness[]> {
    try {
      const prefCode = this.PREFECTURE_MAP[prefecture] || 'tokyo';
      const url = `${this.BASE_URL}/${prefCode}/`;
      
      console.log(`🍽️ 食べログスクレイピング開始: ${url}`);

      // サイト固有の設定（長めの待機時間とランダムユーザーエージェント）
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
      ];

      const config = {
        maxRetries: 3,
        retryDelay: 5000, // 5秒間隔
        requestDelay: 8000, // 8秒間隔（より慎重に）
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        timeout: 30000
      };

      const html = await ScrapingService.fetchPage(url, config);
      
      if (!html || html.length < 1000) {
        console.warn('⚠️ 食べログ: 取得したHTMLが短すぎます');
        return [];
      }

      const businesses = this.extractBusinessData(html, prefecture, limit);
      console.log(`✅ 食べログから${businesses.length}件の企業情報を抽出`);
      
      return businesses;

    } catch (error) {
      console.error('❌ 食べログスクレイピングエラー:', error);
      return [];
    }
  }

  private static extractBusinessData(html: string, prefecture: string, limit: number): TabelogBusiness[] {
    const businesses: TabelogBusiness[] = [];
    
    // 複数のパターンで店舗名を抽出
    const patterns = [
      // メインのリストパターン
      /<h3[^>]*class="[^"]*list-rst__name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 代替パターン1
      /<a[^>]*class="[^"]*list-rst__rst-name-target[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 代替パターン2
      /<div[^>]*class="[^"]*list-rst__header[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // シンプルパターン
      /<a[^>]*href="(\/[^"]*\/[^"]*\/\d+\/)"[^>]*>([^<]+)<\/a>/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < limit) {
        const [, url, name] = match;
        const cleanName = name.trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&');
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          businesses.push({
            name: cleanName,
            url: url?.startsWith('http') ? url : `${this.BASE_URL}${url}`,
            area: prefecture
          });
        }
      }
      
      if (businesses.length >= limit) break;
    }

    // 評価やジャンル情報の抽出（可能であれば）
    businesses.forEach(business => {
      this.enrichBusinessData(business, html);
    });

    return businesses.slice(0, limit);
  }

  private static enrichBusinessData(business: TabelogBusiness, html: string): void {
    try {
      // 評価の抽出
      const ratingPattern = new RegExp(`${business.name}[\\s\\S]*?class="[^"]*c-rating__val[^"]*"[^>]*>([0-9.]+)`, 'i');
      const ratingMatch = html.match(ratingPattern);
      if (ratingMatch) {
        business.rating = parseFloat(ratingMatch[1]);
      }

      // ジャンルの抽出
      const genrePattern = new RegExp(`${business.name}[\\s\\S]*?class="[^"]*list-rst__category[^"]*"[^>]*>([^<]+)`, 'i');
      const genreMatch = html.match(genrePattern);
      if (genreMatch) {
        business.genre = genreMatch[1].trim();
      }
    } catch (error) {
      // エラーは無視（基本情報は取得済み）
    }
  }

  static getAvailablePrefectures(): string[] {
    return Object.keys(this.PREFECTURE_MAP);
  }
}