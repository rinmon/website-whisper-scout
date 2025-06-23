
import { CorporateInfo } from '@/types/corporateData';

// 国税庁法人番号公表サイト特化のデータ取得サービス
export class NtaService {
  private static readonly API_BASE_URL = 'https://www.houjin-bangou.nta.go.jp/webapi/sync';
  
  static async fetchFromNTA(prefecture?: string): Promise<CorporateInfo[]> {
    console.log(`📡 国税庁法人番号公表サイトから企業情報取得開始: ${prefecture || '全国'}`);
    
    try {
      // 国税庁法人番号公表サイトのWeb-API仕様に基づく実装
      const searchParams = new URLSearchParams({
        id: '1', // 検索ID
        number: '', // 法人番号（空の場合は全検索）
        type: '12', // CSV形式
        history: '0', // 履歴情報なし
        ...(prefecture && { address: prefecture })
      });

      const apiUrl = `${this.API_BASE_URL}?${searchParams.toString()}`;
      console.log(`🔍 国税庁API呼び出し: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/csv, application/json',
          'Accept-Language': 'ja'
        }
      });

      if (!response.ok) {
        console.warn(`⚠️ 国税庁API応答エラー: ${response.status}`);
        throw new Error(`NTA API error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log(`📊 国税庁API応答:`, responseText.substring(0, 200) + '...');

      // CSVデータを解析して企業情報に変換
      const lines = responseText.split('\n').filter(line => line.trim());
      const corporateData: CorporateInfo[] = [];

      // CSVヘッダーを除いて処理
      for (let i = 1; i < lines.length && corporateData.length < 100; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 8) {
          corporateData.push({
            source: '国税庁法人番号公表サイト',
            name: columns[2] || '不明', // 商号又は名称
            address: columns[7] || '', // 本店又は主たる事務所の所在地
            prefecture: this.extractPrefecture(columns[7] || ''),
            industry: '不明', // 国税庁データには業種情報なし
            capital: '',
            employees: '',
            website: '',
            phone: '',
            establishedDate: '',
            isListed: false
          });
        }
      }

      console.log(`✅ 国税庁データ取得完了: ${corporateData.length}社`);
      return corporateData;

    } catch (error) {
      console.error(`❌ 国税庁データ取得エラー:`, error);
      // エラーの場合は空配列を返す
      return [];
    }
  }

  private static extractPrefecture(address: string): string {
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];

    for (const prefecture of prefectures) {
      if (address.includes(prefecture)) {
        return prefecture;
      }
    }
    return '不明';
  }
}
