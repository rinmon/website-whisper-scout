
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Edge Function 開始');
    const { dataSourceGroup, prefecture = '東京都' } = await req.json();
    
    console.log(`🔄 スクレイピング開始: ${dataSourceGroup}, ${prefecture}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const scrapedBusinesses: any[] = [];

    try {
      if (dataSourceGroup === 'scraping' || dataSourceGroup === 'all') {
        // 食べログのスクレイピング
        console.log('📡 食べログからデータ取得中...');
        try {
          const tabelogData = await scrapeTabelogData(prefecture);
          scrapedBusinesses.push(...tabelogData);
          console.log(`✅ 食べログから${tabelogData.length}件取得`);
        } catch (error) {
          console.error('❌ 食べログエラー:', error);
        }

        // えきてんのスクレイピング
        console.log('📡 えきてんからデータ取得中...');
        try {
          const ekitenData = await scrapeEkitenData(prefecture);
          scrapedBusinesses.push(...ekitenData);
          console.log(`✅ えきてんから${ekitenData.length}件取得`);
        } catch (error) {
          console.error('❌ えきてんエラー:', error);
        }

        // まいぷれのスクレイピング
        console.log('📡 まいぷれからデータ取得中...');
        try {
          const maipreData = await scrapeMaipreData(prefecture);
          scrapedBusinesses.push(...maipreData);
          console.log(`✅ まいぷれから${maipreData.length}件取得`);
        } catch (error) {
          console.error('❌ まいぷれエラー:', error);
        }
      }

      // 国税庁APIデータ取得
      if (dataSourceGroup === 'nta' || dataSourceGroup === 'all' || dataSourceGroup === 'priority') {
        console.log('📡 国税庁法人番号公表サイトからデータ取得中...');
        try {
          const ntaData = await fetchNTAData(prefecture);
          scrapedBusinesses.push(...ntaData);
          console.log(`✅ 国税庁から${ntaData.length}件取得`);
        } catch (error) {
          console.error('❌ 国税庁エラー:', error);
        }
      }

      // FUMAデータ取得
      if (dataSourceGroup === 'fuma' || dataSourceGroup === 'all') {
        console.log('📡 FUMA（フーマ）からデータ取得中...');
        try {
          const fumaData = await fetchFUMAData();
          scrapedBusinesses.push(...fumaData);
          console.log(`✅ FUMAから${fumaData.length}件取得`);
        } catch (error) {
          console.error('❌ FUMAエラー:', error);
        }
      }

      // 企業データをデータベースに保存
      if (scrapedBusinesses.length > 0) {
        console.log(`💾 ${scrapedBusinesses.length}件のデータをデータベースに保存中...`);
        
        const { data: savedBusinesses, error } = await supabase
          .from('businesses')
          .upsert(scrapedBusinesses, { 
            onConflict: 'name,location',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error('❌ データベース保存エラー:', error);
          throw error;
        }

        console.log(`✅ ${savedBusinesses?.length || 0}件のデータを保存完了`);
        
        return new Response(JSON.stringify({
          success: true,
          totalSaved: savedBusinesses?.length || 0,
          message: `${savedBusinesses?.length || 0}件の企業データを保存しました`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('⚠️ 取得できるデータはありませんでした');
      return new Response(JSON.stringify({
        success: true,
        totalSaved: 0,
        message: '取得できるデータはありませんでした'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (dataError) {
      console.error('❌ データ取得エラー:', dataError);
      return new Response(JSON.stringify({
        success: false,
        error: dataError.message,
        message: 'データ取得中にエラーが発生しました'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Edge Function エラー:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Edge Function でエラーが発生しました'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// スクレイピングサービスクラス（安全なスクレイピング機能）
class SafeScrapingService {
  private static lastRequestTime = 0;
  private static pageCache = new Map<string, { content: string; timestamp: number }>();
  
  static async fetchPageSafely(url: string, config: any = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = config.requestDelay || 8000;
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`⏳ レート制限: ${waitTime}ms 待機`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // キャッシュチェック（1時間有効）
    const cached = this.pageCache.get(url);
    if (cached && (now - cached.timestamp) < 3600000) {
      console.log(`💾 キャッシュから取得: ${url}`);
      return cached.content;
    }
    
    const maxRetries = config.maxRetries || 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 取得試行 ${attempt}/${maxRetries}: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
          },
          signal: AbortSignal.timeout(config.timeout || 30000)
        });
        
        if (response.ok) {
          const content = await response.text();
          this.pageCache.set(url, { content, timestamp: now });
          this.lastRequestTime = Date.now();
          return content;
        }
        
        if (response.status === 429 || response.status === 503) {
          const waitTime = Math.pow(2, attempt) * (config.retryDelay || 5000);
          console.log(`⏳ レート制限検出。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * (config.retryDelay || 5000);
          console.log(`⏳ ${waitTime}ms 待機後に再試行...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError;
  }
}

async function scrapeTabelogData(prefecture: string) {
  try {
    const prefectureMap: Record<string, string> = {
      '東京都': 'tokyo', '大阪府': 'osaka', '愛知県': 'aichi',
      '神奈川県': 'kanagawa', '福岡県': 'fukuoka', '北海道': 'hokkaido',
      '京都府': 'kyoto', '兵庫県': 'hyogo', '埼玉県': 'saitama', '千葉県': 'chiba'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    const url = `https://tabelog.com/${prefCode}/`;
    
    console.log(`🍽️ 食べログスクレイピング開始: ${url}`);
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    const config = {
      maxRetries: 3,
      retryDelay: 5000,
      requestDelay: 8000, // 8秒間隔
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 30000
    };

    const html = await SafeScrapingService.fetchPageSafely(url, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ 食べログ: 取得したHTMLが短すぎます');
      return [];
    }

    const businesses = [];
    const patterns = [
      /<h3[^>]*class="[^"]*list-rst__name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="[^"]*list-rst__rst-name-target[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<div[^>]*class="[^"]*list-rst__header[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*href="(\/[^"]*\/[^"]*\/\d+\/)"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 20) {
        const [, url, name] = match;
        const cleanName = name.trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&');
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          businesses.push({
            name: cleanName,
            website_url: url?.startsWith('http') ? url : `https://tabelog.com${url}`,
            has_website: !!url,
            location: prefecture,
            industry: '飲食業',
            phone: '',
            address: prefecture,
            data_source: '食べログ',
            is_new: true
          });
        }
      }
      if (businesses.length >= 20) break;
    }
    
    console.log(`✅ 食べログから${businesses.length}件取得`);
    return businesses;
    
  } catch (error) {
    console.error('❌ 食べログスクレイピングエラー:', error);
    return [];
  }
}

