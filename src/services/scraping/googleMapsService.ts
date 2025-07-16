export interface GooglePlaceDetails {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  business_hours?: string[];
  category?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

export class GoogleMapsService {
  private static readonly PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
  
  static async searchBusinessByName(
    businessName: string, 
    prefecture: string, 
    apiKey: string
  ): Promise<GooglePlaceDetails | null> {
    try {
      console.log(`🔍 Google Places検索開始: ${businessName} in ${prefecture}`);
      
      // 検索クエリを構築（都道府県を含める）
      const query = `${businessName} ${prefecture}`;
      const searchUrl = `${this.PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=ja`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Google Places API検索エラー: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        console.warn(`⚠️ Google Places: ${businessName} の検索結果が見つかりません`);
        return null;
      }
      
      // 最初の結果を選択
      const place = searchData.results[0];
      
      // Place Details APIで詳細情報を取得
      const detailsUrl = `${this.PLACES_API_BASE}/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,types,geometry&key=${apiKey}&language=ja`;
      
      const detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        throw new Error(`Google Places Details API エラー: ${detailsResponse.status}`);
      }
      
      const detailsData = await detailsResponse.json();
      
      if (!detailsData.result) {
        console.warn(`⚠️ Google Places Details: ${businessName} の詳細情報が取得できません`);
        return null;
      }
      
      const details = detailsData.result;
      
      // データを構造化
      const businessDetails: GooglePlaceDetails = {
        name: details.name || businessName,
        address: details.formatted_address,
        phone: details.formatted_phone_number,
        website: details.website,
        rating: details.rating,
        reviews_count: details.user_ratings_total,
        business_hours: details.opening_hours?.weekday_text,
        category: details.types?.[0]?.replace(/_/g, ' '),
        latitude: details.geometry?.location?.lat,
        longitude: details.geometry?.location?.lng,
        place_id: place.place_id
      };
      
      console.log(`✅ Google Places詳細取得完了: ${businessDetails.name}`);
      return businessDetails;
      
    } catch (error) {
      console.error(`❌ Google Maps API エラー (${businessName}):`, error);
      return null;
    }
  }
  
  static async batchSearchBusinesses(
    businessNames: string[], 
    prefecture: string, 
    apiKey: string,
    delayMs: number = 1000
  ): Promise<GooglePlaceDetails[]> {
    const results: GooglePlaceDetails[] = [];
    
    console.log(`🔍 Google Places一括検索開始: ${businessNames.length}件`);
    
    for (const businessName of businessNames) {
      try {
        const details = await this.searchBusinessByName(businessName, prefecture, apiKey);
        if (details) {
          results.push(details);
        }
        
        // API レート制限対策
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
      } catch (error) {
        console.error(`❌ ${businessName} の検索でエラー:`, error);
        continue;
      }
    }
    
    console.log(`✅ Google Places一括検索完了: ${results.length}/${businessNames.length}件取得`);
    return results;
  }
  
  static validateApiKey(apiKey: string): boolean {
    return apiKey && apiKey.startsWith('AIza') && apiKey.length >= 35;
  }
}