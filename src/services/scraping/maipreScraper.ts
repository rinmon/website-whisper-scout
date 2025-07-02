import { ScrapingService } from './scrapingService';

export interface MaipreBusiness {
  name: string;
  url?: string;
  category?: string;
  area?: string;
  description?: string;
}

export class MaipreScraper {
  private static readonly BASE_URL = 'https://www.maipre.jp';
  
  static async scrapeBusinesses(prefecture: string = '東京都', limit: number = 10): Promise<MaipreBusiness[]> {
    try {
      // まいぷれは検索パラメータを使用
      const searchUrl = `${this.BASE_URL}/search/?keyword=&pref=${encodeURIComponent(prefecture)}`;
      
      console.log(`🏢 まいぷれスクレイピング開始: ${searchUrl}`);

      // まいぷれ固有の設定（最も慎重な設定）
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
      ];

      const config = {
        maxRetries: 2, // 試行回数を減らす
        retryDelay: 12000, // 12秒間隔
        requestDelay: 15000, // 15秒間隔（最も長い間隔）
        userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
        timeout: 40000
      };

      const html = await ScrapingService.fetchPage(searchUrl, config);
      
      if (!html || html.length < 1000) {
        console.warn('⚠️ まいぷれ: 取得したHTMLが短すぎます');
        return [];
      }

      const businesses = this.extractBusinessData(html, prefecture, limit);
      console.log(`✅ まいぷれから${businesses.length}件の企業情報を抽出`);
      
      return businesses;

    } catch (error) {
      console.error('❌ まいぷれスクレイピングエラー:', error);
      return [];
    }
  }

  private static extractBusinessData(html: string, prefecture: string, limit: number): MaipreBusiness[] {
    const businesses: MaipreBusiness[] = [];
    
    // まいぷれ用の抽出パターン
    const patterns = [
      // 検索結果リストパターン
      /<h3[^>]*class="[^"]*shop-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 店舗情報パターン
      /<div[^>]*class="[^"]*shop-info[^"]*"[^>]*>[\s\S]*?<h[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // シンプルパターン
      /<a[^>]*class="[^"]*store-name[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // スパン要素パターン
      /<span[^>]*class="[^"]*store-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 代替パターン
      /<div[^>]*class="[^"]*business-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
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
          .replace(/&quot;/g, '"')
          .replace(/\n/g, ' ')
          .replace(/\t/g, '');
        
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

  private static enrichBusinessData(business: MaipreBusiness, html: string): void {
    try {
      const businessNameEscaped = business.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // カテゴリの抽出
      const categoryPatterns = [
        new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*category[^"]*"[^>]*>([^<]+)`, 'i'),
        new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*genre[^"]*"[^>]*>([^<]+)`, 'i'),
        new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*business-type[^"]*"[^>]*>([^<]+)`, 'i')
      ];

      for (const pattern of categoryPatterns) {
        const match = html.match(pattern);
        if (match) {
          business.category = match[1].trim();
          break;
        }
      }

      // 説明文の抽出
      const descriptionPattern = new RegExp(`${businessNameEscaped}[\\s\\S]*?class="[^"]*description[^"]*"[^>]*>([^<]+)`, 'i');
      const descriptionMatch = html.match(descriptionPattern);
      if (descriptionMatch) {
        business.description = descriptionMatch[1].trim().substring(0, 100) + '...';
      }
    } catch (error) {
      // エラーは無視（基本情報は取得済み）
    }
  }

  static getSupportedPrefectures(): string[] {
    return [
      '東京都', '大阪府', '愛知県', '神奈川県', '福岡県',
      '北海道', '京都府', '兵庫県', '埼玉県', '千葉県',
      '静岡県', '広島県', '宮城県', '新潟県', '長野県'
    ];
  }
}