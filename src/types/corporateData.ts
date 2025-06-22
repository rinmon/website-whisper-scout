
// 企業データ関連の型定義
export interface CorporateDataSource {
  name: string;
  url: string;
  description: string;
  type: 'api' | 'scrape' | 'csv';
  enabled: boolean;
  priority: number;
  maxRecords: number;
}

export interface CorporateInfo {
  source: string;
  corporateNumber?: string;
  name: string;
  address?: string;
  prefecture?: string;
  industry?: string;
  capital?: string;
  employees?: string;
  website?: string;
  phone?: string;
  establishedDate?: string;
  isListed?: boolean;
}
