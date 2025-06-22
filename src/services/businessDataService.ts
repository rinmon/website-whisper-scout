
import { Business } from '@/types/business';
import { CorporateDataService, CorporateInfo } from './corporateDataService';

export type ProgressCallback = (status: string, current: number, total: number) => void;

export class BusinessDataService {
  private static backgroundFetchStatus: { isRunning: boolean; progress: number; status: string } = {
    isRunning: false,
    progress: 0,
    status: ''
  };

  // バックグラウンド処理の状態を取得
  static getBackgroundFetchStatus() {
    return this.backgroundFetchStatus;
  }

  // バックグラウンド処理を開始
  static startBackgroundFetch() {
    this.backgroundFetchStatus = { isRunning: true, progress: 0, status: '初期化中...' };
  }

  // バックグラウンド処理を停止
  static stopBackgroundFetch() {
    this.backgroundFetchStatus = { isRunning: false, progress: 0, status: '停止しました' };
  }

  // 商工会議所データを取得（地域指定）
  static async fetchChamberOfCommerceData(region: string): Promise<Business[]> {
    console.log(`🚀 商工会議所データ取得開始: ${region}`);
    
    // ここに実際のデータ取得ロジックを実装
    // APIリクエスト、スクレイピングなど
    
    // ダミーデータを生成して返す
    const dummyData = Array.from({ length: 20 }, (_, i) => ({
      id: `chamber-${Date.now()}-${i}`, // 文字列IDに変更
      name: `サンプル企業 ${i + 1} (${region})`,
      website_url: 'https://example.com',
      has_website: true,
      location: region,
      industry: 'サービス業',
      phone: '03-1234-5678',
      address: '東京都港区',
      data_source: '商工会議所',
      overall_score: Math.random() * 5,
      technical_score: Math.random() * 5,
      eeat_score: Math.random() * 5,
      content_score: Math.random() * 5,
      ai_content_score: Math.random() * 5,
      is_new: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log(`✅ 商工会議所データ取得完了: ${dummyData.length}件`);
    return dummyData;
  }

  // GitHub Organization APIからデータを取得
  static async fetchGitHubOrganizationData(orgName: string): Promise<Business[]> {
    console.log(`🚀 GitHub Organizationデータ取得開始: ${orgName}`);
    
    try {
      const response = await fetch(`https://api.github.com/orgs/${orgName}`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      
      // 必要な情報をBusinessオブジェクトに変換
      const business: Business = {
        id: `github-${data.id}`, // GitHub IDを文字列に変換
        name: data.name || data.login,
        website_url: data.blog || data.url,
        has_website: !!data.blog,
        location: data.location || '不明',
        industry: 'ソフトウェア',
        phone: '不明',
        address: data.location || '不明',
        data_source: 'github',
        overall_score: Math.random() * 5,
        technical_score: Math.random() * 5,
        eeat_score: Math.random() * 5,
        content_score: Math.random() * 5,
        ai_content_score: Math.random() * 5,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`✅ GitHub Organizationデータ取得完了: ${business.name}`);
      return [business];
      
    } catch (error) {
      console.error('❌ GitHub Organizationデータ取得エラー:', error);
      return [];
    }
  }

  // GitHub Organizations Search APIから組織一覧を取得
  static async searchGitHubOrganizations(searchTerm: string): Promise<Business[]> {
    console.log(`🚀 GitHub Organizations検索開始: ${searchTerm}`);
    
    try {
      const response = await fetch(`https://api.github.com/search/users?q=${searchTerm}+type:org`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        console.warn('GitHub API: No items found or invalid format.');
        return [];
      }
      
      // 検索結果をBusinessオブジェクトに変換
      const businesses: Business[] = data.items.map((item: any, index: number) => ({
        id: `github-search-${item.id}`, // GitHub IDを文字列に変換
        name: item.login,
        website_url: item.html_url,
        has_website: true,
        location: 'GitHub組織検索',
        industry: 'ソフトウェア',
        phone: '不明',
        address: '不明',
        data_source: 'github_search',
        overall_score: Math.random() * 5,
        technical_score: Math.random() * 5,
        eeat_score: Math.random() * 5,
        content_score: Math.random() * 5,
        ai_content_score: Math.random() * 5,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      console.log(`✅ GitHub Organizations検索完了: ${businesses.length}件`);
      return businesses;
      
    } catch (error) {
      console.error('❌ GitHub Organizations検索エラー:', error);
      return [];
    }
  }

  static async fetchFromOpenSourcesWithProgress(
    onProgress?: ProgressCallback
  ): Promise<Business[]> {
    console.log('🚀 オープンソース企業データ取得を開始...');
    
    const allBusinesses: Business[] = [];
    let currentStep = 0;
    const totalSteps = 3;

    try {
      // 1. 企業データソースから取得
      onProgress?.('企業データを取得中...', currentStep++, totalSteps);
      const corporateData = await CorporateDataService.fetchFromAllSources(onProgress);
      
      // 企業データをBusinessオブジェクトに変換
      const corporateBusinesses = corporateData.map((corp, index) => ({
        id: `corporate-${Date.now()}-${index}`, // 一意な文字列IDを生成
        name: corp.name,
        website_url: corp.website || '',
        has_website: !!corp.website,
        location: corp.prefecture || '不明',
        industry: corp.industry || '不明',
        phone: corp.phone || '',
        address: corp.address || '',
        data_source: corp.source,
        overall_score: corp.website ? Math.random() * 5 : 0,
        technical_score: Math.random() * 5,
        eeat_score: Math.random() * 5,
        content_score: Math.random() * 5,
        ai_content_score: Math.random() * 5,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      allBusinesses.push(...corporateBusinesses);

      // 2. 商工会議所データを取得（全国）
      onProgress?.('商工会議所データを取得中...', currentStep++, totalSteps);
      const regions = ['東京都', '大阪府', '愛知県', '福岡県'];
      for (const region of regions) {
        const chamberData = await BusinessDataService.fetchChamberOfCommerceData(region);
        allBusinesses.push(...chamberData);
      }

      // 3. GitHub Organizationデータを取得
      onProgress?.('GitHub Organizationデータを取得中...', currentStep++, totalSteps);
      const githubOrgs = ['github', 'google', 'microsoft'];
      for (const orgName of githubOrgs) {
        const githubData = await BusinessDataService.fetchGitHubOrganizationData(orgName);
        allBusinesses.push(...githubData);
      }

      console.log(`✅ 全データ取得完了: ${allBusinesses.length}社`);
      
      // データストレージに蓄積
      const { DataStorageService } = await import('./dataStorageService');
      DataStorageService.addBusinessData(allBusinesses);
      
      return allBusinesses;
      
    } catch (error) {
      console.error('❌ データ取得エラー:', error);
      throw error;
    }
  }

  // 蓄積データを削除
  static clearAllData() {
    console.warn('⚠️ 蓄積された企業データを全て削除します');
    // 実際のデータ削除ロジックはDataStorageServiceに実装
  }
}
