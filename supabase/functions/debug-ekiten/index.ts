import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pythonロジック完全移植版デバッグ
async function debugEkitenScraping() {
  console.log(`🐛 えきてんURL構造調査（405エラー対応版）`);
  
  // 複数のURL構造パターンをテスト
  const testUrlPatterns = [
    // パターン1: 元のg/aコード形式
    'https://www.ekiten.jp/g0104/a01101/',
    'https://www.ekiten.jp/g0201/a01101/',
    
    // パターン2: 地域検索形式
    'https://www.ekiten.jp/search/?prefecture=01&city=01101',
    'https://www.ekiten.jp/search/hokkaido/sapporo',
    
    // パターン3: トップページから構造調査
    'https://www.ekiten.jp/',
    'https://www.ekiten.jp/hokkaido/',
    'https://www.ekiten.jp/tokyo/',
    
    // パターン4: 具体的な店舗カテゴリページ
    'https://www.ekiten.jp/shop/',
    'https://www.ekiten.jp/restaurant/',
    
    // パターン5: 実際に存在する可能性が高いURL
    'https://www.ekiten.jp/pref/hokkaido/',
    'https://www.ekiten.jp/pref/tokyo/'
  ];
  
  const results = [];
  
  for (const url of testUrlPatterns) {
    console.log(`\n🔍 詳細調査: ${url}`);
    
    try {
      // より本物のブラウザに近いヘッダーを使用
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-User': '?1',
          'Sec-Fetch-Dest': 'document',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'max-age=0'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      console.log(`📊 ステータス: ${response.status} ${response.statusText}`);
      console.log(`📊 Content-Type: ${response.headers.get('Content-Type')}`);
      console.log(`📊 Server: ${response.headers.get('Server')}`);
      console.log(`📊 Cloudflare-Ray-ID: ${response.headers.get('CF-Ray')}`);
      console.log(`📊 Set-Cookie: ${response.headers.get('Set-Cookie')}`);
      
      // レスポンスヘッダー全体を表示
      const allHeaders: any = {};
      response.headers.forEach((value, key) => {
        allHeaders[key] = value;
      });
      console.log(`📊 全ヘッダー:`, allHeaders);
      
      let responseBody = '';
      try {
        responseBody = await response.text();
        console.log(`📊 レスポンスサイズ: ${responseBody.length}文字`);
        
        if (responseBody.length > 0) {
          console.log(`📊 先頭500文字:\n${responseBody.substring(0, 500)}`);
          
          // エラーページかどうか検出
          const isCloudflareBlock = responseBody.includes('Cloudflare') || responseBody.includes('cf-ray');
          const isJavaScriptRequired = responseBody.includes('JavaScript') || responseBody.includes('js-required');
          const isCaptcha = responseBody.includes('captcha') || responseBody.includes('CAPTCHA');
          const isRateLimited = responseBody.includes('rate limit') || responseBody.includes('too many requests');
          
          console.log(`🔍 Cloudflare保護: ${isCloudflareBlock ? 'はい' : 'いいえ'}`);
          console.log(`🔍 JavaScript必須: ${isJavaScriptRequired ? 'はい' : 'いいえ'}`);
          console.log(`🔍 CAPTCHA要求: ${isCaptcha ? 'はい' : 'いいえ'}`);
          console.log(`🔍 レート制限: ${isRateLimited ? 'はい' : 'いいえ'}`);
        }
      } catch (bodyError) {
        console.log(`⚠️ レスポンスボディ取得エラー: ${bodyError}`);
      }
      
      if (response.ok) {
        // 成功した場合の詳細分析
        const analysis = analyzePythonStructure(responseBody);
        const shops = extractShopsWithPythonLogic(responseBody);
        
        results.push({
          url,
          status: response.status,
          headers: allHeaders,
          htmlSize: responseBody.length,
          analysis,
          extractedShops: shops,
          success: shops.length > 0
        });
      } else {
        results.push({ 
          url, 
          status: response.status,
          statusText: response.statusText,
          headers: allHeaders,
          responsePreview: responseBody.substring(0, 500),
          error: `HTTP ${response.status} ${response.statusText}` 
        });
      }
      
    } catch (error) {
      console.log(`❌ 取得エラー: ${error}`);
      results.push({ url, error: error.toString() });
    }
    
    // 1秒間隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// 成功した200 OKページの詳細HTML分析
function analyzePythonStructure(html: string) {
  console.log(`\n📋 詳細HTML構造分析 (${html.length}文字):`);
  
  const analysis: any = {};
  
  // 1. JavaScript/SPAの検出
  const hasReact = html.includes('React') || html.includes('react');
  const hasVue = html.includes('Vue') || html.includes('vue');
  const hasAngular = html.includes('Angular') || html.includes('angular');
  const hasNext = html.includes('__NEXT_DATA__') || html.includes('_next');
  const hasNuxt = html.includes('__NUXT__') || html.includes('_nuxt');
  
  analysis.frameworkDetection = {
    react: hasReact,
    vue: hasVue,
    angular: hasAngular,
    nextjs: hasNext,
    nuxtjs: hasNuxt
  };
  
  console.log(`🔍 フレームワーク検出:`, analysis.frameworkDetection);
  
  // 2. JSON-LDまたは構造化データの検出
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
  if (jsonLdMatches) {
    analysis.jsonLd = jsonLdMatches.length;
    console.log(`🔍 JSON-LD構造化データ: ${jsonLdMatches.length}個発見`);
    try {
      const firstJsonLd = JSON.parse(jsonLdMatches[0].match(/>(.*?)<\//s)?.[1] || '{}');
      console.log(`🔍 最初のJSON-LD:`, firstJsonLd);
      analysis.firstJsonLd = firstJsonLd;
    } catch (e) {
      console.log(`⚠️ JSON-LD解析エラー: ${e}`);
    }
  }
  
  // 3. 初期データの検出（__INITIAL_STATE__, window.__など）
  const initialStateMatches = html.match(/window\.__[A-Z_]+__\s*=\s*({.*?});/gs);
  if (initialStateMatches) {
    analysis.initialStates = initialStateMatches.length;
    console.log(`🔍 初期データ: ${initialStateMatches.length}個発見`);
    console.log(`🔍 例: ${initialStateMatches[0].substring(0, 200)}...`);
  }
  
  // 4. Laravelルート情報
  const laravelRoutes = html.match(/route\(['"](.*?)['"][^)]*\)/g);
  if (laravelRoutes) {
    analysis.laravelRoutes = laravelRoutes.slice(0, 10);
    console.log(`🔍 Laravelルート: ${laravelRoutes.length}個発見`);
  }
  
  // 5. API エンドポイントの検出
  const apiEndpoints = html.match(/['"`]\/api\/[^'"`]*['"`]/g);
  if (apiEndpoints) {
    analysis.apiEndpoints = [...new Set(apiEndpoints)].slice(0, 10);
    console.log(`🔍 APIエンドポイント: ${apiEndpoints.length}個発見`);
    console.log(`🔍 例:`, analysis.apiEndpoints);
  }
  
  // 6. 従来のHTMLパターンも再確認
  const traditionalClasses = [
    'shop', 'store', 'business', 'item', 'card', 'list',
    'name', 'title', 'address', 'tel', 'phone', 'url', 'website'
  ];
  
  analysis.traditionalElements = {};
  traditionalClasses.forEach(className => {
    const regex = new RegExp(`class="[^"]*${className}[^"]*"`, 'gi');
    const matches = html.match(regex);
    if (matches) {
      analysis.traditionalElements[className] = matches.length;
      console.log(`🔍 従来要素 ${className}: ${matches.length}個`);
    }
  });
  
  // 7. data-属性の検出
  const dataAttributes = html.match(/data-[a-z-]+="[^"]*"/gi);
  if (dataAttributes) {
    const uniqueDataAttrs = [...new Set(dataAttributes.map(attr => attr.split('=')[0]))];
    analysis.dataAttributes = uniqueDataAttrs.slice(0, 20);
    console.log(`🔍 data-属性: ${uniqueDataAttrs.length}種類発見`);
  }
  
  return analysis;
}

// JSON-LDデータから店舗URLを抽出し、詳細情報を取得
function extractShopsWithPythonLogic(html: string): any[] {
  console.log(`\n🔍 JSON-LD店舗URL抽出開始`);
  
  const shops: any[] = [];
  
  try {
    // JSON-LDデータを抽出
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    
    if (!jsonLdMatches) {
      console.log(`❌ JSON-LDデータが見つかりません`);
      return shops;
    }
    
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.match(/>(.*?)<\//s)?.[1];
        if (!jsonContent) continue;
        
        const jsonData = JSON.parse(jsonContent);
        console.log(`🔍 JSON-LDデータ解析: ${JSON.stringify(jsonData).substring(0, 200)}...`);
        
        // 配列の場合は各要素をチェック
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const data of dataArray) {
          // ItemListを探す
          if (data['@type'] === 'ItemList' && data.itemListElement) {
            console.log(`✅ ItemList発見: ${data.numberOfItems}件の店舗URL`);
            
            for (const item of data.itemListElement.slice(0, 5)) { // 最初の5件をテスト
              if (item.url && item.url.includes('/shop_')) {
                console.log(`📋 店舗URL取得: ${item.url}`);
                
                // 各店舗の詳細情報を取得（最初の1件のみテスト）
                if (shops.length === 0) {
                  try {
                    const shopDetails = await fetchShopDetails(item.url);
                    if (shopDetails) {
                      shops.push({
                        url: item.url,
                        position: item.position,
                        ...shopDetails
                      });
                    }
                  } catch (error) {
                    console.log(`⚠️ 店舗詳細取得エラー: ${error}`);
                  }
                }
              }
            }
            
            // URLリストを返す（詳細取得は1件のみテスト）
            return data.itemListElement.map((item: any, index: number) => ({
              position: item.position || index + 1,
              url: item.url,
              type: 'shop_url',
              available: item.url && item.url.includes('/shop_')
            }));
          }
        }
        
      } catch (parseError) {
        console.log(`⚠️ JSON解析エラー: ${parseError}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ 全般エラー: ${error}`);
  }
  
  console.log(`🎯 JSON-LD抽出結果: ${shops.length}件の詳細情報 + URLリスト`);
  return shops;
}

// 個別店舗の詳細情報を取得
async function fetchShopDetails(shopUrl: string): Promise<any | null> {
  console.log(`\n🏪 店舗詳細取得: ${shopUrl}`);
  
  try {
    const response = await fetch(shopUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.log(`❌ 店舗ページエラー: HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    console.log(`📊 店舗ページサイズ: ${html.length}文字`);
    
    // 店舗詳細情報を抽出
    const shopDetails: any = {};
    
    // 店舗名
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<|]+)[|｜]?[^<]*<\/title>/i);
    if (nameMatch) {
      shopDetails.name = nameMatch[1].trim().replace(/\s*[|｜]\s*エキテン.*$/gi, '');
    }
    
    // 住所
    const addressPattern = /住所[^>]*>([^<]*北海道[^<]+)</i;
    const addressMatch = html.match(addressPattern);
    if (addressMatch) {
      shopDetails.address = addressMatch[1].trim();
    }
    
    // 電話番号
    const phonePattern = /tel:([0-9-]+)/i;
    const phoneMatch = html.match(phonePattern);
    if (phoneMatch) {
      shopDetails.phone = phoneMatch[1];
    }
    
    // 公式サイト
    const websitePattern = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>.*?公式[^<]*<\/a>/i;
    const websiteMatch = html.match(websitePattern);
    if (websiteMatch) {
      shopDetails.website = websiteMatch[1];
    }
    
    console.log(`✅ 店舗詳細抽出完了:`, shopDetails);
    return shopDetails;
    
  } catch (error) {
    console.log(`❌ 店舗詳細取得エラー: ${error}`);
    return null;
  }
}

function analyzeHtmlStructure(html: string) {
  console.log(`\n📋 HTML構造分析:`);
  
  const analysis: any = {};
  
  // タイトル確認
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    analysis.title = titleMatch[1];
    console.log(`📋 タイトル: ${titleMatch[1]}`);
  }
  
  // 主要なclassを探す
  const classPatterns = [
    'p-shop-cassette',
    'shop-cassette',
    'shop-item',
    'shop-card',
    'shop-list',
    'store-item',
    'business-item'
  ];
  
  analysis.classes = {};
  classPatterns.forEach(className => {
    const regex = new RegExp(`class="[^"]*${className}[^"]*"`, 'gi');
    const matches = html.match(regex);
    if (matches) {
      analysis.classes[className] = matches.length;
      console.log(`📋 ${className}: ${matches.length}個発見`);
      console.log(`    例: ${matches[0]}`);
    }
  });
  
  // shop_リンクの存在確認
  const shopLinks = html.match(/href="[^"]*\/shop_\d+[^"]*"/gi);
  if (shopLinks) {
    analysis.shopLinks = shopLinks.length;
    console.log(`📋 shop_リンク: ${shopLinks.length}個発見`);
    console.log(`    例: ${shopLinks[0]}`);
  }
  
  // JavaScriptの有無
  const hasJs = html.includes('<script');
  analysis.hasJavaScript = hasJs;
  console.log(`📋 JavaScript: ${hasJs ? '有り' : '無し'}`);
  
  // SPA（Single Page Application）の可能性
  const isSpa = html.includes('__NEXT_DATA__') || html.includes('window.__') || html.includes('React');
  analysis.isSpa = isSpa;
  console.log(`📋 SPA可能性: ${isSpa ? '高い' : '低い'}`);
  
  // 403/404エラーページかチェック
  const isErrorPage = html.includes('404') || html.includes('Not Found') || 
                     html.includes('403') || html.includes('Forbidden') ||
                     html.includes('アクセスできません');
  analysis.isErrorPage = isErrorPage;
  console.log(`📋 エラーページ: ${isErrorPage ? 'はい' : 'いいえ'}`);
  
  return analysis;
}

function extractBusinessNamesDebug(html: string): string[] {
  const businessNames: string[] = [];
  
  console.log(`\n🎯 店舗名抽出デバッグ開始`);
  
  // Pythonマニュアルの完全パターン
  const patterns = [
    {
      name: 'p-shop-cassette__name',
      regex: /<p[^>]*class="[^"]*p-shop-cassette__name[^"]*"[^>]*>([^<]+)<\/p>/gi
    },
    {
      name: 'p-shop-cassette__name-link',
      regex: /<a[^>]*class="[^"]*p-shop-cassette__name-link[^"]*"[^>]*>([^<]+)<\/a>/gi
    },
    {
      name: 'shop_リンク直接',
      regex: /<a[^>]*href="[^"]*\/shop_\d+[^"]*"[^>]*>([^<]{2,30})<\/a>/gi
    },
    {
      name: '日本語店舗名',
      regex: />([ァ-ヶあ-ん一-龯]{2,}[^<>]{0,20}[店舗館サロンクリニック薬局美容カフェレストラン])[<]/gi
    },
    {
      name: 'タイトルから',
      regex: /<title>([^<|]+)\s*[|｜]\s*エキテン/gi
    },
    {
      name: '任意のリンクテキスト',
      regex: /<a[^>]*>([ァ-ヶあ-ん一-龯\w\s]{3,25})<\/a>/gi
    }
  ];
  
  patterns.forEach(({ name, regex }) => {
    console.log(`🔍 パターン「${name}」で検索中...`);
    let match;
    let count = 0;
    
    while ((match = regex.exec(html)) !== null && businessNames.length < 20) {
      let storeName = match[1].trim();
      
      // クリーニング
      storeName = storeName
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[★☆]+\s*/, '')
        .replace(/\s*[|｜]\s*エキテン.*$/gi, '')
        .replace(/\s*-\s*エキテン.*$/gi, '');
      
      if (storeName.length >= 2 && storeName.length <= 50 && 
          !businessNames.includes(storeName) && storeName !== 'エキテン' &&
          !storeName.includes('検索') && !storeName.includes('ログイン')) {
        businessNames.push(storeName);
        count++;
        console.log(`  ✅ ${count}. ${storeName}`);
      }
    }
    
    if (count === 0) {
      console.log(`  ❌ パターン「${name}」: 見つからず`);
    }
  });
  
  return businessNames;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`🐛 デバッグスクレイピング開始`)
    
    const results = await debugEkitenScraping()
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalUrls: results.length,
          successUrls: results.filter(r => r.success).length,
          errorUrls: results.filter(r => r.error).length
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})