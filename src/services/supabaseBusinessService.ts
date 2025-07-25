
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import { Business, BusinessAnalysis, BusinessPayload, UserBusiness, UserBusinessData, UserBusinessPayload } from '@/types/business';

export class SupabaseBusinessService {
  // 共有企業マスターデータを一括保存（重複排除と更新/新規追加）
  static async saveBusinesses(businesses: BusinessPayload[]): Promise<Business[]> {
    console.log(`[SupabaseBusinessService] Saving ${businesses.length} businesses to database`);
    
    try {
      // 重複キー制約を回避するため、corporate_numberがnullまたは空の場合は一意IDを生成
      const processedBusinesses = businesses.map((business, index) => ({
        ...business,
        corporate_number: business.corporate_number || `gen_${Date.now()}_${index}`,
        // 重複しやすいフィールドに一意性を付加
        name: business.name + (business.corporate_number ? '' : ` #${Date.now().toString().slice(-6)}`)
      }));

      // まず既存データをチェック
      const existingNumbers = processedBusinesses
        .map(b => b.corporate_number)
        .filter(Boolean);

      if (existingNumbers.length > 0) {
        const { data: existing } = await supabase
          .from('businesses')
          .select('corporate_number')
          .in('corporate_number', existingNumbers);

        const existingSet = new Set(existing?.map(e => e.corporate_number) || []);
        
        // 既存のものは除外
        const newBusinesses = processedBusinesses.filter(
          b => !existingSet.has(b.corporate_number)
        );

        if (newBusinesses.length === 0) {
          console.log('[SupabaseBusinessService] All businesses already exist, skipping');
          return [];
        }

        console.log(`[SupabaseBusinessService] Inserting ${newBusinesses.length} new businesses (${processedBusinesses.length - newBusinesses.length} duplicates skipped)`);
        
        const { data, error } = await supabase
          .from('businesses')
          .insert(newBusinesses as any)
          .select<'*', Business>('*');

        if (error) {
          console.error('[SupabaseBusinessService] Error inserting businesses:', error);
          return [];
        }

        return (data as Business[]) || [];
      } else {
        const { data, error } = await supabase
          .from('businesses')
          .insert(processedBusinesses as any)
          .select<'*', Business>('*');

        if (error) {
          console.error('[SupabaseBusinessService] Error inserting businesses:', error);
          return [];
        }

        console.log(`[SupabaseBusinessService] Successfully saved ${(data || []).length} businesses`);
        return (data as Business[]) || [];
      }
    } catch (error) {
      console.error('[SupabaseBusinessService] Failed to save businesses:', error);
      return [];
    }
  }

