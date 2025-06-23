import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Business, BusinessPayload } from '@/types/business';
import { SupabaseBusinessService } from '@/services/supabaseBusinessService';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

// デフォルトの統計データ
const defaultStats = {
  totalCount: 0,
  withWebsite: 0,
  withoutWebsite: 0,
  byIndustry: {},
  byLocation: {},
};

/**
 * ログインユーザーに紐づく企業データと統計情報を管理するカスタムフック
 */
export const useBusinessData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKeyBusinesses = ['businesses', user?.id];
  const queryKeyStats = ['businessStats', user?.id];

  // Supabaseからビジネスデータを取得するためのクエリ
  const { data: businesses = [], isLoading: isBusinessesLoading } = useQuery<Business[], Error>({ 
    queryKey: queryKeyBusinesses,
    queryFn: async () => {
      if (!user) {
        console.log('❌ [useBusinessData] No authenticated user found');
        return [];
      }
      console.log('✅ [useBusinessData] Fetching businesses for user.id:', user.id);
      const result = await SupabaseBusinessService.getBusinesses(user.id);
      console.log(`📊 [useBusinessData] Fetched ${result.length} businesses:`, result);
      console.log('🔍 [useBusinessData] Businesses data:', businesses);
      return result;
    },
    enabled: !!user,
  });

  // Supabaseから統計データを取得するためのクエリ
  const { data: stats = defaultStats, isLoading: isStatsLoading } = useQuery({
    queryKey: queryKeyStats,
    queryFn: async () => {
      if (!user) {
        console.log('❌ [useBusinessData] No authenticated user for stats');
        return defaultStats;
      }
      console.log('✅ [useBusinessData] Fetching stats for user.id:', user.id);
      const result = await SupabaseBusinessService.getBusinessStats(user.id);
      console.log('📈 [useBusinessData] Fetched stats:', result);
      console.log('🔍 [useBusinessData] Stats data:', stats);
      return result;
    },
    enabled: !!user,
  });

  // データを無効化して再取得をトリガーする共通関数
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeyBusinesses });
    queryClient.invalidateQueries({ queryKey: queryKeyStats });
    console.log('[useBusinessData] Business and stats queries invalidated.');
  };

  // データ保存用のMutation
  const saveBusinessesMutation = useMutation({
    mutationFn: (newBusinesses: BusinessPayload[]) => {
      if (!user) throw new Error('User is not authenticated.');
      return SupabaseBusinessService.saveBusinesses(newBusinesses, user.id);
    },
    onSuccess: () => {
      console.log('[useBusinessData] Save successful, invalidating queries.');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to save businesses:', error);
    },
  });

  // 全データ削除用のMutation
  const deleteAllMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User is not authenticated to delete data.');
      return SupabaseBusinessService.deleteAllBusinessData(user.id);
    },
    onSuccess: (result) => {
      if (result.error) {
        throw new Error(result.error.message);
      }
      console.log('[useBusinessData] Delete successful, invalidating queries.');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to delete all data:', error);
    },
  });

  // コンポーネントがマウントされたときに認証状態とデータをログ出力
  useEffect(() => {
    console.log('🔍 [useBusinessData] Current auth state:', { 
      userId: user?.id, 
      authenticated: !!user, 
      businessCount: businesses.length,
      stats: stats
    });
  }, [user, businesses, stats]);

  // コンポーネントがマウントされたときに認証状態とデータをログ出力
  useEffect(() => {
    console.log('🔍 [useBusinessData] Current auth state:', { 
      userId: user?.id, 
      authenticated: !!user, 
      businessCount: businesses.length,
      stats: stats
    });
  }, [user, businesses, stats]);

  return {
    businesses,
    stats,
    isLoading: isBusinessesLoading || isStatsLoading,
    isSaving: saveBusinessesMutation.isPending,
    isDeleting: deleteAllMutation.isPending,
    // Mutations
    saveBusinesses: saveBusinessesMutation.mutateAsync,
    clearAllData: deleteAllMutation.mutateAsync,
    // Manual refetch
    refreshData: invalidateQueries,
  };
};

// 特定企業の詳細分析データを取得するフック
export const useBusinessAnalysis = (businessId: string) => {
  return useQuery({
    queryKey: ['business-analysis', businessId],
    queryFn: async () => {
      console.log(`企業ID ${businessId} の詳細分析を実行中...`);
      
      // 暫定的なモックデータ
      return {
        business_id: businessId,
        analysis_date: new Date().toISOString(),
        technical_details: {
          page_speed: Math.random() * 100,
          mobile_friendly: Math.random() > 0.3,
          ssl_certificate: Math.random() > 0.2,
          meta_tags_complete: Math.random() > 0.4,
          structured_data: Math.random() > 0.6,
        },
        content_analysis: {
          text_quality: Math.random() * 5,
          readability_score: Math.random() * 100,
          keyword_density: Math.random() * 3,
          content_length: Math.floor(Math.random() * 5000) + 500,
        },
        eeat_factors: {
          contact_info: Math.random() > 0.3,
          about_page: Math.random() > 0.4,
          privacy_policy: Math.random() > 0.5,
          terms_of_service: Math.random() > 0.6,
          social_media_links: Math.random() > 0.4,
        },
      };
    },
    enabled: !!businessId,
    staleTime: 1000 * 60 * 60, // 1時間キャッシュ
  });
};
