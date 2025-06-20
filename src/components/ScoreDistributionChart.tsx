
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

// 厳密な数値サニタイズ関数
const sanitizeNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  
  const num = typeof value === 'number' ? value : Number(value);
  
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return fallback;
  }
  
  // 0-5の範囲に制限し、小数点2桁まで
  const bounded = Math.max(0, Math.min(5, num));
  return Math.round(bounded * 100) / 100;
};

// 安全な除算関数
const safeDivide = (numerator: number, denominator: number, fallback: number = 0): number => {
  const num = sanitizeNumber(numerator);
  const den = sanitizeNumber(denominator);
  
  if (den === 0) {
    return fallback;
  }
  
  const result = num / den;
  return sanitizeNumber(result, fallback);
};

// 配列の安全な最大値取得
const safeMax = (values: number[], fallback: number = 1): number => {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }
  
  const sanitizedValues = values.map(v => sanitizeNumber(v)).filter(v => v >= 0);
  
  if (sanitizedValues.length === 0) {
    return fallback;
  }
  
  const max = Math.max(...sanitizedValues);
  return sanitizeNumber(max, fallback);
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart received businesses:", businesses);

  // ビジネスデータの厳密なサニタイズ
  const sanitizedBusinesses = businesses.map(b => ({
    ...b,
    overall_score: sanitizeNumber(b.overall_score),
    technical_score: sanitizeNumber(b.technical_score),
    eeat_score: sanitizeNumber(b.eeat_score),
    content_score: sanitizeNumber(b.content_score),
    ai_content_score: b.ai_content_score !== null ? sanitizeNumber(b.ai_content_score) : null
  }));

  // サイト保有企業のフィルタリング
  const businessesWithWebsite = sanitizedBusinesses.filter(b => {
    return b.has_website && sanitizeNumber(b.overall_score) > 0;
  });

  console.log("Filtered businesses with valid scores:", businessesWithWebsite);

  // スコア分布データの準備
  const scoreRanges = [
    { range: "0-1", min: 0, max: 1, color: "#ef4444" },
    { range: "1-2", min: 1, max: 2, color: "#f97316" },
    { range: "2-3", min: 2, max: 3, color: "#eab308" },
    { range: "3-4", min: 3, max: 4, color: "#22c55e" },
    { range: "4-5", min: 4, max: 5, color: "#16a34a" },
  ];

  const distributionData = scoreRanges.map(range => {
    const count = businessesWithWebsite.filter(b => {
      const score = sanitizeNumber(b.overall_score);
      return score >= range.min && score < range.max;
    }).length;
    
    return {
      range: range.range,
      count: sanitizeNumber(count),
      color: range.color
    };
  });

  console.log("Distribution data:", distributionData);

  // 業界平均の計算（安全な除算を使用）
  const industryGroups = businessesWithWebsite.reduce((acc, business) => {
    if (!acc[business.industry]) {
      acc[business.industry] = { total: 0, count: 0 };
    }
    
    const score = sanitizeNumber(business.overall_score);
    if (score > 0) {
      acc[business.industry].total = sanitizeNumber(acc[business.industry].total + score);
      acc[business.industry].count = sanitizeNumber(acc[business.industry].count + 1);
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  console.log("Industry groups:", industryGroups);

  const industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0)
    .map(([industry, data]) => {
      const average = safeDivide(data.total, data.count, 0);
      return {
        industry,
        average: sanitizeNumber(average)
      };
    })
    .filter(item => item.average > 0)
    .sort((a, b) => sanitizeNumber(b.average) - sanitizeNumber(a.average));

  console.log("Final industry data:", industryData);

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

  // データが存在しない場合の処理
  if (businessesWithWebsite.length === 0 || distributionData.every(d => d.count === 0)) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>スコア分布</CardTitle>
            <CardDescription>
              サイト保有企業の品質スコア分布
            </CardDescription>
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
            <CardDescription>
              各業界のウェブサイト品質平均値
            </CardDescription>
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

  // 軸の最大値を安全に計算
  const countValues = distributionData.map(d => d.count);
  const maxCount = safeMax(countValues, 1);
  const yAxisMax = sanitizeNumber(maxCount + 1, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>スコア分布</CardTitle>
          <CardDescription>
            サイト保有企業の品質スコア分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
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
                  domain={[0, yAxisMax]}
                  type="number"
                  allowDecimals={false}
                  tickCount={Math.max(2, Math.min(6, yAxisMax + 1))}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>業界別平均スコア</CardTitle>
          <CardDescription>
            各業界のウェブサイト品質平均値
          </CardDescription>
        </CardHeader>
        <CardContent>
          {industryData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryData} layout="horizontal">
                  <XAxis 
                    type="number"
                    domain={[0, 5]}
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    allowDecimals={true}
                    tickCount={6}
                  />
                  <YAxis 
                    dataKey="industry"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    width={80}
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
