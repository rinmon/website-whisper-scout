
import { Business } from '@/types/business';

export class DataStorageService {
  private static readonly STORAGE_KEY = 'accumulated_business_data';
  private static readonly LAST_UPDATED_KEY = 'data_last_updated';

  // 蓄積されたデータを取得
  static getAccumulatedData(): Business[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      return [];
    }
  }

  // データを蓄積（重複排除あり）
  static addBusinessData(newBusinesses: Business[]): Business[] {
    const existingData = this.getAccumulatedData();
    const combined = [...existingData, ...newBusinesses];
    
    // 重複排除（企業名と所在地で判定）
    const uniqueData = this.removeDuplicates(combined);
    
    // ローカルストレージに保存
    this.saveData(uniqueData);
    
    console.log(`データ蓄積完了: 新規${newBusinesses.length}件、重複排除後総計${uniqueData.length}件`);
    
    return uniqueData;
  }

  // 重複排除ロジック
  private static removeDuplicates(businesses: Business[]): Business[] {
    const seen = new Map<string, Business>();
    
    businesses.forEach(business => {
      // 企業名を正規化
      const normalizedName = business.name
        .replace(/株式会社|㈱/g, '(株)')
        .replace(/有限会社|㈲/g, '(有)')
        .replace(/合同会社/g, '(合)')
        .trim()
        .toLowerCase();
      
      // 重複判定のキー（企業名+所在地）
      const key = `${normalizedName}-${business.location}`;
      
      // より新しいデータまたは情報が豊富なデータを優先
      if (!seen.has(key)) {
        seen.set(key, business);
      } else {
        const existing = seen.get(key)!;
        const newIsNewer = new Date(business.last_analyzed || '1970-01-01') > 
                          new Date(existing.last_analyzed || '1970-01-01');
        const newHasMoreInfo = (business.website_url ? 1 : 0) + 
                              (business.phone ? 1 : 0) + 
                              (business.description ? 1 : 0) >
                              (existing.website_url ? 1 : 0) + 
                              (existing.phone ? 1 : 0) + 
                              (existing.description ? 1 : 0);
        
        if (newIsNewer || newHasMoreInfo) {
          seen.set(key, business);
        }
      }
    });
    
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // データを保存
  private static saveData(businesses: Business[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(businesses));
      localStorage.setItem(this.LAST_UPDATED_KEY, new Date().toISOString());
    } catch (error) {
      console.error('データ保存エラー:', error);
    }
  }

  // 最終更新日時を取得
  static getLastUpdated(): string | null {
    return localStorage.getItem(this.LAST_UPDATED_KEY);
  }

  // データの統計情報を取得
  static getDataStats(): {
    totalCount: number;
    withWebsite: number;
    withoutWebsite: number;
    byIndustry: Record<string, number>;
    byLocation: Record<string, number>;
    lastUpdated: string | null;
  } {
    const data = this.getAccumulatedData();
    
    const stats = {
      totalCount: data.length,
      withWebsite: data.filter(b => b.has_website).length,
      withoutWebsite: data.filter(b => !b.has_website).length,
      byIndustry: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
      lastUpdated: this.getLastUpdated()
    };
    
    // 業界別統計
    data.forEach(business => {
      stats.byIndustry[business.industry] = (stats.byIndustry[business.industry] || 0) + 1;
      stats.byLocation[business.location] = (stats.byLocation[business.location] || 0) + 1;
    });
    
    return stats;
  }

  // データを完全削除（別機能として分離）
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LAST_UPDATED_KEY);
    console.log('蓄積データを完全削除しました');
  }

  // 特定条件のデータを削除
  static removeBusinessesByCondition(condition: (business: Business) => boolean): Business[] {
    const data = this.getAccumulatedData();
    const filtered = data.filter(business => !condition(business));
    this.saveData(filtered);
    console.log(`条件に該当する${data.length - filtered.length}件を削除しました`);
    return filtered;
  }

  // データのエクスポート
  static exportData(): string {
    const data = this.getAccumulatedData();
    const stats = this.getDataStats();
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      stats,
      businesses: data
    }, null, 2);
  }

  // データのインポート
  static importData(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.businesses && Array.isArray(parsed.businesses)) {
        this.addBusinessData(parsed.businesses);
        return true;
      }
      return false;
    } catch (error) {
      console.error('データインポートエラー:', error);
      return false;
    }
  }
}
