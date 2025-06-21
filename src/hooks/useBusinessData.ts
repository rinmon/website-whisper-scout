
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Business } from '@/types/business';
import { BusinessDataService } from '@/services/businessDataService';
import { DataStorageService } from '@/services/dataStorageService';

export const useBusinessData = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDataCleared, setIsDataCleared] = useState(false);

  // バックグラウンド処理の状態監視
  useEffect(() => {
    const checkBackgroundStatus = () => {
      const bgStatus = BusinessDataService.getBackgroundFetchStatus();
      if (bgStatus.isRunning) {
        // バックグラウンド処理中は定期的にデータを更新
        const interval = setInterval(() => {
          const newStatus = BusinessDataService.getBackgroundFetchStatus();
          if (!newStatus.isRunning) {
            clearInterval(interval);
            // バックグラウンド処理完了時にデータを更新
            refreshData();
          }
        }, 5000);
        
        return () => clearInterval(interval);
      }
    };

    checkBackgroundStatus();
  }, [refreshTrigger]);

  const {
    data: businesses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['businesses', refreshTrigger],
    queryFn: async () => {
      // データがクリアされた直後は空配列を返す
      if (isDataCleared) {
        console.log('🚫 データクリア状態のため空配列を返します');
        return [];
      }

      // 蓄積されたデータを優先的に返す
      const accumulatedData = DataStorageService.getAccumulatedData();
      
      console.log(`🔍 蓄積データ確認: ${accumulatedData.length}社`);
      
      if (accumulatedData.length > 0) {
        console.log(`📋 蓄積データ ${accumulatedData.length}社を返します`);
        // データの内容をログ出力して確認
        accumulatedData.forEach((business, index) => {
          console.log(`${index + 1}. ${business.name} - ${business.website_url || 'URLなし'}`);
        });
        return accumulatedData;
      }
      
      // 蓄積データがない場合は空配列を返す（自動取得を停止）
      console.log('❌ 蓄積データなし、空配列を返します');
      return [];
    },
    staleTime: 0, // キャッシュを無効化
    gcTime: 0, // ガベージコレクションも即座に
  });

  const refreshData = () => {
    console.log('🔄 データリフレッシュを実行');
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchByRegion = async (region: string) => {
    return await BusinessDataService.fetchChamberOfCommerceData(region);
  };

  const fetchByIndustry = async (industry: string) => {
    return await BusinessDataService.fetchIndustryAssociationData(industry);
  };

  // 進捗付きデータ取得用のフック（全国対応版）
  const fetchWithProgress = async (onProgress?: (status: string, current: number, total: number) => void) => {
    const newData = await BusinessDataService.fetchFromOpenSourcesWithProgress(onProgress);
    // データが更新されたので状態をリセット
    setIsDataCleared(false);
    refreshData();
    return newData;
  };

  // データ統計を取得
  const getDataStats = () => {
    return DataStorageService.getDataStats();
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

  // データ削除機能を強化
  const clearAllData = async () => {
    console.log('🗑️ 全データ削除を実行開始');
    
    // 1. バックグラウンド処理を停止
    BusinessDataService.stopBackgroundFetch();
    
    // 2. クリア状態をセット
    setIsDataCleared(true);
    
    // 3. ストレージからデータを削除
    DataStorageService.clearAllData();
    
    // 4. サービス層のデータも削除
    BusinessDataService.clearAllData();
    
    // 5. React Queryのキャッシュを完全にクリア
    const queryClient = (window as any).queryClient;
    if (queryClient) {
      await queryClient.clear();
      console.log('📦 React Queryキャッシュをクリア');
    }
    
    // 6. データリフレッシュ
    refreshData();
    
    console.log('✅ 全データ削除完了');
  };

  // サンプルデータ削除機能を追加
  const removeSampleData = () => {
    BusinessDataService.removeSampleData();
    refreshData();
  };

  const removeBusinessesByCondition = (condition: (business: Business) => boolean) => {
    DataStorageService.removeBusinessesByCondition(condition);
    refreshData();
  };

  return {
    businesses,
    isLoading,
    error,
    refreshData,
    fetchByRegion,
    fetchByIndustry,
    fetchWithProgress,
    refetch,
    getDataStats,
    getBackgroundStatus,
    stopBackgroundFetch,
    clearAllData,
    removeSampleData,
    removeBusinessesByCondition
  };
};

// 特定企業の詳細分析データを取得するフック
export const useBusinessAnalysis = (businessId: number) => {
  return useQuery({
    queryKey: ['business-analysis', businessId],
    queryFn: async () => {
      // 実際の分析APIコール
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
