
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

// 安全な数値変換
const toSafeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return (!Number.isFinite(num) || Number.isNaN(num)) ? 0 : Math.max(0, Math.min(5, num));
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart rendering with businesses:", businesses?.length || 0);

  // 基本的なデータ検証
  if (!Array.isArray(businesses) || businesses.length === 0) {
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

  // データの安全な処理
  const safeBusinesses = businesses.map(b => ({
    ...b,
    overall_score: toSafeNumber(b.overall_score),
    technical_score: toSafeNumber(b.technical_score),
    eeat_score: toSafeNumber(b.eeat_score),
    content_score: toSafeNumber(b.content_score)
  }));

  // サイト保有企業のフィルタリング
  const businessesWithWebsite = safeBusinesses.filter(b => 
    b.has_website && b.overall_score > 0
  );

  if (businessesWithWebsite.length === 0) {
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

  // スコア分布データ
  const scoreRanges = [
    { range: "0-1", min: 0, max: 1 },
    { range: "1-2", min: 1, max: 2 },
    { range: "2-3", min: 2, max: 3 },
    { range: "3-4", min: 3, max: 4 },
    { range: "4-5", min: 4, max: 5 },
  ];

  const distributionData = scoreRanges.map(range => {
    const count = businessesWithWebsite.filter(b => {
      const score = b.overall_score;
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
    
    acc[industry].total += business.overall_score;
    acc[industry].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const industryData = Object.entries(industryGroups)
    .map(([industry, data]) => ({
      industry,
      average: toSafeNumber(data.total / data.count)
    }))
    .filter(item => item.average > 0)
    .sort((a, b) => b.average - a.average);

  console.log("Chart data:", {
    distributionData,
    industryData
  });

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>スコア分布</CardTitle>
          <CardDescription>サイト保有企業の品質スコア分布</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          <CardDescription>各業界のウェブサイト品質平均値</CardDescription>
        </CardHeader>
        <CardContent>
          {industryData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryData} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
                  <XAxis 
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
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
