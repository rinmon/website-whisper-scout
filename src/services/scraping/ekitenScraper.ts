import { ScrapingService } from './scrapingService';

export interface EkitenBusiness {
  name: string;
  url?: string;
  category?: string;
  area?: string;
  address?: string;
}

export class EkitenScraper {
  private static readonly BASE_URL = 'https://www.ekiten.jp';
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

  static async scrapeBusinesses(prefecture: string = '東京都', limit: number = 15): Promise<EkitenBusiness[]> {
    try {
      const prefCode = this.PREFECTURE_MAP[prefecture] || 'tokyo';
      const url = `${this.BASE_URL}/${prefCode}/`;
      
      console.log(`🏪 えきてんスクレイピング開始: ${url}`);

      // えきてん固有の設定（更に慎重な設定）
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      ];

      const config = {
        maxRetries: 3,
        retryDelay: 8000, // 8秒間隔
        requestDelay: 12000, // 12秒間隔（えきてんは厳格）
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        timeout: 35000
      };

      const html = await ScrapingService.fetchPage(url, config);
      
      if (!html || html.length < 1000) {
        console.warn('⚠️ えきてん: 取得したHTMLが短すぎます');
        return [];
      }

      const businesses = this.extractBusinessData(html, prefecture, limit);
      console.log(`✅ えきてんから${businesses.length}件の企業情報を抽出`);
      
      return businesses;

    } catch (error) {
      console.error('❌ えきてんスクレイピングエラー:', error);
      return [];
    }
  }

  private static extractBusinessData(html: string, prefecture: string, limit: number): EkitenBusiness[] {
    const businesses: EkitenBusiness[] = [];
    
    // えきてん用の抽出パターン
    const patterns = [
      // メインの店舗名パターン
      /<h3[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // リスト項目パターン
      /<div[^>]*class="[^"]*shop-item[^"]*"[^>]*>[\s\S]*?<h[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // シンプルリンクパターン
      /<a[^>]*class="[^"]*shop-link[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 代替パターン
      /<div[^>]*class="[^"]*shop-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < limit) {
        const [, url, name] = match;
        const cleanName = name.trim()
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');
        
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

    // 追加情報の抽出
    businesses.forEach(business => {
      this.enrichBusinessData(business, html);
    });

    return businesses.slice(0, limit);
  }

  private static enrichBusinessData(business: EkitenBusiness, html: string): void {
    try {
      const businessNameEscaped = business.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // カテゴリの抽出
      const categoryPattern = new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*category[^"]*"[^>]*>([^<]+)`, 'i');
      const categoryMatch = html.match(categoryPattern);
      if (categoryMatch) {
        business.category = categoryMatch[1].trim();
      }

      // 住所の抽出
      const addressPattern = new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*address[^"]*"[^>]*>([^<]+)`, 'i');
      const addressMatch = html.match(addressPattern);
      if (addressMatch) {
        business.address = addressMatch[1].trim();
      }
    } catch (error) {
      // エラーは無視（基本情報は取得済み）
    }
  }

  static getAvailablePrefectures(): string[] {
    return Object.keys(this.PREFECTURE_MAP);
  }
}