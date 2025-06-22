
// 住所関連のユーティリティ
export class AddressUtils {
  private static readonly PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  // 住所から都道府県を抽出
  static extractPrefecture(address: string): string {
    for (const prefecture of this.PREFECTURES) {
      if (address.includes(prefecture)) {
        return prefecture;
      }
    }
    return '不明';
  }

  // 都道府県リストを取得
  static getAllPrefectures(): string[] {
    return [...this.PREFECTURES];
  }

  // 住所の正規化
  static normalizeAddress(address: string): string {
    return address
      .replace(/\s+/g, '') // 空白を除去
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)) // 全角数字を半角に
      .trim();
  }
}
