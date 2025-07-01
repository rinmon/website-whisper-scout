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
    const { businessId, websiteUrl } = await req.json();
    
    if (!businessId || !websiteUrl) {
      throw new Error('businessId and websiteUrl are required');
    }

    console.log(`🔍 ウェブサイト分析開始: ${websiteUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. 基本的なサイト情報の取得
    const siteInfo = await analyzeSiteBasics(websiteUrl);
    
    // 2. Lighthouse分析の実行
    const lighthouseData = await runLighthouseAnalysis(websiteUrl);
    
    // 3. E-E-A-T要素の分析
    const eeatFactors = await analyzeEEATFactors(websiteUrl);
    
    // 4. コンテンツ品質の分析
    const contentAnalysis = await analyzeContentQuality(websiteUrl);
    
    // 5. 総合スコアの計算
    const scores = calculateOverallScores({
      lighthouse: lighthouseData,
      eeat: eeatFactors,
      content: contentAnalysis,
      siteInfo
    });
    
    // 6. 分析結果をデータベースに保存
    const { data: analysisResult, error: analysisError } = await supabase
      .from('website_analysis')
      .upsert({
        business_id: businessId,
        lighthouse_score: lighthouseData,
        core_web_vitals: lighthouseData.coreWebVitals,
        mobile_friendly: siteInfo.mobileFriendly,
        ssl_certificate: siteInfo.hasSSL,
        structured_data: siteInfo.structuredData,
        meta_tags: siteInfo.metaTags,
        eeat_factors: eeatFactors,
        content_analysis: contentAnalysis,
        analyzed_at: new Date().toISOString()
      }, {
        onConflict: 'business_id'
      })
      .select();

    if (analysisError) {
      console.error('分析結果保存エラー:', analysisError);
      throw analysisError;
    }

    // 7. 企業テーブルのスコアを更新
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        overall_score: scores.overall,
        technical_score: scores.technical,
        eeat_score: scores.eeat,
        content_score: scores.content,
        ai_content_score: scores.aiContent,
        user_experience_score: scores.userExperience,
        seo_score: scores.seo,
        last_analyzed: new Date().toISOString()
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('企業スコア更新エラー:', updateError);
      throw updateError;
    }

    console.log(`✅ ウェブサイト分析完了: ${websiteUrl}`);
    
    return new Response(JSON.stringify({
      success: true,
      scores,
      analysisResult: analysisResult?.[0],
      message: 'ウェブサイト分析が完了しました'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ウェブサイト分析エラー:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'ウェブサイト分析中にエラーが発生しました'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeSiteBasics(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const hasSSL = url.startsWith('https://');
    
    // メタタグの解析
    const metaTags = {
      title: extractMetaContent(html, 'title'),
      description: extractMetaContent(html, 'meta[name="description"]'),
      keywords: extractMetaContent(html, 'meta[name="keywords"]'),
      robots: extractMetaContent(html, 'meta[name="robots"]'),
      viewport: extractMetaContent(html, 'meta[name="viewport"]')
    };

    // 構造化データの検出
    const structuredData = {
      jsonLd: html.includes('application/ld+json'),
      microdata: html.includes('itemscope'),
      rdfa: html.includes('typeof=')
    };

    // モバイルフレンドリーの簡易チェック
    const mobileFriendly = !!(metaTags.viewport && metaTags.viewport.includes('width=device-width'));

    return {
      hasSSL,
      metaTags,
      structuredData,
      mobileFriendly,
      responseTime: response.headers.get('server-timing') || 'unknown'
    };

  } catch (error) {
    console.error('サイト基本分析エラー:', error);
    return {
      hasSSL: false,
      metaTags: {},
      structuredData: {},
      mobileFriendly: false,
      responseTime: 'error'
    };
  }
}

async function runLighthouseAnalysis(url: string) {
  try {
    // PageSpeed Insights APIを使用（無料）
    const apiUrl = `https://www.googleapis.com/pagespeed/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = await response.json();
    const lighthouseResult = data.lighthouseResult;

    const scores = {
      performance: lighthouseResult.categories.performance?.score * 100 || 0,
      accessibility: lighthouseResult.categories.accessibility?.score * 100 || 0,
      bestPractices: lighthouseResult.categories['best-practices']?.score * 100 || 0,
      seo: lighthouseResult.categories.seo?.score * 100 || 0
    };

    const coreWebVitals = {
      fcp: lighthouseResult.audits['first-contentful-paint']?.numericValue || 0,
      lcp: lighthouseResult.audits['largest-contentful-paint']?.numericValue || 0,
      cls: lighthouseResult.audits['cumulative-layout-shift']?.numericValue || 0,
      fid: lighthouseResult.audits['max-potential-fid']?.numericValue || 0
    };

    return {
      scores,
      coreWebVitals,
      overall: Object.values(scores).reduce((a, b) => a + b, 0) / 4
    };

  } catch (error) {
    console.error('Lighthouse分析エラー:', error);
    return {
      scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
      coreWebVitals: { fcp: 0, lcp: 0, cls: 0, fid: 0 },
      overall: 0
    };
  }
}

async function analyzeEEATFactors(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const factors = {
      hasContactInfo: checkContactInfo(html),
      hasAboutPage: await checkAboutPage(url, html),
      hasPrivacyPolicy: await checkPrivacyPolicy(url, html),
      hasTermsOfService: await checkTermsOfService(url, html),
      hasAuthorInfo: checkAuthorInfo(html),
      hasSocialMediaLinks: checkSocialMediaLinks(html),
      hasSSL: url.startsWith('https://'),
      hasBusinessInfo: checkBusinessInfo(html)
    };

    const score = Object.values(factors).filter(Boolean).length / Object.keys(factors).length * 5;

    return { factors, score };

  } catch (error) {
    console.error('E-E-A-T分析エラー:', error);
    return {
      factors: {},
      score: 0
    };
  }
}

