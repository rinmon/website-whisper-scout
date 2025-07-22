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

// Pythonロジック完全移植の構造分析
function analyzePythonStructure(html: string) {
  console.log(`\n📋 Pythonロジック構造分析:`);
  
  const analysis: any = {};
  
  // Pythonで使用されている正確なクラス名をチェック
  const pythonClassPatterns = [
    'p-shop-cassette',           // メインコンテナ
    'p-shop-cassette__name',     // 店舗名
    'p-shop-cassette__address',  // 住所
    'p-shop-cassette__name-link',// 詳細リンク
    'p-shop-cassette__genre-item', // カテゴリ
    'c-pager__next',             // 次ページリンク
    'p-shop-info__tel-number',   // 電話番号（詳細ページ）
    'p-shop-info__official-website-link' // 公式サイト（詳細ページ）
  ];
  
  analysis.pythonClasses = {};
  pythonClassPatterns.forEach(className => {
    const regex = new RegExp(`class="[^"]*${className}[^"]*"`, 'gi');
    const matches = html.match(regex);
    if (matches) {
      analysis.pythonClasses[className] = matches.length;
      console.log(`🐍 ${className}: ${matches.length}個発見`);
      console.log(`    例: ${matches[0]}`);
    } else {
      console.log(`🐍 ${className}: ❌ 見つからず`);
    }
  });
  
  return analysis;
}

// Pythonロジック完全移植の店舗抽出
function extractShopsWithPythonLogic(html: string): any[] {
  console.log(`\n🐍 Pythonロジック完全移植: 店舗抽出開始`);
  
  const shops: any[] = [];
  
  // Pythonコードの正確なロジックを再現
  // shops = soup.find_all("div", class_="p-shop-cassette")
  const shopPattern = /<div[^>]*class="[^"]*p-shop-cassette[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  
  while ((match = shopPattern.exec(html)) !== null && shops.length < 10) {
    const shopHtml = match[1];
    console.log(`🔍 店舗コンテナ発見: ${shopHtml.substring(0, 100)}...`);
    
    // 店舗名: shop_name_tag = shop.find("p", class_="p-shop-cassette__name")
    const nameMatch = shopHtml.match(/<p[^>]*class="[^"]*p-shop-cassette__name[^"]*"[^>]*>([^<]+)<\/p>/i);
    const shopName = nameMatch ? nameMatch[1].trim() : "N/A";
    
    // 住所: address_tag = shop.find("p", class_="p-shop-cassette__address")
    const addressMatch = shopHtml.match(/<p[^>]*class="[^"]*p-shop-cassette__address[^"]*"[^>]*>([^<]+)<\/p>/i);
    const address = addressMatch ? addressMatch[1].trim() : "N/A";
    
    // 詳細ページリンク: detail_link_tag = shop.find("a", class_="p-shop-cassette__name-link")
    const linkMatch = shopHtml.match(/<a[^>]*class="[^"]*p-shop-cassette__name-link[^"]*"[^>]*href="([^"]+)"[^>]*>/i);
    const detailPath = linkMatch ? linkMatch[1] : "";
    const detailUrl = detailPath ? `https://www.ekiten.jp${detailPath}` : "N/A";
    
    // カテゴリ: genres = shop.find_all("li", class_="p-shop-cassette__genre-item")
    const genreMatches = shopHtml.match(/<li[^>]*class="[^"]*p-shop-cassette__genre-item[^"]*"[^>]*>([^<]+)<\/li>/gi);
    const categories = genreMatches ? genreMatches.map(g => g.match(/>([^<]+)</)?.[1]?.trim() || '') : [];
    
    if (shopName !== "N/A" && shopName.length > 0) {
      shops.push({
        name: shopName,
        address: address,
        detailUrl: detailUrl,
        categories: categories,
        mainCategory: categories[0] || "N/A",
        subCategories: categories.slice(1).join(", ") || ""
      });
      
      console.log(`✅ 店舗抽出成功: ${shopName} (${address})`);
    }
  }
  
  console.log(`🎯 Pythonロジック: ${shops.length}件の店舗を抽出`);
  return shops;
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