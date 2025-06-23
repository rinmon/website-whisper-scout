
import { ScrapingService } from './scrapingService';
import { BusinessPayload } from '@/types/business';

export class EkitenScraper {
  private static readonly BASE_URL = 'https://www.ekiten.jp';

  static async scrapeBusinessData(prefecture: string = '東京都'): Promise<BusinessPayload[]> {
    console.log(`🏪 えきてんから${prefecture}の店舗データを取得開始`);
    
    try {
      const searchUrl = this.getSearchUrl(prefecture);
      const html = await ScrapingService.fetchPage(searchUrl);
      
      const businesses = this.parseBusinessData(html, prefecture);
      console.log(`✅ えきてんから${businesses.length}件の店舗データを取得`);
      
      return businesses;
    } catch (error) {
      console.error('❌ えきてんのスクレイピングエラー:', error);
      throw error;
    }
  }

  private static getSearchUrl(prefecture: string): string {
    const prefectureMap: Record<string, string> = {
      '東京都': 'tokyo',
      '大阪府': 'osaka', 
      '愛知県': 'aichi',
      '神奈川県': 'kanagawa',
      '福岡県': 'fukuoka'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    return `${this.BASE_URL}/${prefCode}/`;
  }

  private static parseBusinessData(html: string, prefecture: string): BusinessPayload[] {
    const businesses: BusinessPayload[] = [];
    
    try {
      // 店舗情報の抽出
      const shopPattern = /<div[^>]*class="[^"]*shop-info[^"]*"[^>]*>(.*?)<\/div>/gs;
      const matches = html.match(shopPattern);
      
      if (matches) {
        matches.forEach((match, index) => {
          try {
            const name = this.extractName(match);
            const address = this.extractAddress(match);
            const phone = this.extractPhone(match);
            const website = this.extractWebsite(match);
            const category = this.extractCategory(match);
            
            if (name) {
              businesses.push({
                name: name,
                website_url: website || '',
                has_website: !!website,
                location: prefecture,
                industry: category || '不明',
                phone: phone || '',
                address: address || '',
                data_source: 'えきてん',
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
    const nameMatch = html.match(/<h3[^>]*class="[^"]*shop-name[^"]*"[^>]*>([^<]+)<\/h3>/) ||
                      html.match(/<a[^>]*class="[^"]*shop-name[^"]*"[^>]*>([^<]+)<\/a>/);
    return nameMatch ? nameMatch[1].trim() : null;
  }

  private static extractAddress(html: string): string | null {
    const addressMatch = html.match(/<span[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/span>/) ||
                         html.match(/住所[^>]*>([^<]+)</);
    return addressMatch ? addressMatch[1].trim() : null;
  }

  private static extractPhone(html: string): string | null {
    const phoneMatch = html.match(/(\d{2,4}-\d{2,4}-\d{4})/) ||
                      html.match(/電話[^>]*>([^<]+)</);
    return phoneMatch ? phoneMatch[1] : null;
  }

  private static extractWebsite(html: string): string | null {
    const websiteMatch = html.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>.*?サイト.*?<\/a>/i);
    return websiteMatch ? websiteMatch[1] : null;
  }

  private static extractCategory(html: string): string | null {
    const categoryMatch = html.match(/<span[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/span>/);
    return categoryMatch ? categoryMatch[1].trim() : null;
  }
}
