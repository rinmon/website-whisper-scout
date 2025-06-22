
import { CorporateDataSource } from '@/types/corporateData';

// データソース設定
export const DATA_SOURCES: CorporateDataSource[] = [
  {
    name: '国税庁法人番号公表サイト',
    url: 'https://www.houjin-bangou.nta.go.jp',
    description: '日本の全法人基本情報（法人番号、住所等）',
    type: 'api',
    enabled: true,
    priority: 1,
    maxRecords: 1000
  },
  {
    name: 'FUMA（フーマ）',
    url: 'https://fumadata.com',
    description: '160万社以上の企業情報、ログイン不要',
    type: 'scrape',
    enabled: true,
    priority: 2,
    maxRecords: 500
  },
  {
    name: 'BIZMAPS',
    url: 'https://bizmaps.jp',
    description: '高鮮度な企業データ、地域・業種検索対応',
    type: 'scrape',
    enabled: true,
    priority: 3,
    maxRecords: 300
  },
  {
    name: 'Musubu（ムスブ）',
    url: 'https://musubu.in',
    description: '無料プランで30件までダウンロード可能',
    type: 'api',
    enabled: true,
    priority: 4,
    maxRecords: 30
  },
  {
    name: 'Ullet（ユーレット）',
    url: 'https://www.ullet.com',
    description: '上場企業の決算・財務データ',
    type: 'scrape',
    enabled: true,
    priority: 5,
    maxRecords: 200
  },
  {
    name: 'Yahoo!ファイナンス',
    url: 'https://finance.yahoo.co.jp',
    description: '上場企業の株価・財務諸表',
    type: 'scrape',
    enabled: true,
    priority: 6,
    maxRecords: 100
  }
];

export const getAvailableDataSources = (): CorporateDataSource[] => {
  return DATA_SOURCES.filter(source => source.enabled);
};
