
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/types/business';
import { WebsiteAnalysis } from '@/types/websiteAnalysis';

export class SupabaseBusinessService {
  // 企業IDで企業データを取得
  static async getBusinessById(businessId: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('企業データ取得エラー:', error);
        return null;
      }

      return data as Business;
    } catch (error) {
      console.error('企業データ取得エラー:', error);
      return null;
    }
  }

  // ウェブサイト分析データを取得
  static async getWebsiteAnalysis(businessId: string): Promise<WebsiteAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('business_analyses')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('分析データ取得エラー:', error);
        return null;
      }

      // データベースの構造をWebsiteAnalysisに変換
      const analysis: WebsiteAnalysis = {
        id: data.id,
        business_id: data.business_id,
        overall_score: (data.technical_details as any)?.overall_score || 0,
        technical_score: (data.technical_details as any)?.technical_score || 0,
        content_score: (data.technical_details as any)?.content_score || 0,
        user_experience_score: (data.technical_details as any)?.user_experience_score || 0,
        seo_score: (data.technical_details as any)?.seo_score || 0,
        performance_score: (data.technical_details as any)?.performance_score || 0,
        accessibility_score: (data.technical_details as any)?.accessibility_score || 0,
        security_score: (data.technical_details as any)?.security_score || 0,
        mobile_compatibility: (data.technical_details as any)?.mobile_compatibility || false,
        ssl_certificate: (data.technical_details as any)?.ssl_certificate || false,
        page_speed: (data.technical_details as any)?.page_speed || 0,
        recommendations: (data.content_analysis as any)?.recommendations || [],
        analyzed_at: data.analysis_date,
        created_at: data.created_at,
        updated_at: data.created_at
      };

      return analysis;
    } catch (error) {
      console.error('分析データ取得エラー:', error);
      return null;
    }
  }

  // ウェブサイト分析データを保存
  static async saveWebsiteAnalysis(analysis: Omit<WebsiteAnalysis, 'id'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('business_analyses')
        .insert({
          business_id: analysis.business_id,
          analysis_date: analysis.analyzed_at,
          technical_details: {
            overall_score: analysis.overall_score,
            technical_score: analysis.technical_score,
            content_score: analysis.content_score,
            user_experience_score: analysis.user_experience_score,
            seo_score: analysis.seo_score,
            performance_score: analysis.performance_score,
            accessibility_score: analysis.accessibility_score,
            security_score: analysis.security_score,
            mobile_compatibility: analysis.mobile_compatibility,
            ssl_certificate: analysis.ssl_certificate,
            page_speed: analysis.page_speed
          },
          content_analysis: {
            recommendations: analysis.recommendations
          }
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

  // 企業データを更新
  static async updateBusiness(businessId: string, business: Partial<Business>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          overall_score: business.overall_score,
          technical_score: business.technical_score,
          content_score: business.content_score,
          user_experience_score: business.user_experience_score,
          seo_score: business.seo_score,
          last_analyzed: business.last_analyzed
        })
        .eq('id', businessId);

      if (error) {
        console.error('企業データ更新エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('企業データ更新エラー:', error);
      return false;
    }
  }
}