async function scrapeEkitenData(prefecture: string) {
  try {
    const prefectureMap: Record<string, string> = {
      '東京都': 'tokyo', '大阪府': 'osaka', '愛知県': 'aichi',
      '神奈川県': 'kanagawa', '福岡県': 'fukuoka', '北海道': 'hokkaido'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    const url = `https://www.ekiten.jp/${prefCode}/`;
    
    console.log(`🏪 えきてんスクレイピング開始: ${url}`);
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    
    const config = {
      maxRetries: 3,
      retryDelay: 8000,
      requestDelay: 12000, // 12秒間隔（えきてんは厳格）
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 35000
    };

    const html = await SafeScrapingService.fetchPageSafely(url, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ えきてん: 取得したHTMLが短すぎます');
      return [];
    }

    const businesses = [];
    const patterns = [
      /<h3[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<div[^>]*class="[^"]*shop-item[^"]*"[^>]*>[\s\S]*?<h[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="[^"]*shop-link[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 15) {
        const [, url, name] = match;
        const cleanName = name.trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&');
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          businesses.push({
            name: cleanName,
            website_url: url?.startsWith('http') ? url : `https://www.ekiten.jp${url}`,
            has_website: !!url,
            location: prefecture,
            industry: '地域サービス',
            phone: '',
            address: prefecture,
            data_source: 'えきてん',
            is_new: true
          });
        }
      }
      if (businesses.length >= 15) break;
    }
    
    console.log(`✅ えきてんから${businesses.length}件取得`);
    return businesses;
    
  } catch (error) {
    console.error('えきてんスクレイピングエラー:', error);
    return [];
  }
}

async function scrapeMaipreData(prefecture: string) {
  try {
    const searchUrl = `https://www.maipre.jp/search/?keyword=&pref=${encodeURIComponent(prefecture)}`;
    console.log(`🏢 まいぷれスクレイピング開始: ${searchUrl}`);
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    const config = {
      maxRetries: 2, // 試行回数を減らす
      retryDelay: 12000, // 12秒間隔
      requestDelay: 15000, // 15秒間隔（最も長い間隔）
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 40000
    };

    const html = await SafeScrapingService.fetchPageSafely(searchUrl, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ まいぷれ: 取得したHTMLが短すぎます');
      return [];
    }
    
    // 多様なパターンマッチング
    const businesses = [];
    const patterns = [
      /<h3[^>]*class="[^"]*shop-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
      /<div[^>]*class="[^"]*shop-info[^"]*"[^>]*>[\s\S]*?<h[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="[^"]*store-name[^"]*"[^>]*>([^<]+)<\/a>/g,
      /<span[^>]*class="[^"]*store-name[^"]*"[^>]*>([^<]+)<\/span>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 10) {
        const name = match[1].trim().replace(/\s+/g, ' ');
        if (name && name.length > 1 && !businesses.some(b => b.name === name)) {
          businesses.push({
            name: name,
            website_url: '',
            has_website: false,
            location: prefecture,
            industry: '地域企業',
            phone: '',
            address: prefecture,
            data_source: 'まいぷれ',
            is_new: true
          });
        }
      }
      if (businesses.length >= 10) break;
    }
    
    console.log(`✅ まいぷれから${businesses.length}件取得`);
    return businesses;
    
  } catch (error) {
    console.error('まいぷれスクレイピングエラー:', error);
    return [];
  }
}