  // 特定ユーザーの企業データを取得（Business + UserBusiness の結合）
  static async getUserBusinesses(userId: string): Promise<UserBusinessData[]> {
    try {
      if (!userId) {
        console.log('ユーザーIDが指定されていないため、空のデータを返します。');
        return [];
      }

      const { data, error } = await supabase
        .from('user_businesses')
        .select(`
          id,
          user_overall_score,
          user_technical_score,
          user_eeat_score,
          user_content_score,
          user_ai_content_score,
          user_experience_score,
          user_seo_score,
          user_notes,
          user_tags,
          is_favorite,
          last_user_analyzed,
          added_at,
          updated_at,
          businesses:business_id (
            id,
            name,
            industry,
            location,
            website_url,
            has_website,
            overall_score,
            technical_score,
            eeat_score,
            content_score,
            ai_content_score,
            user_experience_score,
            seo_score,
            phone,
            phone_number,
            address,
            established_year,
            establishment_date,
            employee_count,
            number_of_employees,
            capital,
            description,
            catch_copy,
            last_analyzed,
            is_new,
            data_source,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('ユーザー企業データ取得エラー:', error);
        return [];
      }

      // データを平坦化してUserBusinessData形式に変換
      const userBusinessData: UserBusinessData[] = (data || []).map((item: any) => ({
        // Business情報
        ...(item.businesses || {}),
        // UserBusiness情報
        user_business_id: item.id,
        user_overall_score: item.user_overall_score,
        user_technical_score: item.user_technical_score,
        user_eeat_score: item.user_eeat_score,
        user_content_score: item.user_content_score,
        user_ai_content_score: item.user_ai_content_score,
        user_experience_score: item.user_experience_score,
        user_seo_score: item.user_seo_score,
        user_notes: item.user_notes,
        user_tags: item.user_tags,
        is_favorite: item.is_favorite,
        last_user_analyzed: item.last_user_analyzed,
        added_at: item.added_at,
      }));

      return userBusinessData;
    } catch (error) {
      console.error('ユーザー企業データ取得中に予期せぬエラー:', error);
      return [];
    }
  }

  // ユーザーが企業を自分のリストに追加
  static async addBusinessToUser(userId: string, businessId: string, userBusinessData?: Partial<UserBusinessPayload>): Promise<UserBusiness | null> {
    try {
      const payload: UserBusinessPayload = {
        business_id: businessId,
        ...userBusinessData
      };

      const { data, error } = await supabase
        .from('user_businesses')
        .upsert({ 
          user_id: userId, 
          ...payload 
        }, {
          onConflict: 'user_id, business_id'
        })
        .select<'*', UserBusiness>('*')
        .single();

      if (error) {
        console.error('企業追加エラー:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('企業追加中に予期せぬエラー:', error);
      return null;
    }
  }

  // 複数の企業をユーザーのリストに一括追加
  static async addMultipleBusinessesToUser(userId: string, businessIds: string[]): Promise<UserBusiness[]> {
    try {
      const userBusinessPayloads = businessIds.map(businessId => ({
        user_id: userId,
        business_id: businessId
      }));

      const { data, error } = await supabase
        .from('user_businesses')
        .upsert(userBusinessPayloads, {
          onConflict: 'user_id, business_id'
        })
        .select<'*', UserBusiness>('*');

      if (error) {
        console.error('複数企業追加エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('複数企業追加中に予期せぬエラー:', error);
      return [];
    }
  }

  // ユーザーの企業関連付けを更新
  static async updateUserBusiness(userId: string, userBusinessId: string, updateData: Partial<UserBusinessPayload>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_businesses')
        .update(updateData)
        .eq('id', userBusinessId)
        .eq('user_id', userId);

      if (error) {
        console.error('ユーザー企業データ更新エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('ユーザー企業データ更新中に予期せぬエラー:', error);
      return false;
    }
  }

  // 企業分析データを保存
  static async saveBusinessAnalysis(
    analysis: Omit<BusinessAnalysis, 'id' | 'business_id'>,
    businessId: string,
  ): Promise<boolean> {
    try {
      const payload = { ...analysis, business_id: businessId };
      const { error } = await supabase.from('business_analyses').insert(payload);

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

  // 特定ユーザーの全ビジネス関連付けを削除
  static async deleteAllUserBusinessData(userId: string): Promise<{ error: PostgrestError | null }> {
    console.log(`[Supabase] Deleting all user business data for user: ${userId}`);

    const { error } = await supabase
      .from('user_businesses')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Supabase] Error deleting user business data:', error);
      return { error };
    }

    console.log('[Supabase] Successfully deleted user business data.');
    return { error: null };
  }

  // モックデータ（デバッグデータ）を削除
  static async deleteMockData(): Promise<{ error: PostgrestError | null }> {
    console.log(`[Supabase] Deleting mock data from businesses table`);

    const { error } = await supabase
      .from('businesses')
      .delete()
      .or('data_source.eq.デバッグ,name.like.%デバッグテスト%');

    if (error) {
      console.error('[Supabase] Error deleting mock data:', error);
      return { error };
    }

    console.log('[Supabase] Successfully deleted mock data.');
    return { error: null };
  }

  // 特定ユーザーの統計データを取得
  static async getUserBusinessStats(userId: string): Promise<{
    totalCount: number;
    withWebsite: number;
    withoutWebsite: number;
    favoriteCount: number;
    byIndustry: Record<string, number>;
    byLocation: Record<string, number>;
  }> {
    const defaultStats = {
      totalCount: 0,
      withWebsite: 0,
      withoutWebsite: 0,
      favoriteCount: 0,
      byIndustry: {},
      byLocation: {},
    };

    try {
      if (!userId) return defaultStats;

      const { data, error } = await supabase
        .from('user_businesses')
        .select(`
          is_favorite,
          businesses:business_id (
            industry,
            location,
            has_website
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('統計データ取得エラー:', error);
        throw error;
      }

      if (!data) {
        return defaultStats;
      }

      const totalCount = data.length;
      const withWebsite = data.filter(item => item.businesses?.has_website === true).length;
      const withoutWebsite = totalCount - withWebsite;
      const favoriteCount = data.filter(item => item.is_favorite === true).length;

      const byIndustry = data.reduce((acc, item) => {
        const industry = item.businesses?.industry;
        if (industry) {
          acc[industry] = (acc[industry] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const byLocation = data.reduce((acc, item) => {
        const location = item.businesses?.location;
        if (location) {
          acc[location] = (acc[location] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return { totalCount, withWebsite, withoutWebsite, favoriteCount, byIndustry, byLocation };
    } catch (error) {
      console.error('統計データ計算エラー:', error);
      return defaultStats;
    }
  }

  // 全企業データを検索（共有マスター）
  static async searchBusinesses(searchTerm: string, limit: number = 50): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select<'*', Business>('*')
        .or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) {
        console.error('企業検索エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('企業検索中に予期せぬエラー:', error);
      return [];
    }
  }
}
