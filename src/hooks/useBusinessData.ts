
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessPayload, UserBusinessData, UserBusinessPayload } from '@/types/business';
import { SupabaseBusinessService } from '@/services/supabaseBusinessService';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

// デフォルトの統計データ
const defaultStats = {
  totalCount: 0,
  withWebsite: 0,
  withoutWebsite: 0,
  favoriteCount: 0,
  byIndustry: {},
  byLocation: {},
};

/**
 * 新しいアーキテクチャに対応した企業データ管理フック
 */
export const useBusinessData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKeyUserBusinesses = ['userBusinesses', user?.id];
  const queryKeyStats = ['userBusinessStats', user?.id];

  // ユーザーの企業データを取得するためのクエリ
  const { data: businesses = [], isLoading: isBusinessesLoading } = useQuery<UserBusinessData[], Error>({ 
    queryKey: queryKeyUserBusinesses,
    queryFn: async () => {
      if (!user) {
        console.log('❌ [useBusinessData] No authenticated user found');
        return [];
      }
      console.log('✅ [useBusinessData] Fetching user businesses for user.id:', user.id);
      const result = await SupabaseBusinessService.getUserBusinesses(user.id);
      console.log(`📊 [useBusinessData] Fetched ${result.length} user businesses:`, result);
      return result;
    },
    enabled: !!user,
  });

  // ユーザーの統計データを取得するためのクエリ
  const { data: stats = defaultStats, isLoading: isStatsLoading } = useQuery({
    queryKey: queryKeyStats,
    queryFn: async () => {
      if (!user) {
        console.log('❌ [useBusinessData] No authenticated user for stats');
        return defaultStats;
      }
      console.log('✅ [useBusinessData] Fetching stats for user.id:', user.id);
      const result = await SupabaseBusinessService.getUserBusinessStats(user.id);
      console.log('📈 [useBusinessData] Fetched stats:', result);
      return result;
    },
    enabled: !!user,
  });

  // データを無効化して再取得をトリガーする共通関数
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeyUserBusinesses });
    queryClient.invalidateQueries({ queryKey: queryKeyStats });
    console.log('[useBusinessData] User business and stats queries invalidated.');
  };

  // 企業マスターデータ保存用のMutation（データソース機能用）
  const saveBusinessesMutation = useMutation({
    mutationFn: (newBusinesses: BusinessPayload[]) => {
      return SupabaseBusinessService.saveBusinesses(newBusinesses);
    },
    onSuccess: (savedBusinesses) => {
      console.log(`[useBusinessData] Saved ${savedBusinesses.length} businesses to master data.`);
      // 企業マスターデータの保存後は、ユーザーデータのキャッシュを無効化しない
      // ユーザーが手動で企業を追加するまでは関連付けられない
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to save businesses:', error);
    },
  });

  // 企業をユーザーのリストに追加するMutation
  const addBusinessToUserMutation = useMutation({
    mutationFn: ({ businessId, userBusinessData }: { businessId: string; userBusinessData?: Partial<UserBusinessPayload> }) => {
      if (!user) throw new Error('User is not authenticated.');
      return SupabaseBusinessService.addBusinessToUser(user.id, businessId, userBusinessData);
    },
    onSuccess: () => {
      console.log('[useBusinessData] Business added to user successfully.');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to add business to user:', error);
    },
  });

  // 複数企業をユーザーのリストに一括追加するMutation
  const addMultipleBusinessesToUserMutation = useMutation({
    mutationFn: (businessIds: string[]) => {
      if (!user) throw new Error('User is not authenticated.');
      return SupabaseBusinessService.addMultipleBusinessesToUser(user.id, businessIds);
    },
    onSuccess: (result) => {
      console.log(`[useBusinessData] ${result.length} businesses added to user successfully.`);
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to add multiple businesses to user:', error);
    },
  });

  // ユーザーの企業データ更新用のMutation
  const updateUserBusinessMutation = useMutation({
    mutationFn: ({ userBusinessId, updateData }: { userBusinessId: string; updateData: Partial<UserBusinessPayload> }) => {
      if (!user) throw new Error('User is not authenticated.');
      return SupabaseBusinessService.updateUserBusiness(user.id, userBusinessId, updateData);
    },
    onSuccess: () => {
      console.log('[useBusinessData] User business data updated successfully.');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to update user business data:', error);
    },
  });

  // 全ユーザーデータ削除用のMutation
  const deleteAllUserDataMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('User is not authenticated to delete data.');
      return SupabaseBusinessService.deleteAllUserBusinessData(user.id);
    },
    onSuccess: (result) => {
      if (result.error) {
        throw new Error(result.error.message);
      }
      console.log('[useBusinessData] All user business data deleted successfully.');
      invalidateQueries();
    },
    onError: (error) => {
      console.error('[useBusinessData] Failed to delete all user data:', error);
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

  return {
    // データ
    businesses,
    stats,
    isLoading: isBusinessesLoading || isStatsLoading,
    
    // 企業マスターデータ操作（データソース機能用）
    isSavingBusinesses: saveBusinessesMutation.isPending,
    saveBusinessesToMaster: saveBusinessesMutation.mutateAsync,
    
    // ユーザー企業データ操作
    isAddingBusiness: addBusinessToUserMutation.isPending,
    addBusinessToUser: addBusinessToUserMutation.mutateAsync,
    
    isAddingMultipleBusinesses: addMultipleBusinessesToUserMutation.isPending,
    addMultipleBusinessesToUser: addMultipleBusinessesToUserMutation.mutateAsync,
    
    isUpdatingUserBusiness: updateUserBusinessMutation.isPending,
    updateUserBusiness: updateUserBusinessMutation.mutateAsync,
    
    isDeleting: deleteAllUserDataMutation.isPending,
    clearAllUserData: deleteAllUserDataMutation.mutateAsync,
    
    // Manual refetch
    refreshData: invalidateQueries,
  };
};

// 特定企業の詳細分析データを取得するフック（変更なし）
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