async function fetchNTAData(prefecture?: string) {
  try {
    console.log('🔍 国税庁法人番号公表サイト API呼び出し');
    
    // 国税庁法人番号公表サイトのWeb-API
    const searchParams = new URLSearchParams({
      id: '1',
      number: '',
      type: '12',
      history: '0',
      ...(prefecture && { address: prefecture })
    });

    const apiUrl = `https://www.houjin-bangou.nta.go.jp/webapi/sync?${searchParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv, application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ 国税庁API応答エラー: ${response.status}`);
      return [];
    }

    const responseText = await response.text();
    const lines = responseText.split('\n').filter(line => line.trim());
    const businesses = [];

    // CSVヘッダーを除いて処理（最大50件）
    for (let i = 1; i < Math.min(lines.length, 51); i++) {
      const columns = lines[i].split(',');
      if (columns.length >= 8) {
        businesses.push({
          name: columns[2] || '不明',
          website_url: '',
          has_website: false,
          location: extractPrefecture(columns[7] || ''),
          industry: '不明',
          phone: '',
          address: columns[7] || '',
          data_source: '国税庁法人番号公表サイト',
          is_new: true
        });
      }
    }

    console.log(`✅ 国税庁から${businesses.length}件取得`);
    return businesses;
    
  } catch (error) {
    console.error('国税庁データ取得エラー:', error);
    return [];
  }
}

async function fetchFUMAData() {
  try {
    console.log('🔍 FUMA（フーマ）API呼び出し');
    
    const searchUrl = 'https://fumadata.com/api/search';
    const searchParams = new URLSearchParams({
      limit: '30'
    });

    const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ FUMA API応答エラー: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const companies = data.companies || data.results || data.data || [];
    
    const businesses = companies.map((company: any) => ({
      name: company.name || company.company_name || '不明',
      website_url: company.website || company.homepage || '',
      has_website: !!(company.website || company.homepage),
      location: extractPrefecture(company.address || ''),
      industry: company.industry || '不明',
      phone: company.phone || '',
      address: company.address || '',
      data_source: 'FUMA（フーマ）',
      is_new: true
    }));

    console.log(`✅ FUMAから${businesses.length}件取得`);
    return businesses;
    
  } catch (error) {
    console.error('FUMAデータ取得エラー:', error);
    return [];
  }
}

function extractPrefecture(address: string): string {
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
