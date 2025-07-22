import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// デバッグ専用えきてんスクレイピング
async function debugEkitenScraping() {
  console.log(`🐛 えきてんデバッグ開始`);
  
  // Pythonマニュアルの成功URL構造を完全再現
  const testUrls = [
    'https://www.ekiten.jp/g0104/a01109/',  // 札幌市手稲区グルメ（Pythonマニュアル成功例）
    'https://www.ekiten.jp/g0201/a01109/',  // 札幌市手稲区美容室
    'https://www.ekiten.jp/g0104/a01101/',  // 札幌市中央区グルメ
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    console.log(`\n🔍 デバッグURL: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.5',
          'Connection': 'keep-alive'
        },
        signal: AbortSignal.timeout(30000)
      });
      
      console.log(`📊 ステータス: ${response.status}`);
      console.log(`📊 Content-Type: ${response.headers.get('Content-Type')}`);
      
      if (!response.ok) {
        console.log(`❌ HTTPエラー: ${response.status} ${response.statusText}`);
        results.push({ url, error: `HTTP ${response.status}` });
        continue;
      }
      
      const html = await response.text();
      console.log(`📊 HTMLサイズ: ${html.length}文字`);
      console.log(`📊 先頭500文字:\n${html.substring(0, 500)}`);
      console.log(`📊 末尾200文字:\n${html.substring(html.length - 200)}`);
      
      // HTMLの構造を分析
      const analysis = analyzeHtmlStructure(html);
      
      // 店舗名抽出テスト
      const names = extractBusinessNamesDebug(html);
      console.log(`✅ 抽出結果: ${names.length}件`);
      names.forEach((name, i) => console.log(`  ${i+1}. ${name}`));
      
      results.push({
        url,
        status: response.status,
        htmlSize: html.length,
        analysis,
        extractedNames: names,
        success: names.length > 0
      });
      
    } catch (error) {
      console.log(`❌ 取得エラー: ${error}`);
      results.push({ url, error: error.toString() });
    }
    
    // レート制限
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
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