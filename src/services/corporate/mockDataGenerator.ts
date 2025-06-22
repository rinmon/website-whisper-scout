
import { CorporateInfo } from '@/types/corporateData';

// モックデータ生成ユーティリティ
export class MockDataGenerator {
  private static readonly COMPANY_TYPES = ['株式会社', '有限会社', '合同会社'];
  private static readonly COMPANY_NAMES = ['アルファ', 'ベータ', 'ガンマ', 'デルタ', 'イプシロン', 'ゼータ', 'エータ', 'シータ'];
  private static readonly COMPANY_SUFFIXES = ['商事', '工業', 'システム', 'サービス', '商会', '産業', '技研', 'エンジニアリング'];
  private static readonly PREFECTURES = ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県', '北海道', '宮城県', '埼玉県', '千葉県', '兵庫県'];
  private static readonly INDUSTRIES = ['製造業', 'IT・通信', '建設業', '小売業', 'サービス業', '運輸業', '不動産業', '金融業'];
  private static readonly AREAS = ['中央区', '港区', '新宿区', '渋谷区', '品川区', '大田区', '世田谷区'];
  private static readonly CAPITAL_AMOUNTS = ['1000万円', '5000万円', '1億円', '5億円', '10億円', '100億円'];
  private static readonly EMPLOYEE_RANGES = ['1-10人', '11-50人', '51-100人', '101-300人', '301-1000人', '1000人以上'];
  private static readonly REAL_COMPANY_NAMES = [
    'トヨタ自動車', 'ソニーグループ', 'ソフトバンクグループ', '三菱商事', '三井物産',
    'NTTドコモ', 'KDDI', '日本電信電話', 'JR東日本', 'ANA Holdings',
    'みずほフィナンシャルグループ', '三菱UFJフィナンシャル・グループ', '三井住友フィナンシャルグループ',
    'セブン&アイ・ホールディングス', 'イオン', 'ファーストリテイリング', '楽天グループ',
    'キーエンス', 'ダイキン工業', 'ファナック', 'SMC', '日立製作所',
    'パナソニック ホールディングス', '東芝', '富士通', 'NEC', 'キヤノン'
  ];

  static generateCompanyName(): string {
    const prefix = this.getRandomElement(this.COMPANY_TYPES);
    const name = this.getRandomElement(this.COMPANY_NAMES);
    const suffix = this.getRandomElement(this.COMPANY_SUFFIXES);
    return `${prefix}${name}${suffix}`;
  }

  static generateRealCompanyName(index: number): string {
    const baseName = this.getRandomElement(this.REAL_COMPANY_NAMES);
    const variation = this.getRandomElement(this.COMPANY_TYPES);
    return index === 0 ? baseName : `${baseName} ${variation} ${index}号店`;
  }

  static generatePrefecture(): string {
    return this.getRandomElement(this.PREFECTURES);
  }

  static generateIndustry(): string {
    return this.getRandomElement(this.INDUSTRIES);
  }

  static generateAddress(): string {
    const area = this.getRandomElement(this.AREAS);
    const block = Math.floor(Math.random() * 9) + 1;
    const building = Math.floor(Math.random() * 20) + 1;
    const room = Math.floor(Math.random() * 20) + 1;
    return `${area}${block}-${building}-${room}`;
  }

  static generateFullAddress(): string {
    return `${this.generatePrefecture()}${this.generateAddress()}`;
  }

  static generateCapital(): string {
    return this.getRandomElement(this.CAPITAL_AMOUNTS);
  }

  static generateEmployees(): string {
    return this.getRandomElement(this.EMPLOYEE_RANGES);
  }

  static generateEstablishedDate(): string {
    const year = Math.floor(Math.random() * 50) + 1974; // 1974-2024
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  static generateDomain(): string {
    const companies = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
    const tlds = ['co.jp', 'com', 'jp', 'net'];
    const company = this.getRandomElement(companies);
    const tld = this.getRandomElement(tlds);
    return `${company}.${tld}`;
  }

  static generatePhone(): string {
    const area = Math.floor(Math.random() * 9) + 1;
    const exchange = Math.floor(Math.random() * 9000) + 1000;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `0${area}-${exchange}-${number}`;
  }

  static generateCorporateNumber(): string {
    return `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`;
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static generateMockData(sourceName: string, count: number, prefecture?: string, industry?: string): CorporateInfo[] {
    const data: CorporateInfo[] = [];
    
    for (let i = 0; i < count; i++) {
      data.push({
        source: sourceName,
        corporateNumber: this.generateCorporateNumber(),
        name: sourceName.includes('FUMA') ? this.generateRealCompanyName(i) : this.generateCompanyName(),
        address: prefecture ? `${prefecture}${this.generateAddress()}` : this.generateFullAddress(),
        prefecture: prefecture || this.generatePrefecture(),
        industry: industry || this.generateIndustry(),
        capital: this.generateCapital(),
        employees: this.generateEmployees(),
        website: Math.random() > 0.3 ? `https://${this.generateDomain()}` : undefined,
        phone: this.generatePhone(),
        establishedDate: this.generateEstablishedDate(),
        isListed: Math.random() > 0.9
      });
    }
    
    return data;
  }
}
