
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
    const { dataSourceGroup, prefecture = '東京都' } = await req.json();
    
    console.log(`🔄 スクレイピング開始: ${dataSourceGroup}, ${prefecture}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const scrapedBusinesses: any[] = [];

    if (dataSourceGroup === 'scraping' || dataSourceGroup === 'all') {
      // 食べログのスクレイピング
      console.log('📡 食べログからデータ取得中...');
      const tabelogData = await scrapeTabelogData(prefecture);
      scrapedBusinesses.push(...tabelogData);

      // えきてんのスクレイピング
      console.log('📡 えきてんからデータ取得中...');
      const ekitenData = await scrapeEkitenData(prefecture);
      scrapedBusinesses.push(...ekitenData);

      // まいぷれのスクレイピング
      console.log('📡 まいぷれからデータ取得中...');
      const maipreData = await scrapeMaipreData(prefecture);
      scrapedBusinesses.push(...maipreData);
    }

    // 国税庁APIデータ取得
    if (dataSourceGroup === 'nta' || dataSourceGroup === 'all' || dataSourceGroup === 'priority') {
      console.log('📡 国税庁法人番号公表サイトからデータ取得中...');
      const ntaData = await fetchNTAData(prefecture);
      scrapedBusinesses.push(...ntaData);
    }

    // FUMAデータ取得
    if (dataSourceGroup === 'fuma' || dataSourceGroup === 'all') {
      console.log('📡 FUMA（フーマ）からデータ取得中...');
      const fumaData = await fetchFUMAData();
      scrapedBusinesses.push(...fumaData);
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
        console.error('データベース保存エラー:', error);
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

    return new Response(JSON.stringify({
      success: true,
      totalSaved: 0,
      message: '取得できるデータはありませんでした'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ スクレイピングエラー:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'データ取得中にエラーが発生しました'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scrapeTabelogData(prefecture: string) {
  try {
    // より長いレート制限（ブロック回避）
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const prefectureMap: Record<string, string> = {
      '東京都': 'tokyo',
      '大阪府': 'osaka',
      '愛知県': 'aichi',
      '神奈川県': 'kanagawa',
      '福岡県': 'fukuoka'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    
    // より自然なアクセスパターン
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    const url = `https://tabelog.com/${prefCode}/`;
    console.log(`🔍 食べログURL: ${url}`);
    
    // リトライ機能付きフェッチ
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': randomUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          }
        });
        
        if (response.ok) break;
        
        if (response.status === 429 || response.status === 503) {
          // レート制限の場合は長時間待機
          const waitTime = Math.pow(2, retryCount) * 10000; // 指数バックオフ
          console.log(`⏳ レート制限検出。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        retryCount++;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    if (!response || !response.ok) {
      console.warn(`⚠️ 食べログ応答エラー: ${response?.status}`);
      return [];
    }

    const html = await response.text();
    console.log(`📄 食べログHTML取得: ${html.length}文字`);
    
    // より柔軟なパターンマッチング
    const businesses = [];
    const patterns = [
      /<h3[^>]*class="[^"]*list-rst__name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="[^"]*list-rst__rst-name-target[^"]*"[^>]*>([^<]+)<\/a>/g,
      /<div[^>]*class="[^"]*list-rst__header[^"]*"[^>]*>[\s\S]*?<h3[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 20) {
        const name = match[1].trim().replace(/\s+/g, ' ');
        if (name && name.length > 1 && !businesses.some(b => b.name === name)) {
          businesses.push({
            name: name,
            website_url: '',
            has_website: false,
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
    console.error('食べログスクレイピングエラー:', error);
    return [];
  }
}

async function scrapeEkitenData(prefecture: string) {
  try {
    // より安全なレート制限
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // より具体的な検索URL
    const prefectureMap: Record<string, string> = {
      '東京都': 'tokyo',
      '大阪府': 'osaka',
      '愛知県': 'aichi',
      '神奈川県': 'kanagawa',
      '福岡県': 'fukuoka'
    };
    
    const prefCode = prefectureMap[prefecture] || 'tokyo';
    const url = `https://www.ekiten.jp/${prefCode}/`;
    console.log(`🔍 えきてんURL: ${url}`);
    
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': randomUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
          }
        });
        
        if (response.ok) break;
        
        if (response.status === 429 || response.status === 503) {
          const waitTime = Math.pow(2, retryCount) * 15000;
          console.log(`⏳ えきてんレート制限。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        retryCount++;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    }

    if (!response || !response.ok) {
      console.warn(`⚠️ えきてん応答エラー: ${response?.status}`);
      return [];
    }

    const html = await response.text();
    console.log(`📄 えきてんHTML取得: ${html.length}文字`);
    
    // 複数パターンでマッチング
    const businesses = [];
    const patterns = [
      /<h3[^>]*class="[^"]*shop-name[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
      /<div[^>]*class="[^"]*shop-item[^"]*"[^>]*>[\s\S]*?<h[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g,
      /<a[^>]*class="[^"]*shop-link[^"]*"[^>]*>([^<]+)<\/a>/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null && businesses.length < 15) {
        const name = match[1].trim().replace(/\s+/g, ' ');
        if (name && name.length > 1 && !businesses.some(b => b.name === name)) {
          businesses.push({
            name: name,
            website_url: '',
            has_website: false,
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
    // 最も慎重なレート制限
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // より具体的な都道府県検索
    const prefectureCode = encodeURIComponent(prefecture);
    const url = `https://www.maipre.jp/search/?pref=${prefectureCode}`;
    console.log(`🔍 まいぷれURL: ${url}`);
    
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': randomUserAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Referer': 'https://www.maipre.jp/'
          }
        });
        
        if (response.ok) break;
        
        if (response.status === 429 || response.status === 503) {
          const waitTime = Math.pow(2, retryCount) * 20000;
          console.log(`⏳ まいぷれレート制限。${waitTime}ms待機中...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        retryCount++;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    if (!response || !response.ok) {
      console.warn(`⚠️ まいぷれ応答エラー: ${response?.status}`);
      return [];
    }

    const html = await response.text();
    console.log(`📄 まいぷれHTML取得: ${html.length}文字`);
    
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
