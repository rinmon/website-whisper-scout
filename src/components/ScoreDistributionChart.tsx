
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
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  
  // 小数点精度を修正し、0-5の範囲に制限
  const rounded = Math.round(num * 100) / 100;
  return Math.max(0, Math.min(5, rounded));
};

// 軸設定用のサニタイズ関数
const sanitizeAxisValue = (value: any): number => {
  const sanitized = sanitizeNumber(value);
  // 軸の値は必ず有効な数値でなければならない
  return sanitized;
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart received businesses:", businesses);

  // ビジネスデータのサニタイズ
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
      count: sanitizeAxisValue(count), // 軸用にサニタイズ
      color: range.color
    };
  });

  console.log("Distribution data:", distributionData);

  // 業界平均の計算
  const industryGroups = businessesWithWebsite.reduce((acc, business) => {
    if (!acc[business.industry]) {
      acc[business.industry] = { total: 0, count: 0 };
    }
    
    const score = sanitizeNumber(business.overall_score);
    if (score > 0) {
      acc[business.industry].total += score;
      acc[business.industry].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  console.log("Industry groups:", industryGroups);

  const industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0)
    .map(([industry, data]) => {
      const average = sanitizeNumber(data.total / data.count);
      return {
        industry,
        average: sanitizeAxisValue(average) // 軸用にサニタイズ
      };
    })
    .filter(item => item.average > 0)
    .sort((a, b) => b.average - a.average);

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
  const maxCount = Math.max(...distributionData.map(d => d.count), 1);
  const safeMaxCount = sanitizeAxisValue(maxCount);

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
                  domain={[0, safeMaxCount + 1]}
                  type="number"
                  allowDecimals={false}
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
                    allowDecimals={false}
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
