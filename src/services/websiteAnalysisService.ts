import { supabase } from '@/integrations/supabase/client';
import { WebsiteAnalysis, ProposalData } from '@/types/business';

export class WebsiteAnalysisService {
  /**
   * ウェブサイトの詳細分析を実行
   */
  static async analyzeWebsite(businessId: string, websiteUrl: string): Promise<WebsiteAnalysis | null> {
    try {
      console.log(`🔍 ウェブサイト分析開始: ${websiteUrl}`);
      
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          businessId,
          websiteUrl 
        }
      });

      if (error) {
        console.error('ウェブサイト分析エラー:', error);
        throw new Error(`分析エラー: ${error.message}`);
      }

      console.log('✅ ウェブサイト分析完了:', data);
      return data.analysisResult;

    } catch (error) {
      console.error('❌ ウェブサイト分析失敗:', error);
      throw error;
    }
  }

  /**
   * 企業の分析結果を取得
   */
  static async getAnalysisResults(businessId: string): Promise<WebsiteAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('website_analysis')
        .select('*')
        .eq('business_id', businessId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('分析結果取得エラー:', error);
      return null;
    }
  }

  /**
   * 複数企業の一括分析
   */
  static async analyzeBatch(businesses: Array<{ id: string; website_url: string }>): Promise<{
    successful: number;
    failed: number;
    results: Array<{ businessId: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const business of businesses) {
      if (!business.website_url) {
        results.push({
          businessId: business.id,
          success: false,
          error: 'ウェブサイトURLが設定されていません'
        });
        failed++;
        continue;
      }

      try {
        await this.analyzeWebsite(business.id, business.website_url);
        results.push({
          businessId: business.id,
          success: true
        });
        successful++;
      } catch (error) {
        results.push({
          businessId: business.id,
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー'
        });
        failed++;
      }

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { successful, failed, results };
  }

  /**
   * 営業提案書を生成
   */
  static async generateProposal(
    businessId: string, 
    proposalType: 'improvement' | 'new_website' | 'seo' | 'comprehensive' = 'improvement',
    customTemplate?: any
  ): Promise<ProposalData> {
    try {
      console.log(`📄 営業提案書生成開始: ${businessId}`);
      
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { 
          businessId,
          proposalType,
          customTemplate
        }
      });

      if (error) {
        console.error('提案書生成エラー:', error);
        throw new Error(`提案書生成エラー: ${error.message}`);
      }

      console.log('✅ 営業提案書生成完了');
      return data.proposal;

    } catch (error) {
      console.error('❌ 営業提案書生成失敗:', error);
      throw error;
    }
  }

  /**
   * 提案書のHTMLを取得
   */
  static async generateProposalHTML(
    businessId: string, 
    proposalType: 'improvement' | 'new_website' | 'seo' | 'comprehensive' = 'improvement'
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { 
          businessId,
          proposalType
        }
      });

      if (error) {
        throw new Error(`提案書HTML生成エラー: ${error.message}`);
      }

      return data.html;

    } catch (error) {
      console.error('❌ 提案書HTML生成失敗:', error);
      throw error;
    }
  }

  /**
   * 業界平均スコアを取得
   */
  static async getIndustryAverages(industry: string): Promise<{
    overall: number;
    technical: number;
    eeat: number;
    content: number;
    userExperience: number;
    seo: number;
    sampleSize: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('overall_score, technical_score, eeat_score, content_score, user_experience_score, seo_score')
        .eq('industry', industry)
        .not('overall_score', 'is', null);

      if (error) {
        throw error;
      }

      if (data.length === 0) {
        return {
          overall: 0,
          technical: 0,
          eeat: 0,
          content: 0,
          userExperience: 0,
          seo: 0,
          sampleSize: 0
        };
      }

      const averages = data.reduce((acc, business) => {
        acc.overall += business.overall_score || 0;
        acc.technical += business.technical_score || 0;
        acc.eeat += business.eeat_score || 0;
        acc.content += business.content_score || 0;
        acc.userExperience += business.user_experience_score || 0;
        acc.seo += business.seo_score || 0;
        return acc;
      }, {
        overall: 0,
        technical: 0,
        eeat: 0,
        content: 0,
        userExperience: 0,
        seo: 0
      });

      const sampleSize = data.length;

      return {
        overall: averages.overall / sampleSize,
        technical: averages.technical / sampleSize,
        eeat: averages.eeat / sampleSize,
        content: averages.content / sampleSize,
        userExperience: averages.userExperience / sampleSize,
        seo: averages.seo / sampleSize,
        sampleSize
      };

    } catch (error) {
      console.error('業界平均取得エラー:', error);
      return {
        overall: 0,
        technical: 0,
        eeat: 0,
        content: 0,
        userExperience: 0,
        seo: 0,
        sampleSize: 0
      };
    }
  }

  /**
   * 改善提案のランク付けを行う
   */
  static rankImprovementOpportunities(businesses: Array<{
    id: string;
    name: string;
    overall_score?: number;
    technical_score?: number;
    eeat_score?: number;
    content_score?: number;
    user_experience_score?: number;
    seo_score?: number;
    has_website: boolean;
  }>): Array<{
    businessId: string;
    name: string;
    opportunityScore: number;
    reasons: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    
    return businesses
      .map(business => {
        let opportunityScore = 0;
        const reasons = [];

        // ウェブサイトがない場合は最高優先度
        if (!business.has_website) {
          opportunityScore += 5;
          reasons.push('ウェブサイト未保有');
        } else {
          // 各スコアに基づく機会評価
          const scores = {
            overall: business.overall_score || 0,
            technical: business.technical_score || 0,
            eeat: business.eeat_score || 0,
            content: business.content_score || 0,
            userExperience: business.user_experience_score || 0,
            seo: business.seo_score || 0
          };

          Object.entries(scores).forEach(([key, score]) => {
            if (score < 2) {
              opportunityScore += 2;
              reasons.push(`${this.getScoreLabel(key)}が低評価`);
            } else if (score < 3) {
              opportunityScore += 1;
              reasons.push(`${this.getScoreLabel(key)}に改善余地`);
            }
          });
        }

        let priority: 'high' | 'medium' | 'low';
        if (opportunityScore >= 4) priority = 'high';
        else if (opportunityScore >= 2) priority = 'medium';
        else priority = 'low';

        return {
          businessId: business.id,
          name: business.name,
          opportunityScore,
          reasons,
          priority
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  private static getScoreLabel(scoreType: string): string {
    const labels: Record<string, string> = {
      overall: '総合評価',
      technical: '技術的評価',
      eeat: '信頼性評価',
      content: 'コンテンツ品質',
      userExperience: 'ユーザー体験',
      seo: 'SEO評価'
    };
    return labels[scoreType] || scoreType;
  }
}