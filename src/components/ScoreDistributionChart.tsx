
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface Business {
  id: number;
  name: string;
  industry: string;
  location: string;
  website_url: string | null;
  has_website: boolean;
  overall_score: number;
  technical_score: number;
  eeat_score: number;
  content_score: number;
  ai_content_score: number | null;
}

interface ScoreDistributionChartProps {
  businesses: Business[];
}

// 完全にセーフな数値サニタイズ関数
const sanitizeNumber = (value: any): number => {
  if (value === null || value === undefined || value === "" || 
      (typeof value === "string" && value.trim() === "")) {
    return 0;
  }
  
  const num = Number(value);
  
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return 0;
  }
  
  const clamped = Math.max(0, Math.min(5, num));
  const rounded = Math.round(clamped * 100) / 100;
  
  return Number.isFinite(rounded) ? rounded : 0;
};

// 配列から安全に最大値を取得する関数
const getSafeMax = (numbers: number[], fallback: number = 1): number => {
  const validNumbers = numbers.filter(n => Number.isFinite(n) && !Number.isNaN(n) && n > 0);
  if (validNumbers.length === 0) return fallback;
  
  const max = Math.max(...validNumbers);
  return Number.isFinite(max) && !Number.isNaN(max) && max > 0 ? max : fallback;
};

// 安全なdomain計算関数 - より保守的なアプローチ
const getSafeDomain = (value: number): [number, number] => {
  if (!Number.isFinite(value) || Number.isNaN(value) || value <= 0) {
    return [0, 5];
  }
  
  const upperBound = Math.ceil(value * 1.2);
  const safeBound = Number.isFinite(upperBound) && !Number.isNaN(upperBound) && upperBound > 0 ? upperBound : 5;
  
  return [0, Math.max(safeBound, 1)];
};

// データ配列を完全にサニタイズする関数
const sanitizeChartData = (data: any[]): any[] => {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return data.map(item => {
    const sanitizedItem: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'number') {
        sanitizedItem[key] = Number.isFinite(value) && !Number.isNaN(value) ? value : 0;
      } else {
        sanitizedItem[key] = value;
      }
    }
    return sanitizedItem;
  }).filter(item => {
    // データに有効な数値が含まれている場合のみ含める
    return Object.values(item).some(value => 
      typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value) && value >= 0
    );
  });
};

// チャートデータが有効かチェック
const isValidChartData = (data: any[]): boolean => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  return data.every(item => {
    if (!item || typeof item !== 'object') return false;
    
    const numericValues = Object.values(item).filter(value => typeof value === 'number');
    if (numericValues.length === 0) return false;
    
    return numericValues.every(value => 
      Number.isFinite(value) && !Number.isNaN(value) && value >= 0
    );
  });
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart rendering with businesses:", businesses?.length || 0);

  // 入力データの基本チェック
  if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
    console.log("No businesses data provided");
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>スコア分布</CardTitle>
            <CardDescription>サイト保有企業の品質スコア分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              データがありません
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>業界別平均スコア</CardTitle>
            <CardDescription>各業界のウェブサイト品質平均値</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              データがありません
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // データの完全なサニタイズ
  const safeBusinesses = businesses.map(b => ({
    ...b,
    overall_score: sanitizeNumber(b.overall_score),
    technical_score: sanitizeNumber(b.technical_score),
    eeat_score: sanitizeNumber(b.eeat_score),
    content_score: sanitizeNumber(b.content_score),
    ai_content_score: b.ai_content_score !== null ? sanitizeNumber(b.ai_content_score) : null
  }));

  // サイト保有企業のフィルタリング
  const businessesWithWebsite = safeBusinesses.filter(b => 
    b.has_website && sanitizeNumber(b.overall_score) > 0
  );

  console.log("Filtered businesses:", businessesWithWebsite?.length || 0);

  // 有効な企業データがない場合は早期リターン
  if (!businessesWithWebsite || businessesWithWebsite.length === 0) {
    console.log("No valid businesses with websites");
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>スコア分布</CardTitle>
            <CardDescription>サイト保有企業の品質スコア分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              データがありません
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>業界別平均スコア</CardTitle>
            <CardDescription>各業界のウェブサイト品質平均値</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              データがありません
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // スコア分布データの準備
  const scoreRanges = [
    { range: "0-1", min: 0, max: 1 },
    { range: "1-2", min: 1, max: 2 },
    { range: "2-3", min: 2, max: 3 },
    { range: "3-4", min: 3, max: 4 },
    { range: "4-5", min: 4, max: 5 },
  ];

  const distributionData = scoreRanges.map(range => {
    const count = businessesWithWebsite.filter(b => {
      const score = sanitizeNumber(b.overall_score);
      return score >= range.min && score < range.max;
    }).length;
    
    return {
      range: range.range,
      count: Math.max(0, count)
    };
  });

  // 業界平均の計算
  const industryGroups = businessesWithWebsite.reduce((acc, business) => {
    const industry = business.industry || "その他";
    if (!acc[industry]) {
      acc[industry] = { total: 0, count: 0 };
    }
    
    const score = sanitizeNumber(business.overall_score);
    if (score > 0) {
      acc[industry].total += score;
      acc[industry].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0)
    .map(([industry, data]) => ({
      industry,
      average: sanitizeNumber(data.total / data.count)
    }))
    .filter(item => item.average > 0)
    .sort((a, b) => b.average - a.average);

  // チャートデータを完全にサニタイズ
  const safeDistributionData = sanitizeChartData(distributionData);
  const safeIndustryData = sanitizeChartData(industryData);

  console.log("Safe distribution data:", safeDistributionData);
  console.log("Safe industry data:", safeIndustryData);

  // チャートデータの有効性チェック
  const hasValidDistribution = isValidChartData(safeDistributionData);
  const hasValidIndustry = isValidChartData(safeIndustryData);

  console.log("Chart data validity:", { hasValidDistribution, hasValidIndustry });

  const chartConfig = {
    count: {
      label: "企業数",
      color: "#2563eb",
    },
    average: {
      label: "平均スコア",
      color: "#dc2626",
    },
  };

  // 安全にdomain値を計算 - 固定された配列形式で返す
  const maxCount = hasValidDistribution ? getSafeMax(safeDistributionData.map(d => d.count), 1) : 1;
  const maxAverage = hasValidIndustry ? getSafeMax(safeIndustryData.map(d => d.average), 1) : 1;
  
  const countDomain = getSafeDomain(maxCount);
  const averageDomain = getSafeDomain(maxAverage);

  console.log("Final chart values:", { 
    maxCount, 
    maxAverage, 
    countDomain, 
    averageDomain,
    safeDistributionDataLength: safeDistributionData.length,
    safeIndustryDataLength: safeIndustryData.length,
    hasValidDistribution,
    hasValidIndustry
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>スコア分布</CardTitle>
          <CardDescription>サイト保有企業の品質スコア分布</CardDescription>
        </CardHeader>
        <CardContent>
          {hasValidDistribution ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="range" 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    domain={countDomain}
                    allowDecimals={false}
                    type="number"
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    fill="var(--color-count)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              データがありません
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>業界別平均スコア</CardTitle>
          <CardDescription>各業界のウェブサイト品質平均値</CardDescription>
        </CardHeader>
        <CardContent>
          {hasValidIndustry ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeIndustryData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                  <XAxis 
                    type="number"
                    domain={averageDomain}
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    allowDecimals={true}
                  />
                  <YAxis 
                    dataKey="industry"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    width={70}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar 
                    dataKey="average" 
                    radius={[0, 4, 4, 0]}
                    fill="var(--color-average)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              業界データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreDistributionChart;
