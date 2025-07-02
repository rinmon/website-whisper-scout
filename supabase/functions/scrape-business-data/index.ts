
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
    console.log('🔄 Edge Function 開始 - 実データスクレイピング');
    const { source, prefecture = '東京都', limit = 25 } = await req.json();
    
    console.log(`🔄 スクレイピング開始: ${source} (${prefecture})`);
    
    const allBusinesses: any[] = [];
    
    if (source === 'tabelog' || source === 'all') {
      console.log('🍽️ 食べログスクレイピング実行中...');
      const tabelogData = await scrapeTabelogData(prefecture);
      allBusinesses.push(...tabelogData);
    }
    
    if (source === 'ekiten' || source === 'all') {
      console.log('🏪 えきてんスクレイピング実行中...');
      const ekitenData = await scrapeEkitenData(prefecture);
      allBusinesses.push(...ekitenData);
    }
    
    if (source === 'maipre' || source === 'all') {
      console.log('🏢 まいぷれスクレイピング実行中...');
      const maipreData = await scrapeMaipreData(prefecture);
      allBusinesses.push(...maipreData);
    }

    const limitedBusinesses = allBusinesses.slice(0, limit);
    console.log(`✅ ${limitedBusinesses.length}件の実データを取得完了`);
    
    return new Response(JSON.stringify({
      success: true,
      businesses: limitedBusinesses,
      message: `${limitedBusinesses.length}件の企業データを取得しました（実データ）`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
    const minDelay = config.requestDelay || 5000;
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`⏳ レート制限: ${waitTime}ms 待機`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // キャッシュチェック（30分有効）
    const cached = this.pageCache.get(url);
    if (cached && (now - cached.timestamp) < 1800000) {
      console.log(`💾 キャッシュから取得: ${url}`);
      return cached.content;
    }
    
    const maxRetries = config.maxRetries || 2;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 取得試行 ${attempt}/${maxRetries}: ${url}`);
        
        // より自然なブラウザリクエストを模倣
        const headers = {
          'User-Agent': config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        };
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(config.timeout || 25000)
        });
        
        this.lastRequestTime = Date.now();
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 3000;
          console.log(`🚫 レート制限検出。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (response.status === 503 || response.status === 502) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.log(`⚠️ サーバーエラー ${response.status}。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        
        // 基本的な検証
        if (content.length < 500) {
          console.warn(`⚠️ レスポンスが短すぎます: ${content.length}文字`);
          if (attempt < maxRetries) continue;
        }
        
        // キャッシュに保存
        this.pageCache.set(url, { content, timestamp: now });
        console.log(`✅ 取得成功: ${url} (${content.length}文字)`);
        
        return content;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 取得エラー (試行 ${attempt}): ${error}`);
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * (config.retryDelay || 3000);
          console.log(`⏳ ${waitTime}ms 待機後に再試行...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError || new Error('スクレイピングに失敗しました');
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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    
    const config = {
      maxRetries: 3,
      retryDelay: 3000,
      requestDelay: 5000,
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 25000
    };

    const html = await SafeScrapingService.fetchPageSafely(url, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ 食べログ: 取得したHTMLが短すぎます');
      return [];
    }

    const businesses = [];
    
    // より具体的な食べログの店舗リストパターン
    const namePatterns = [
      // リスト内の店舗名リンク
      /<a[^>]*class="[^"]*list-rst__rst-name-target[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g,
      // 検索結果の店舗名
      /<h3[^>]*class="[^"]*list-rst__rst-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // ランキングリストの店舗名
      /<div[^>]*class="[^"]*rstlist-info[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 15) {
        const [, url, name] = match;
        const cleanName = name.trim()
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          // ジャンル抽出の試行
          let genre = '飲食店';
          const genrePattern = new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,500}?class="[^"]*list-rst__category[^"]*"[^>]*>([^<]+)`, 'i');
          const genreMatch = html.match(genrePattern);
          if (genreMatch) {
            genre = genreMatch[1].trim();
          }
          
          businesses.push({
            name: cleanName,
            website_url: url?.startsWith('http') ? url : `https://tabelog.com${url}`,
            has_website: true,
            location: prefecture,
            industry: genre,
            phone: '',
            address: prefecture,
            data_source: '食べログ',
            is_new: true
          });
        }
      }
      if (businesses.length >= 15) break;
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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    const config = {
      maxRetries: 2,
      retryDelay: 4000,
      requestDelay: 8000,
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 30000
    };

    const html = await SafeScrapingService.fetchPageSafely(url, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ えきてん: 取得したHTMLが短すぎます');
      return [];
    }

    const businesses = [];
    
    // えきてんの実際のHTML構造に合わせたパターン
    const namePatterns = [
      // メインの店舗リンク
      /<a[^>]*class="[^"]*p-shop-list__item__link[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<h3[^>]*class="[^"]*p-shop-list__item__name[^"]*"[^>]*>([^<]+)<\/h3>/g,
      // 代替パターン - タイトル属性付き
      /<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*class="[^"]*shop[^"]*"/g,
      // シンプルな店舗名パターン
      /<h3[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 10) {
        const [, url, name] = match;
        const cleanName = name.trim()
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\n/g, ' ')
          .replace(/\t/g, '');
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          // カテゴリ抽出の試行
          let category = 'サービス業';
          const categoryPattern = new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,300}?class="[^"]*category[^"]*"[^>]*>([^<]+)`, 'i');
          const categoryMatch = html.match(categoryPattern);
          if (categoryMatch) {
            category = categoryMatch[1].trim();
          }
          
          businesses.push({
            name: cleanName,
            website_url: url?.startsWith('http') ? url : `https://www.ekiten.jp${url}`,
            has_website: true,
            location: prefecture,
            industry: category,
            phone: '',
            address: prefecture,
            data_source: 'えきてん',
            is_new: true
          });
        }
      }
      if (businesses.length >= 10) break;
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
    // まいぷれは各都道府県ごとに別ドメイン
    const prefectureDomains: Record<string, string> = {
      '東京都': 'tokyo',
      '神奈川県': 'kanagawa', 
      '大阪府': 'osaka',
      '愛知県': 'aichi',
      '福岡県': 'fukuoka'
    };
    
    const domainCode = prefectureDomains[prefecture] || 'tokyo';
    const searchUrl = `https://${domainCode}.maipre.jp/shop/`;
    
    console.log(`🏢 まいぷれスクレイピング開始: ${searchUrl}`);
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    
    const config = {
      maxRetries: 2,
      retryDelay: 6000,
      requestDelay: 10000,
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      timeout: 30000
    };

    const html = await SafeScrapingService.fetchPageSafely(searchUrl, config);
    
    if (!html || html.length < 1000) {
      console.warn('⚠️ まいぷれ: 取得したHTMLが短すぎます');
      return [];
    }
    
    const businesses = [];
    
    // まいぷれの実際のHTML構造に合わせたパターン
    const namePatterns = [
      // 店舗一覧ページの店舗名
      /<h3[^>]*class="[^"]*shop-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // リスト形式の店舗名
      /<div[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      // 新しい形式の店舗リンク
      /<a[^>]*class="[^"]*store-link[^"]*"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/g,
      // シンプルパターン
      /<a[^>]*href="(\/shop\/[^"]+)"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of namePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 8) {
        const [, url, name] = match;
        const cleanName = name.trim()
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\n/g, ' ')
          .replace(/\t/g, '')
          .replace(/【[^】]*】/g, '') // 【】内を除去
          .replace(/\([^)]*\)/g, ''); // ()内を除去
        
        if (cleanName && cleanName.length > 1 && !businesses.some(b => b.name === cleanName)) {
          // カテゴリ抽出の試行
          let category = '地域サービス';
          const categoryPattern = new RegExp(`${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,200}?class="[^"]*category[^"]*"[^>]*>([^<]+)`, 'i');
          const categoryMatch = html.match(categoryPattern);
          if (categoryMatch) {
            category = categoryMatch[1].trim();
          }
          
          businesses.push({
            name: cleanName,
            website_url: url?.startsWith('http') ? url : `https://${domainCode}.maipre.jp${url}`,
            has_website: true,
            location: prefecture,
            industry: category,
            phone: '',
            address: prefecture,
            data_source: 'まいぷれ',
            is_new: true
          });
        }
      }
      if (businesses.length >= 8) break;
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
