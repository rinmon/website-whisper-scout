
import { supabase } from '@/integrations/supabase/client';
import { Business, BusinessAnalysis } from '@/types/business';

export class SupabaseBusinessService {
  // 企業データをSupabaseに保存
  static async saveBusiness(business: Omit<Business, 'id'>): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: business.name,
          industry: business.industry,
          location: business.location,
          website_url: business.website_url,
          has_website: business.has_website,
          overall_score: business.overall_score,
          technical_score: business.technical_score,
          eeat_score: business.eeat_score,
          content_score: business.content_score,
          ai_content_score: business.ai_content_score,
          phone: business.phone,
          address: business.address,
          established_year: business.established_year,
          employee_count: business.employee_count,
          capital: business.capital,
          description: business.description,
          last_analyzed: business.last_analyzed,
          is_new: business.is_new,
          data_source: business.data_source
        })
        .select()
        .single();

      if (error) {
        console.error('企業データ保存エラー:', error);
        return null;
      }

      return data as Business;
    } catch (error) {
      console.error('企業データ保存エラー:', error);
      return null;
    }
  }

  // 複数の企業データを一括保存（重複排除付き）
  static async saveBusinesses(businesses: Omit<Business, 'id'>[]): Promise<Business[]> {
    const savedBusinesses: Business[] = [];
    
    for (const business of businesses) {
      // 既存の企業データをチェック（名前と場所で重複チェック）
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, name, location, updated_at')
        .eq('name', business.name)
        .eq('location', business.location)
        .single();

      if (existing) {
        // 既存データを更新
        const { data: updated, error } = await supabase
          .from('businesses')
          .update({
            website_url: business.website_url || existing.website_url,
            has_website: business.has_website,
            overall_score: business.overall_score,
            technical_score: business.technical_score,
            eeat_score: business.eeat_score,
            content_score: business.content_score,
            ai_content_score: business.ai_content_score,
            phone: business.phone || existing.phone,
            address: business.address || existing.address,
            description: business.description || existing.description,
            last_analyzed: business.last_analyzed
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && updated) {
          savedBusinesses.push(updated as Business);
        }
      } else {
        // 新規追加
        const saved = await this.saveBusiness(business);
        if (saved) {
          savedBusinesses.push(saved);
        }
      }
    }

    console.log(`✅ Supabase保存完了: ${savedBusinesses.length}社`);
    return savedBusinesses;
  }

  // 企業データを取得
  static async getBusinesses(limit?: number, offset?: number): Promise<Business[]> {
    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('企業データ取得エラー:', error);
        return [];
      }

      return data as Business[];
    } catch (error) {
      console.error('企業データ取得エラー:', error);
      return [];
    }
  }

  // 企業分析データを保存
  static async saveBusinessAnalysis(analysis: Omit<BusinessAnalysis, 'id'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_analyses')
        .insert({
          business_id: analysis.business_id,
          analysis_date: analysis.analysis_date,
          technical_details: analysis.technical_details,
          content_analysis: analysis.content_analysis,
          eeat_factors: analysis.eeat_factors
        });

      if (error) {
        console.error('分析データ保存エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('分析データ保存エラー:', error);
      return false;
    }
  }

  // 統計データを取得
  static async getBusinessStats(): Promise<{
    totalCount: number;
    withWebsite: number;
    withoutWebsite: number;
    byIndustry: Record<string, number>;
    byLocation: Record<string, number>;
  }> {
    try {
      // 総数を取得
      const { count: totalCount } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

      // ウェブサイトありの数を取得
      const { count: withWebsite } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('has_website', true);

      // 業界別統計を取得
      const { data: industryData } = await supabase
        .from('businesses')
        .select('industry')
        .not('industry', 'is', null);

      // 地域別統計を取得
      const { data: locationData } = await supabase
        .from('businesses')
        .select('location')
        .not('location', 'is', null);

      const byIndustry: Record<string, number> = {};
      industryData?.forEach(item => {
        if (item.industry) {
          byIndustry[item.industry] = (byIndustry[item.industry] || 0) + 1;
        }
      });

      const byLocation: Record<string, number> = {};
      locationData?.forEach(item => {
        if (item.location) {
          byLocation[item.location] = (byLocation[item.location] || 0) + 1;
        }
      });

      return {
        totalCount: totalCount || 0,
        withWebsite: withWebsite || 0,
        withoutWebsite: (totalCount || 0) - (withWebsite || 0),
        byIndustry,
        byLocation
      };
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      return {
        totalCount: 0,
        withWebsite: 0,
        withoutWebsite: 0,
        byIndustry: {},
        byLocation: {}
      };
    }
  }

  // ローカルストレージからSupabaseへのデータ移行
  static async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('accumulated_business_data');
      if (!localData) {
        console.log('ローカルデータが見つかりません');
        return true;
      }

      const businesses: Business[] = JSON.parse(localData);
      console.log(`🔄 ローカルデータ移行開始: ${businesses.length}社`);

      // ローカルデータをSupabaseに移行
      const migrated = await this.saveBusinesses(businesses);
      
      console.log(`✅ データ移行完了: ${migrated.length}社`);
      
      // 移行完了後、ローカルストレージをクリア
      localStorage.removeItem('accumulated_business_data');
      localStorage.removeItem('data_last_updated');
      
      return true;
    } catch (error) {
      console.error('データ移行エラー:', error);
      return false;
    }
  }
}