async function analyzeContentQuality(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // テキストコンテンツの抽出
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;

    // 基本的な品質指標
    const analysis = {
      wordCount,
      readabilityScore: calculateReadabilityScore(textContent),
      keywordDensity: calculateKeywordDensity(textContent),
      aiGeneratedContentRatio: detectAIContent(textContent),
      contentFreshness: checkContentFreshness(html),
      imageOptimization: checkImageOptimization(html)
    };

    const qualityScore = calculateContentScore(analysis);

    return { analysis, score: qualityScore };

  } catch (error) {
    console.error('コンテンツ品質分析エラー:', error);
    return {
      analysis: {},
      score: 0
    };
  }
}

function calculateOverallScores({ lighthouse, eeat, content, siteInfo }: any) {
  const technical = (lighthouse.scores.performance + lighthouse.scores.bestPractices) / 2;
  const seo = lighthouse.scores.seo;
  const userExperience = (lighthouse.scores.accessibility + (siteInfo.mobileFriendly ? 100 : 0)) / 2;
  const overall = (technical + seo + userExperience + eeat.score * 20 + content.score * 20) / 5;

  return {
    overall: Math.round(overall) / 20, // 5点満点に変換
    technical: Math.round(technical) / 20,
    eeat: eeat.score,
    content: content.score,
    aiContent: content.analysis.aiGeneratedContentRatio || 0,
    userExperience: Math.round(userExperience) / 20,
    seo: Math.round(seo) / 20
  };
}

// ヘルパー関数
function extractMetaContent(html: string, selector: string): string {
  const regex = new RegExp(`<${selector}[^>]*content=["']([^"']*)`);
  const match = html.match(regex);
  return match ? match[1] : '';
}

function checkContactInfo(html: string): boolean {
  const contactPatterns = [
    /contact/i, /お問い合わせ/i, /連絡先/i,
    /電話番号/i, /tel:/i, /mailto:/i
  ];
  return contactPatterns.some(pattern => pattern.test(html));
}

async function checkAboutPage(baseUrl: string, html: string): Promise<boolean> {
  const aboutPatterns = [/about/i, /会社概要/i, /企業情報/i];
  return aboutPatterns.some(pattern => pattern.test(html));
}

async function checkPrivacyPolicy(baseUrl: string, html: string): Promise<boolean> {
  const privacyPatterns = [/privacy/i, /プライバシー/i, /個人情報/i];
  return privacyPatterns.some(pattern => pattern.test(html));
}

async function checkTermsOfService(baseUrl: string, html: string): Promise<boolean> {
  const termsPatterns = [/terms/i, /利用規約/i, /サービス利用/i];
  return termsPatterns.some(pattern => pattern.test(html));
}

function checkAuthorInfo(html: string): boolean {
  const authorPatterns = [/author/i, /執筆者/i, /writer/i, /編集者/i];
  return authorPatterns.some(pattern => pattern.test(html));
}

function checkSocialMediaLinks(html: string): boolean {
  const socialPatterns = [
    /twitter\.com/i, /facebook\.com/i, /instagram\.com/i,
    /linkedin\.com/i, /youtube\.com/i
  ];
  return socialPatterns.some(pattern => pattern.test(html));
}

function checkBusinessInfo(html: string): boolean {
  const businessPatterns = [
    /設立/i, /代表者/i, /所在地/i, /資本金/i,
    /従業員数/i, /事業内容/i
  ];
  return businessPatterns.some(pattern => pattern.test(html));
}

function calculateReadabilityScore(text: string): number {
  // 簡易的な読みやすさスコア（文字数、文の長さなどから算出）
  const sentences = text.split(/[。！？]/).length;
  const avgSentenceLength = text.length / sentences;
  
  if (avgSentenceLength < 50) return 5;
  if (avgSentenceLength < 100) return 4;
  if (avgSentenceLength < 150) return 3;
  if (avgSentenceLength < 200) return 2;
  return 1;
}

function calculateKeywordDensity(text: string): number {
  // 簡易的なキーワード密度計算
  const words = text.split(/\s+/);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  return Math.round((uniqueWords.size / wordCount) * 100) / 100;
}

function detectAIContent(text: string): number {
  // AI生成コンテンツの簡易検出（パターンベース）
  const aiPatterns = [
    /一方で/g, /について述べ/g, /重要である/g,
    /考慮すべき/g, /総合的に/g
  ];
  
  const matches = aiPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  return Math.min(matches / 10, 1); // 0-1の範囲で返す
}

function checkContentFreshness(html: string): boolean {
  const datePatterns = [
    /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
    /更新日/i, /最終更新/i, /modified/i
  ];
  return datePatterns.some(pattern => pattern.test(html));
}

function checkImageOptimization(html: string): boolean {
  const images = html.match(/<img[^>]*>/g) || [];
  const optimizedImages = images.filter(img => 
    img.includes('alt=') && (img.includes('webp') || img.includes('loading='))
  );
  
  return images.length > 0 ? optimizedImages.length / images.length > 0.5 : true;
}

function calculateContentScore(analysis: any): number {
  let score = 0;
  
  // 文字数スコア
  if (analysis.wordCount > 500) score += 1;
  if (analysis.wordCount > 1000) score += 1;
  
  // 読みやすさスコア
  score += analysis.readabilityScore || 0;
  
  // AI生成コンテンツ（低いほど良い）
  score += (1 - analysis.aiGeneratedContentRatio) * 2;
  
  // その他の要素
  if (analysis.contentFreshness) score += 1;
  if (analysis.imageOptimization) score += 0.5;
  
  return Math.min(score, 5);
}