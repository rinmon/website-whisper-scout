
import { CorporateInfo } from '@/types/corporateData';
import { MockDataGenerator } from './mockDataGenerator';
import { AddressUtils } from './addressUtils';

// FUMA特化のデータ取得サービス
export class FumaService {
  private static readonly API_BASE_URL = 'https://fumadata.com/api';
  
  static async fetchFromFUMA(industry?: string): Promise<CorporateInfo[]> {
    console.log(`📡 FUMA（フーマ）から企業情報取得開始: ${industry || '全業種'}`);
    
    try {
      const searchUrl = `${this.API_BASE_URL}/search`;
      const searchParams = new URLSearchParams({
        limit: '50',
        ...(industry && { industry: industry })
      });

      console.log(`🔍 FUMA検索実行: ${searchUrl}?${searchParams.toString()}`);
      
      const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'ja,en;q=0.9'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ FUMA API応答エラー: ${response.status}`);
        throw new Error(`FUMA API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 FUMA API応答データ:`, data);

      // レスポンスデータの構造に基づいて企業情報を抽出
      const companies = data.companies || data.results || data.data || [];
      
      const corporateData: CorporateInfo[] = companies.map((company: any) => ({
        source: 'FUMA（フーマ）',
        name: company.name || company.company_name || company.corporate_name || '不明',
        address: company.address || company.location || '',
        prefecture: AddressUtils.extractPrefecture(company.address || company.location || ''),
        industry: company.industry || company.business_type || industry || '不明',
        capital: company.capital || company.capital_amount || '',
        employees: company.employees || company.employee_count || '',
        website: company.website || company.homepage || company.url || '',
        phone: company.phone || company.telephone || company.tel || '',
        establishedDate: company.established || company.founded || company.establishment_date || '',
        isListed: company.is_listed || false
      }));

      console.log(`✅ FUMAデータ取得完了: ${corporateData.length}社`);
      return corporateData;

    } catch (error) {
      console.error(`❌ FUMA データ取得エラー:`, error);
      
      // エラー時はフォールバックデータを返す（エラーデータは無視）
      console.log(`🔄 FUMAフォールバックデータを生成中...`);
      return this.generateFallbackData(industry);
    }
  }

  // エラー時のフォールバックデータ生成
  private static generateFallbackData(industry?: string): CorporateInfo[] {
    const industries = industry ? [industry] : ['製造業', 'IT・通信', '建設業', '小売業', 'サービス業'];
    const allData: CorporateInfo[] = [];
    
    for (const ind of industries) {
      const data = MockDataGenerator.generateMockData('FUMA（フーマ）', 15, undefined, ind);
      allData.push(...data);
    }
    
    return allData;
  }
}
