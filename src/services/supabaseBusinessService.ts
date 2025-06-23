import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import { Business, BusinessAnalysis, BusinessPayload } from '@/types/business';

export class SupabaseBusinessService {
  // 複数の企業データを一括保存（重複排除と更新/新規追加）
  static async saveBusinesses(businesses: BusinessPayload[], userId: string): Promise<Business[]> {
    const upsertPayload = businesses.map(business => ({
      ...business,
      user_id: userId,
    }));

    // Supabaseクライアントの複雑な型推論の問題を回避するため、ペイロードを`as any`でキャストします。
    // これは、この特定の問題に対する最も安定的で実用的な回避策です。
    const { data, error } = await supabase
      .from('businesses')
      .upsert(upsertPayload as any, {
        onConflict: 'user_id, name, location',
      })
      .select<'*', Business>('*');

    if (error) {
      console.error('[Supabase] Error upserting businesses:', error);
      if (error.message.includes('constraint')) {
        console.error(
          '[Supabase] Hint: Did you set a UNIQUE constraint on (user_id, name, location) in the `businesses` table?',
        );
      }
      return [];
    }

    return (data as Business[]) || [];
  }

  // 特定ユーザーの企業データを取得
  static async getBusinesses(userId: string): Promise<Business[]> {
    try {
      if (!userId) {
        console.log('ユーザーIDが指定されていないため、空のデータを返します。');
        return [];
      }

      // selectにジェネリクスで型を明示的に指定し、TypeScriptの型推論を補助します。
      // これにより`Type instantiation is excessively deep`エラーを回避します。
      const { data, error } = await supabase
        .from('businesses')
        .select<'*', Business>('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('企業データ取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('企業データ取得中に予期せぬエラー:', error);
      return [];
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

  // 特定ユーザーの全ビジネスデータを削除（関連データも含む）
  static async deleteAllBusinessData(userId: string): Promise<{ error: PostgrestError | null }> {
    console.log(`[Supabase] Deleting all data for user: ${userId}`);

    // selectにジェネリクスで型を明示的に指定
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select<'id', { id: string }>('id')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[Supabase] Error fetching businesses to delete:', fetchError);
      return { error: fetchError };
    }

    if (!businesses || businesses.length === 0) {
      console.log('[Supabase] No businesses found to delete.');
      return { error: null };
    }

    const businessIds = businesses.map(b => b.id);
    console.log(`[Supabase] Found ${businessIds.length} businesses to delete.`);

    const { error: analysisError } = await supabase
      .from('business_analyses')
      .delete()
      .in('business_id', businessIds);

    if (analysisError) {
      console.error('[Supabase] Error deleting related business analyses:', analysisError);
      return { error: analysisError };
    }
    console.log('[Supabase] Successfully deleted related business analyses.');

    const { error: businessError } = await supabase.from('businesses').delete().eq('user_id', userId);

    if (businessError) {
      console.error('[Supabase] Error deleting businesses:', businessError);
      return { error: businessError };
    }

    console.log('[Supabase] Successfully deleted businesses.');
    return { error: null };
  }

  // 特定ユーザーの統計データを取得
  static async getBusinessStats(userId: string): Promise<{
    totalCount: number;
    withWebsite: number;
    withoutWebsite: number;
    byIndustry: Record<string, number>;
    byLocation: Record<string, number>;
  }> {
    const defaultStats = {
      totalCount: 0,
      withWebsite: 0,
      withoutWebsite: 0,
      byIndustry: {},
      byLocation: {},
    };

    try {
      if (!userId) return defaultStats;

      // selectにジェネリクスで型を明示的に指定
      const { data, error } = await supabase
        .from('businesses')
        .select<
          'industry, location, has_website',
          Pick<Business, 'industry' | 'location' | 'has_website'>
        >('industry, location, has_website')
        .eq('user_id', userId);

      if (error) {
        console.error('統計データ取得エラー:', error);
        throw error;
      }

      if (!data) {
        return defaultStats;
      }

      const totalCount = data.length;
      const withWebsite = data.filter(b => b.has_website === true).length;
      const withoutWebsite = totalCount - withWebsite;

      const byIndustry = data.reduce((acc, b) => {
        if (b.industry) {
          acc[b.industry] = (acc[b.industry] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const byLocation = data.reduce((acc, b) => {
        if (b.location) {
          acc[b.location] = (acc[b.location] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return { totalCount, withWebsite, withoutWebsite, byIndustry, byLocation };
    } catch (error) {
      console.error('統計データ計算エラー:', error);
      return defaultStats;
    }
  }

  // ローカルストレージからSupabaseへのデータ移行
  static async migrateFromLocalStorage(userId: string): Promise<boolean> {
    try {
      const localData = localStorage.getItem('accumulated_business_data');
      if (!localData) {
        console.log('ローカルデータが見つかりません');
        return true;
      }

      const businesses: BusinessPayload[] = JSON.parse(localData);
      console.log(`🔄 ローカルデータ移行開始: ${businesses.length}社`);

      // ローカルデータをSupabaseに移行
      const migrated = await this.saveBusinesses(businesses, userId);

      console.log(`✅ データ移行完了: ${migrated.length}社`);

      // 移行完了後、ローカルストレージをクリア
      localStorage.removeItem('accumulated_business_data');
      localStorage.removeItem('data_last_updated');
      console.log('ローカルデータを削除しました');

      return true;
    } catch (error) {
      console.error('ローカルデータからの移行エラー:', error);
      return false;
    }
  }
}
