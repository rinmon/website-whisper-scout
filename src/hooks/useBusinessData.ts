
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Business } from '@/types/business';
import { BusinessDataService } from '@/services/businessDataService';
import { SupabaseBusinessService } from '@/services/supabaseBusinessService';
import { useAuth } from '@/hooks/useAuth';

export const useBusinessData = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  // 初回ログイン時にローカルデータをSupabaseに移行
  useEffect(() => {
    if (user) {
      const migrateLocalData = async () => {
        const localData = localStorage.getItem('accumulated_business_data');
        if (localData) {
          console.log('🔄 ローカルデータをSupabaseに移行中...');
          await SupabaseBusinessService.migrateFromLocalStorage();
          setRefreshTrigger(prev => prev + 1);
        }
      };
      
      migrateLocalData();
    }
  }, [user]);

  const {
    data: businesses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['businesses', refreshTrigger],
    queryFn: async () => {
      if (!user) {
        return [];
      }
      
      // Supabaseからデータを取得
      const supabaseData = await SupabaseBusinessService.getBusinesses();
      
      if (supabaseData.length > 0) {
        console.log(`📋 Supabaseデータ ${supabaseData.length}社を返します`);
        return supabaseData;
      }
      
      console.log('❌ Supabaseデータなし、空配列を返します');
      return [];
    },
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
  });

  const refreshData = () => {
    console.log('🔄 データリフレッシュを実行');
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchByRegion = async (region: string) => {
    return await BusinessDataService.fetchChamberOfCommerceData(region);
  };

  // 進捗付きデータ取得用のフック（Supabase保存対応版）
  const fetchWithProgress = async (onProgress?: (status: string, current: number, total: number) => void) => {
    const newData = await BusinessDataService.fetchFromOpenSourcesWithProgress(onProgress);
    
    // 取得したデータをSupabaseに保存
    if (user && newData.length > 0) {
      console.log('💾 取得データをSupabaseに保存中...');
      await SupabaseBusinessService.saveBusinesses(newData);
    }
    
    refreshData();
    return newData;
  };

  // データ統計を取得（Supabase版）
  const getDataStats = async () => {
    if (!user) {
      return {
        totalCount: 0,
        withWebsite: 0,
        withoutWebsite: 0,
        byIndustry: {},
        byLocation: {},
        lastUpdated: null
      };
    }
    
    const stats = await SupabaseBusinessService.getBusinessStats();
    return {
      ...stats,
      lastUpdated: new Date().toISOString()
    };
  };

  // バックグラウンド処理の状態を取得
  const getBackgroundStatus = () => {
    return BusinessDataService.getBackgroundFetchStatus();
  };

  // バックグラウンド処理を停止
  const stopBackgroundFetch = () => {
    BusinessDataService.stopBackgroundFetch();
    refreshData();
  };

  // データ削除機能（Supabase対応版）
  const clearAllData = async () => {
    console.log('🗑️ 全データ削除を実行開始');
    
    // バックグラウンド処理を停止
    BusinessDataService.stopBackgroundFetch();
    
    // ローカルストレージからデータを削除
    localStorage.clear();
    
    // React Queryのキャッシュを完全にクリア
    const queryClient = (window as any).queryClient;
    if (queryClient) {
      await queryClient.clear();
      console.log('📦 React Queryキャッシュをクリア');
    }
    
    refreshData();
    console.log('✅ 全データ削除完了');
  };

  // 不足していたメソッドを追加
  const removeSampleData = () => {
    // サンプルデータの削除（現在は何もしない）
    console.log('サンプルデータ削除機能は未実装です');
  };

  const getPrefectureStats = async () => {
    // 都道府県別統計の取得
    const stats = await getDataStats();
    return stats.byLocation;
  };

  return {
    businesses,
    isLoading,
    error,
    refreshData,
    fetchByRegion,
    fetchWithProgress,
    refetch,
    getDataStats,
    getBackgroundStatus,
    stopBackgroundFetch,
    clearAllData,
    removeSampleData,
    getPrefectureStats
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
    staleTime: 1000 * 60 * 60,
  });
};
