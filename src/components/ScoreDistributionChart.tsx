
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

// Utility function to ensure safe numeric values
const sanitizeNumber = (value: number, fallback: number = 0): number => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(5, value)); // Clamp between 0 and 5
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart received businesses:", businesses);

  // フィルタリング: ウェブサイトを持つ企業のみを対象、かつ有効なスコアを持つもの
  const businessesWithWebsite = businesses.filter(b => {
    const sanitizedScore = sanitizeNumber(b.overall_score);
    const hasValidScore = b.has_website && sanitizedScore > 0;
    
    console.log(`Business ${b.name}: has_website=${b.has_website}, overall_score=${b.overall_score}, sanitized=${sanitizedScore}, hasValidScore=${hasValidScore}`);
    return hasValidScore;
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
      const sanitizedScore = sanitizeNumber(b.overall_score);
      return sanitizedScore >= range.min && sanitizedScore < range.max;
    }).length;
    
    console.log(`Score range ${range.range}: count=${count}`);
    
    return {
      range: range.range,
      count: Math.max(0, count), // Ensure non-negative
      color: range.color
    };
  });

  console.log("Distribution data:", distributionData);

  // 最大カウント数を取得（Y軸のドメイン設定用）
  const maxCount = Math.max(...distributionData.map(d => d.count), 1);
  console.log("Max count for Y axis:", maxCount);

  // 業界別平均スコア - より厳密な数値処理
  const industryGroups = businessesWithWebsite.reduce((acc, business) => {
    if (!acc[business.industry]) {
      acc[business.industry] = { total: 0, count: 0 };
    }
    
    const sanitizedScore = sanitizeNumber(business.overall_score);
    if (sanitizedScore > 0) {
      acc[business.industry].total += sanitizedScore;
      acc[business.industry].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  console.log("Industry groups:", industryGroups);

  const industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0)
    .map(([industry, data]) => {
      const rawAverage = data.total / data.count;
      const roundedAverage = Math.round(rawAverage * 10) / 10;
      const sanitizedAverage = sanitizeNumber(roundedAverage, 0);
      
      console.log(`Industry ${industry}: raw=${rawAverage}, rounded=${roundedAverage}, sanitized=${sanitizedAverage}`);
      
      return {
        industry,
        average: sanitizedAverage
      };
    })
    .filter(item => item.average > 0)
    .sort((a, b) => b.average - a.average); // Sort by average score descending

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

  // データが空の場合の表示
  if (businessesWithWebsite.length === 0) {
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
            <CardTitle>业界別平均スコア</CardTitle>
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
          {distributionData.some(d => d.count > 0) ? (
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
                    domain={[0, maxCount]}
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
              スコアデータがありません
            </div>
          )}
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
