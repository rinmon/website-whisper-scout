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

  // データを蓄積（重複排除・更新処理強化）
  static addBusinessData(newBusinesses: Business[]): Business[] {
    const existingData = this.getAccumulatedData();
    console.log(`既存データ: ${existingData.length}社`);
    console.log(`新規データ: ${newBusinesses.length}社`);
    
    // 既存データを企業識別キーでマップ化
    const existingMap = new Map<string, Business>();
    existingData.forEach(business => {
      const key = this.generateBusinessKey(business);
      existingMap.set(key, business);
    });
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    // 新しいデータを処理
    newBusinesses.forEach(newBusiness => {
      const key = this.generateBusinessKey(newBusiness);
      const existing = existingMap.get(key);
      
      if (!existing) {
        // 新規追加
        existingMap.set(key, newBusiness);
        addedCount++;
        console.log(`➕ 新規追加: ${newBusiness.name}`);
      } else {
        // 既存データの更新判定
        if (this.shouldUpdate(existing, newBusiness)) {
          // より新しいまたは詳細なデータで更新
          const updatedBusiness = this.mergeBusinessData(existing, newBusiness);
          existingMap.set(key, updatedBusiness);
          updatedCount++;
          console.log(`🔄 更新: ${newBusiness.name}`);
        } else {
          // スキップ
          skippedCount++;
          console.log(`⏭️ スキップ: ${newBusiness.name} (既存データが新しい)`);
        }
      }
    });
    
    const finalData = Array.from(existingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    // ローカルストレージに保存
    this.saveData(finalData);
    
    console.log(`📊 データ蓄積完了:`);
    console.log(`  - 新規追加: ${addedCount}社`);
    console.log(`  - 更新: ${updatedCount}社`);
    console.log(`  - スキップ: ${skippedCount}社`);
    console.log(`  - 総計: ${finalData.length}社`);
    
    return finalData;
  }

  // 企業識別キーの生成（より厳密に）
  private static generateBusinessKey(business: Business): string {
    // 企業名を正規化
    const normalizedName = business.name
      .replace(/株式会社|㈱|\(株\)/g, '')
      .replace(/有限会社|㈲|\(有\)/g, '')
      .replace(/合同会社|\(合\)/g, '')
      .replace(/財団法人/g, '')
      .replace(/社団法人/g, '')
      .replace(/\s+/g, '')
      .trim()
      .toLowerCase();
    
    // 所在地を正規化
    const normalizedLocation = business.location
      .replace(/都|府|県|市|区|町|村/g, '')
      .trim()
      .toLowerCase();
    
    return `${normalizedName}-${normalizedLocation}`;
  }

  // 更新すべきかどうかの判定
  private static shouldUpdate(existing: Business, newBusiness: Business): boolean {
    // 最終分析日の比較
    const existingDate = new Date(existing.last_analyzed || '1970-01-01');
    const newDate = new Date(newBusiness.last_analyzed || '1970-01-01');
    
    if (newDate > existingDate) {
      return true; // 新しいデータの場合は更新
    }
    
    if (newDate.getTime() === existingDate.getTime()) {
      // 同じ日付の場合は情報の充実度で判定
      const existingInfo = this.calculateInfoRichness(existing);
      const newInfo = this.calculateInfoRichness(newBusiness);
      return newInfo > existingInfo;
    }
    
    return false; // 古いデータは更新しない
  }

  // 情報の充実度を計算
  private static calculateInfoRichness(business: Business): number {
    let score = 0;
    
    if (business.website_url) score += 2;
    if (business.phone) score += 1;
    if (business.address) score += 1;
    if (business.description && business.description.length > 10) score += 1;
    if (business.established_year) score += 1;
    if (business.employee_count) score += 1;
    if (business.capital) score += 1;
    
    return score;
  }

  // 企業データのマージ（既存データを基準に新しい情報で補完）
  private static mergeBusinessData(existing: Business, newData: Business): Business {
    return {
      ...existing,
      // より詳細な情報があれば更新
      website_url: newData.website_url || existing.website_url,
      phone: newData.phone || existing.phone,
      address: newData.address || existing.address,
      description: (newData.description && newData.description.length > (existing.description?.length || 0)) 
        ? newData.description : existing.description,
      established_year: newData.established_year || existing.established_year,
      employee_count: newData.employee_count || existing.employee_count,
      capital: newData.capital || existing.capital,
      // スコアは新しいものを採用
      overall_score: newData.overall_score,
      technical_score: newData.technical_score,
      eeat_score: newData.eeat_score,
      content_score: newData.content_score,
      ai_content_score: newData.ai_content_score,
      last_analyzed: newData.last_analyzed || existing.last_analyzed
    };
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

  // データを完全削除
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
