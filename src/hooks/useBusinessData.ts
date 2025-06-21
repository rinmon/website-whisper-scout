
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Business } from '@/types/business';
import { BusinessDataService } from '@/services/businessDataService';
import { DataStorageService } from '@/services/dataStorageService';

export const useBusinessData = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    data: businesses = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['businesses', refreshTrigger],
    queryFn: async () => {
      // 蓄積されたデータを優先的に返す
      const accumulatedData = DataStorageService.getAccumulatedData();
      
      if (accumulatedData.length > 0) {
        console.log(`蓄積データ ${accumulatedData.length}社を返します`);
        return accumulatedData;
      }
      
      // 蓄積データがない場合のみ新規取得
      console.log('蓄積データなし、新規取得を開始');
      return await BusinessDataService.fetchFromOpenSourcesWithProgress();
    },
    staleTime: 1000 * 60 * 10, // 10分間キャッシュ
    gcTime: 1000 * 60 * 30, // 30分間ガベージコレクション
  });

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const fetchByRegion = async (region: string) => {
    return await BusinessDataService.fetchChamberOfCommerceData(region);
  };

  const fetchByIndustry = async (industry: string) => {
    return await BusinessDataService.fetchIndustryAssociationData(industry);
  };

  // 進捗付きデータ取得用のフック
  const fetchWithProgress = async (onProgress?: (status: string, current: number, total: number) => void) => {
    const newData = await BusinessDataService.fetchFromOpenSourcesWithProgress(onProgress);
    // データが更新されたのでリフレッシュ
    refreshData();
    return newData;
  };

  // データ統計を取得
  const getDataStats = () => {
    return DataStorageService.getDataStats();
  };

  // データ削除機能
  const clearAllData = () => {
    BusinessDataService.clearAllData();
    refreshData();
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
    clearAllData,
    removeSampleData, // 新しく追加
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
