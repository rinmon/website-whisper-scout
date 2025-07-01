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
    const { businessId, proposalType = 'improvement', customTemplate } = await req.json();
    
    if (!businessId) {
      throw new Error('businessId is required');
    }

    console.log(`📄 営業提案書生成開始: ${businessId}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. 企業データと分析結果を取得
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        *,
        website_analysis (*)
      `)
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error('企業データが見つかりません');
    }

    // 2. 競合他社データを取得
    const { data: competitors } = await supabase
      .from('businesses')
      .select('*')
      .eq('industry', business.industry)
      .neq('id', businessId)
      .order('overall_score', { ascending: false })
      .limit(3);

    // 3. 提案書テンプレートに基づいて内容を生成
    const proposalData = await generateProposalContent({
      business,
      competitors: competitors || [],
      analysisData: business.website_analysis?.[0],
      proposalType,
      customTemplate
    });

    // 4. HTML形式の提案書を生成
    const htmlProposal = generateProposalHTML(proposalData);

    console.log(`✅ 営業提案書生成完了: ${business.name}`);
    
    return new Response(JSON.stringify({
      success: true,
      proposal: proposalData,
      html: htmlProposal,
      message: '営業提案書が生成されました'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ 提案書生成エラー:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: '提案書生成中にエラーが発生しました'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateProposalContent({ business, competitors, analysisData, proposalType, customTemplate }: any) {
  const currentDate = new Date().toLocaleDateString('ja-JP');
  
  // 基本情報
  const basicInfo = {
    companyName: business.name,
    industry: business.industry || '不明',
    location: business.location || '不明',
    websiteUrl: business.website_url,
    hasWebsite: business.has_website,
    generateDate: currentDate
  };

  // スコア分析
  const scores = {
    overall: business.overall_score || 0,
    technical: business.technical_score || 0,
    eeat: business.eeat_score || 0,
    content: business.content_score || 0,
    userExperience: business.user_experience_score || 0,
    seo: business.seo_score || 0
  };

  // 競合比較
  const competitorAnalysis = generateCompetitorAnalysis(business, competitors);

  // 改善提案の生成
  const improvements = generateImprovementRecommendations(scores, analysisData);

  // 費用対効果の算出
  const costBenefit = calculateCostBenefit(business, improvements);

  // 提案書タイプに応じた内容生成
  let proposalContent;
  switch (proposalType) {
    case 'new_website':
      proposalContent = generateNewWebsiteProposal(basicInfo, competitorAnalysis, costBenefit);
      break;
    case 'improvement':
      proposalContent = generateImprovementProposal(basicInfo, scores, improvements, competitorAnalysis);
      break;
    case 'seo':
      proposalContent = generateSEOProposal(basicInfo, scores, analysisData);
      break;
    case 'comprehensive':
      proposalContent = generateComprehensiveProposal(basicInfo, scores, improvements, competitorAnalysis, costBenefit);
      break;
    default:
      proposalContent = generateImprovementProposal(basicInfo, scores, improvements, competitorAnalysis);
  }

  return {
    basicInfo,
    scores,
    improvements,
    competitorAnalysis,
    costBenefit,
    content: proposalContent,
    metadata: {
      type: proposalType,
      generatedAt: new Date().toISOString(),
      version: '1.0'
    }
  };
}

function generateCompetitorAnalysis(business: any, competitors: any[]) {
  if (competitors.length === 0) {
    return {
      summary: '同業界の競合データが不足しているため、詳細な比較分析を行うことで市場優位性を確立できます。',
      recommendations: ['業界調査の実施', '競合分析の定期実行']
    };
  }

  const avgScore = competitors.reduce((sum, comp) => sum + (comp.overall_score || 0), 0) / competitors.length;
  const businessScore = business.overall_score || 0;

  let summary;
  if (businessScore > avgScore) {
    summary = `${business.industry}業界において、貴社のウェブサイト品質は競合平均（${avgScore.toFixed(1)}点）を上回る${businessScore.toFixed(1)}点を獲得しており、良好な状況です。`;
  } else {
    const gap = avgScore - businessScore;
    summary = `${business.industry}業界の競合平均（${avgScore.toFixed(1)}点）に対し、貴社は${businessScore.toFixed(1)}点と${gap.toFixed(1)}点の改善余地があります。`;
  }

  return {
    summary,
    avgScore,
    gap: avgScore - businessScore,
    topCompetitors: competitors.slice(0, 3).map(comp => ({
      name: comp.name,
      score: comp.overall_score,
      strengths: generateCompetitorStrengths(comp)
    }))
  };
}

function generateImprovementRecommendations(scores: any, analysisData: any) {
  const recommendations = [];

  // 技術的改善
  if (scores.technical < 3) {
    recommendations.push({
      category: '技術的改善',
      priority: 'high',
      items: [
        'ページ読み込み速度の最適化',
        'モバイルフレンドリー対応',
        'SSL証明書の導入',
        'Core Web Vitalsの改善'
      ],
      expectedImpact: '検索順位向上、ユーザー体験改善',
      timeline: '1-2ヶ月'
    });
  }

  // SEO改善
  if (scores.seo < 3) {
    recommendations.push({
      category: 'SEO対策',
      priority: 'high',
      items: [
        'メタタグの最適化',
        '構造化データの実装',
        'サイトマップの作成',
        'キーワード戦略の見直し'
      ],
      expectedImpact: '検索流入の増加、認知度向上',
      timeline: '2-3ヶ月'
    });
  }

  // コンテンツ改善
  if (scores.content < 3) {
    recommendations.push({
      category: 'コンテンツ改善',
      priority: 'medium',
      items: [
        '質の高いオリジナルコンテンツの作成',
        '情報の定期更新',
        'ユーザーニーズに応じたコンテンツ構成',
        '画像・動画コンテンツの充実'
      ],
      expectedImpact: 'エンゲージメント向上、コンバージョン率改善',
      timeline: '3-6ヶ月'
    });
  }

  // E-E-A-T改善
  if (scores.eeat < 3) {
    recommendations.push({
      category: '信頼性向上',
      priority: 'medium',
      items: [
        '企業情報・代表者情報の充実',
        'お客様の声・実績の掲載',
        'プライバシーポリシーの整備',
        '第三者認証・資格の表示'
      ],
      expectedImpact: '信頼度向上、コンバージョン率改善',
      timeline: '1-2ヶ月'
    });
  }

  return recommendations;
}

function calculateCostBenefit(business: any, improvements: any[]) {
  // 簡易的な費用対効果計算
  const baseCost = 500000; // 基本改修費用
  const monthlyCost = 50000; // 月額運用費用

  let totalCost = baseCost;
  let expectedBenefit = 0;

  improvements.forEach(improvement => {
    switch (improvement.category) {
      case '技術的改善':
        totalCost += 200000;
        expectedBenefit += 300000; // 年間売上向上予想
        break;
      case 'SEO対策':
        totalCost += 150000;
        expectedBenefit += 500000;
        break;
      case 'コンテンツ改善':
        totalCost += 300000;
        expectedBenefit += 400000;
        break;
      case '信頼性向上':
        totalCost += 100000;
        expectedBenefit += 200000;
        break;
    }
  });

  return {
    initialCost: totalCost,
    monthlyCost,
    expectedAnnualBenefit: expectedBenefit,
    roi: expectedBenefit > 0 ? ((expectedBenefit - totalCost) / totalCost * 100).toFixed(1) : 0,
    paybackPeriod: expectedBenefit > 0 ? Math.ceil(totalCost / (expectedBenefit / 12)) : '算出不可'
  };
}

function generateNewWebsiteProposal(basicInfo: any, competitorAnalysis: any, costBenefit: any) {
  return {
    title: `${basicInfo.companyName}様 新規ウェブサイト制作のご提案`,
    sections: [
      {
        title: '現状の課題',
        content: [
          'ウェブサイトをお持ちでないため、オンラインでの企業認知度が限定的',
          'デジタルマーケティングの機会損失',
          '顧客との接点拡大の必要性'
        ]
      },
      {
        title: '新規ウェブサイト制作の効果',
        content: [
          '24時間365日の営業支援ツールとして機能',
          'ブランドイメージの向上と差別化',
          '新規顧客獲得機会の拡大',
          '既存顧客への情報提供強化'
        ]
      },
      {
        title: '費用対効果',
        content: [
          `初期投資: ${costBenefit.initialCost.toLocaleString()}円`,
          `月額運用費: ${costBenefit.monthlyCost.toLocaleString()}円`,
          `期待年間効果: ${costBenefit.expectedAnnualBenefit.toLocaleString()}円`,
          `投資回収期間: ${costBenefit.paybackPeriod}ヶ月`
        ]
      }
    ]
  };
}

function generateImprovementProposal(basicInfo: any, scores: any, improvements: any[], competitorAnalysis: any) {
  return {
    title: `${basicInfo.companyName}様 ウェブサイト改善のご提案`,
    sections: [
      {
        title: '現状分析結果',
        content: [
          `総合評価: ${scores.overall.toFixed(1)}/5.0点`,
          `技術評価: ${scores.technical.toFixed(1)}/5.0点`,
          `SEO評価: ${scores.seo.toFixed(1)}/5.0点`,
          `コンテンツ評価: ${scores.content.toFixed(1)}/5.0点`
        ]
      },
      {
        title: '競合比較',
        content: [competitorAnalysis.summary]
      },
      {
        title: '改善提案',
        content: improvements.map(imp => `【${imp.category}】${imp.items.join('、')}`)
      },
      {
        title: '期待効果',
        content: [
          '検索エンジンでの上位表示',
          'ウェブサイト訪問者数の増加',
          'お問い合わせ・売上の向上',
          'ブランドイメージの向上'
        ]
      }
    ]
  };
}

function generateSEOProposal(basicInfo: any, scores: any, analysisData: any) {
  return {
    title: `${basicInfo.companyName}様 SEO対策のご提案`,
    sections: [
      {
        title: 'SEO現状診断',
        content: [
          `SEOスコア: ${scores.seo.toFixed(1)}/5.0点`,
          `検索エンジン最適化の改善が必要な状況です`
        ]
      },
      {
        title: 'SEO施策提案',
        content: [
          'キーワード戦略の策定',
          'コンテンツSEOの強化',
          'テクニカルSEOの改善',
          '被リンク獲得戦略'
        ]
      }
    ]
  };
}

function generateComprehensiveProposal(basicInfo: any, scores: any, improvements: any[], competitorAnalysis: any, costBenefit: any) {
  return {
    title: `${basicInfo.companyName}様 包括的デジタルマーケティング戦略のご提案`,
    sections: [
      {
        title: 'デジタル戦略概要',
        content: [
          'ウェブサイトを中心としたデジタルマーケティング戦略',
          'ブランド認知度向上から売上拡大まで一貫したサポート'
        ]
      },
      {
        title: '現状分析',
        content: [
          `総合評価: ${scores.overall.toFixed(1)}/5.0点`,
          competitorAnalysis.summary
        ]
      },
      {
        title: '改善提案・スケジュール',
        content: improvements.map(imp => `【${imp.timeline}】${imp.category}: ${imp.expectedImpact}`)
      },
      {
        title: '投資対効果',
        content: [
          `ROI: ${costBenefit.roi}%`,
          `投資回収期間: ${costBenefit.paybackPeriod}ヶ月`,
          `継続的な成長による長期的効果の期待`
        ]
      }
    ]
  };
}

function generateCompetitorStrengths(competitor: any) {
  const strengths = [];
  if (competitor.technical_score > 3) strengths.push('技術的優位性');
  if (competitor.seo_score > 3) strengths.push('SEO最適化');
  if (competitor.content_score > 3) strengths.push('コンテンツ品質');
  return strengths.length > 0 ? strengths : ['基本的なWebサイト運営'];
}

function generateProposalHTML(proposalData: any) {
  const { basicInfo, content } = proposalData;
  
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <style>
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px;
            color: #333;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            margin-bottom: 30px;
            border-radius: 10px;
        }
        .section { 
            background: white;
            margin-bottom: 20px; 
            padding: 25px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 5px;
        }
        .section h2 { 
            color: #667eea; 
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .date { 
            text-align: right; 
            color: #666; 
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="date">作成日: ${basicInfo.generateDate}</div>
    
    <div class="header">
        <h1>${content.title}</h1>
        <p>デジタルマーケティング戦略提案書</p>
    </div>

    ${content.sections.map((section: any) => `
        <div class="section">
            <h2>${section.title}</h2>
            <ul>
                ${section.content.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('')}

    <div class="footer">
        <p>本提案書に関するご質問・ご相談は、お気軽にお問い合わせください。</p>
        <p><strong>クソサイト・スカウター</strong> | デジタルマーケティング支援サービス</p>
    </div>
</body>
</html>`;
}