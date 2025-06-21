
// e-Stat API v3.0を使用した政府統計データ取得サービス
export interface EStatApiConfig {
  appId: string;
  baseUrl: string;
}

export interface EStatDataset {
  statsDataId: string;
  title: string;
  description: string;
  lastUpdate: string;
}

export interface EStatApiResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG?: string;
    };
    STATISTICAL_DATA: {
      TABLE_INF: {
        TITLE: string;
      };
      DATA_INF: {
        VALUE: Array<{
          '@unit': string;
          '@tab': string;
          '$': string;
        }>;
      };
    };
  };
}

export class EStatApiService {
  private static readonly BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json';
  private static readonly DATASETS = {
    // 経済センサス-基礎調査 企業等に関する集計
    ECONOMIC_CENSUS_BASIC: '0003348423',
    // 経済センサス-活動調査 事業所・企業統計調査
    ECONOMIC_CENSUS_ACTIVITY: '0003348424',
    // 法人企業統計調査
    CORPORATE_STATISTICS: '0003348425'
  };

  // e-Stat APIキーの設定状況を確認
  static isConfigured(): boolean {
    const appId = localStorage.getItem('estat_app_id');
    return !!appId && appId.length > 0;
  }

  // APIキーを設定
  static setAppId(appId: string): void {
    localStorage.setItem('estat_app_id', appId);
    console.log('✅ e-Stat APIキーを設定しました');
  }

  // APIキーを取得
  private static getAppId(): string | null {
    return localStorage.getItem('estat_app_id');
  }

  // 利用可能なデータセット一覧を取得
  static async getAvailableDatasets(): Promise<EStatDataset[]> {
    const appId = this.getAppId();
    if (!appId) {
      throw new Error('e-Stat APIキーが設定されていません');
    }

    try {
      const url = `${this.BASE_URL}/getStatsList`;
      const params = new URLSearchParams({
        appId,
        lang: 'J',
        surveyYears: '2021',
        openYears: '2021',
        statsField: '02', // 企業・家計・経済
        searchKind: '1'
      });

      console.log(`📡 e-Stat データセット一覧取得: ${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`e-Stat API エラー: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.GET_STATS_LIST?.RESULT?.STATUS !== 0) {
        throw new Error(`e-Stat API エラー: ${data.GET_STATS_LIST?.RESULT?.ERROR_MSG || '不明なエラー'}`);
      }

      // データセット情報を整形
      const datasets: EStatDataset[] = [];
      const statsList = data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
      
      statsList.forEach((table: any) => {
        if (table['@id'] && table.TITLE && table.TITLE['$']) {
          datasets.push({
            statsDataId: table['@id'],
            title: table.TITLE['$'],
            description: table.DESCRIPTION?.['$'] || '',
            lastUpdate: table.LAST_UPDATE_DATE?.['$'] || ''
          });
        }
      });

      console.log(`✅ e-Stat データセット取得完了: ${datasets.length}件`);
      return datasets;

    } catch (error) {
      console.error('❌ e-Stat データセット取得エラー:', error);
      throw error;
    }
  }

  // 統計データから企業情報を取得
  static async fetchCorporateData(datasetId?: string): Promise<any[]> {
    const appId = this.getAppId();
    if (!appId) {
      throw new Error('e-Stat APIキーが設定されていません');
    }

    const targetDataset = datasetId || this.DATASETS.ECONOMIC_CENSUS_BASIC;
    
    try {
      const url = `${this.BASE_URL}/getStatsData`;
      const params = new URLSearchParams({
        appId,
        lang: 'J',
        statsDataId: targetDataset,
        metaGetFlg: 'Y',
        cntGetFlg: 'N',
        explanationGetFlg: 'Y',
        annotationGetFlg: 'Y',
        sectionHeaderFlg: '1',
        replaceSpChars: '0'
      });

      console.log(`📡 e-Stat 企業データ取得: ${url}?${params}`);
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`e-Stat API エラー: ${response.status}`);
      }

      const data: EStatApiResponse = await response.json();
      
      if (data.GET_STATS_DATA?.RESULT?.STATUS !== 0) {
        throw new Error(`e-Stat API エラー: ${data.GET_STATS_DATA?.RESULT?.ERROR_MSG || '不明なエラー'}`);
      }

      // 統計データを企業情報形式に変換
      const corporateData = this.parseStatisticalData(data);
      
      console.log(`✅ e-Stat 企業データ変換完了: ${corporateData.length}件`);
      return corporateData;

    } catch (error) {
      console.error('❌ e-Stat 企業データ取得エラー:', error);
      throw error;
    }
  }

  // 統計データを企業情報に変換
  private static parseStatisticalData(data: EStatApiResponse): any[] {
    try {
      const statisticalData = data.GET_STATS_DATA?.STATISTICAL_DATA;
      if (!statisticalData) {
        return [];
      }

      const title = statisticalData.TABLE_INF?.TITLE || 'e-Stat統計データ';
      const values = statisticalData.DATA_INF?.VALUE || [];
      
      console.log(`📊 統計データ解析: ${title} - ${values.length}件の値`);

      // 統計値から企業規模や業界情報を推定
      const corporateInfo: any[] = [];
      
      // サンプルとして、統計データから企業情報を生成
      values.slice(0, 50).forEach((value, index) => {
        const numericValue = parseFloat(value['$'] || '0');
        if (numericValue > 0) {
          corporateInfo.push({
            source: 'e-Stat',
            category: value['@tab'] || '企業統計',
            value: numericValue,
            unit: value['@unit'] || '',
            datasetTitle: title,
            index
          });
        }
      });

      return corporateInfo;

    } catch (error) {
      console.error('❌ 統計データ解析エラー:', error);
      return [];
    }
  }

  // APIキーのテスト
  static async testApiKey(appId: string): Promise<boolean> {
    try {
      const url = `${this.BASE_URL}/getStatsList`;
      const params = new URLSearchParams({
        appId,
        lang: 'J',
        limit: '1'
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      const isValid = data.GET_STATS_LIST?.RESULT?.STATUS === 0;
      
      if (isValid) {
        console.log('✅ e-Stat APIキーテスト成功');
      } else {
        console.log('❌ e-Stat APIキーテスト失敗:', data.GET_STATS_LIST?.RESULT?.ERROR_MSG);
      }
      
      return isValid;

    } catch (error) {
      console.error('❌ e-Stat APIキーテストエラー:', error);
      return false;
    }
  }

  // e-Stat API利用規約とガイドラインの情報
  static getUsageGuidelines(): string {
    return `
e-Stat API利用ガイドライン:
1. アプリケーションIDの登録が必要（無料）
2. リクエスト制限: 10万件/日
3. 利用規約の遵守が必要
4. 商用利用可能（適切な利用範囲内）
5. データの再配布は制限あり

登録URL: https://www.e-stat.go.jp/api/api-info/api-guide
    `.trim();
  }
}
