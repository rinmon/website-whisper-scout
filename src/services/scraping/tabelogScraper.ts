
import { ScrapingService } from './scrapingService';
import { BusinessPayload } from '@/types/business';

export class TabelogScraper {
  private static readonly BASE_URL = 'https://tabelog.com';
  private static readonly SEARCH_URL = 'https://tabelog.com/tokyo/';

  static async scrapeBusinessData(prefecture: string = '東京'): Promise<BusinessPayload[]> {
    console.log(`🍽️ 食べログから${prefecture}の店舗データを取得開始`);
    
    try {
      const searchUrl = this.getSearchUrl(prefecture);
      const html = await ScrapingService.fetchPage(searchUrl);
      
      const businesses = this.parseBusinessData(html, prefecture);
      console.log(`✅ 食べログから${businesses.length}件の店舗データを取得`);
      
      return businesses;
    } catch (error) {
      console.error('❌ 食べログのスクレイピングエラー:', error);
      throw error;
    }
  }

  private static getSearchUrl(prefecture: string): string {
    const prefectureMap: Record<string, string> = {
      '東京': 'tokyo',
      '大阪': 'osaka',
      '愛知': 'aichi',
      '神奈川': 'kanagawa',
      '福岡': 'fukuoka'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    return `${this.BASE_URL}/${prefCode}/`;
  }

  private static parseBusinessData(html: string, prefecture: string): BusinessPayload[] {
    const businesses: BusinessPayload[] = [];
    
    try {
      // 店舗リストの抽出（簡略化した例）
      const restaurantPattern = /<div[^>]*class="[^"]*list-rst[^"]*"[^>]*>(.*?)<\/div>/gs;
      const matches = html.match(restaurantPattern);
      
      if (matches) {
        matches.forEach((match, index) => {
          try {
            const name = this.extractName(match);
            const address = this.extractAddress(match);
            const phone = this.extractPhone(match);
            const website = this.extractWebsite(match);
            
            if (name) {
              businesses.push({
                name: name,
                website_url: website || '',
                has_website: !!website,
                location: prefecture,
                industry: '飲食業',
                phone: phone || '',
                address: address || '',
                data_source: '食べログ',
                is_new: true
              });
            }
          } catch (error) {
            console.warn(`店舗データ解析エラー (${index}):`, error);
          }
        });
      }
    } catch (error) {
      console.error('HTML解析エラー:', error);
    }
    
    return businesses;
  }

  private static extractName(html: string): string | null {
    const nameMatch = html.match(/<a[^>]*class="[^"]*rst-name[^"]*"[^>]*>([^<]+)<\/a>/);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  private static extractAddress(html: string): string | null {
    const addressMatch = html.match(/<span[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/span>/);
    return addressMatch ? addressMatch[1].trim() : null;
  }

  private static extractPhone(html: string): string | null {
    const phoneMatch = html.match(/(\d{2,4}-\d{2,4}-\d{4})/);
    return phoneMatch ? phoneMatch[1] : null;
  }

  private static extractWebsite(html: string): string | null {
    const websiteMatch = html.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>公式サイト<\/a>/);
    return websiteMatch ? websiteMatch[1] : null;
  }
}
