
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

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart received businesses:", businesses);

  // フィルタリング: ウェブサイトを持つ企業のみを対象、かつ有効なスコアを持つもの
  const businessesWithWebsite = businesses.filter(b => {
    const hasValidScore = b.has_website && 
      typeof b.overall_score === 'number' && 
      !isNaN(b.overall_score) && 
      isFinite(b.overall_score) &&
      b.overall_score >= 0;
    
    console.log(`Business ${b.name}: has_website=${b.has_website}, overall_score=${b.overall_score}, hasValidScore=${hasValidScore}`);
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
    const count = businessesWithWebsite.filter(b => 
      b.overall_score >= range.min && 
      b.overall_score < range.max
    ).length;
    
    console.log(`Score range ${range.range}: count=${count}`);
    
    return {
      range: range.range,
      count,
      color: range.color
    };
  });

  console.log("Distribution data:", distributionData);

  // 業界別平均スコア - より厳密なバリデーション
  const industryGroups = businessesWithWebsite.reduce((acc, business) => {
    if (!acc[business.industry]) {
      acc[business.industry] = { total: 0, count: 0 };
    }
    
    // より厳密なスコアチェック
    if (typeof business.overall_score === 'number' && 
        !isNaN(business.overall_score) && 
        isFinite(business.overall_score) &&
        business.overall_score >= 0) {
      acc[business.industry].total += business.overall_score;
      acc[business.industry].count += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  console.log("Industry groups:", industryGroups);

  const industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0) // 企業数が0の業界を除外
    .map(([industry, data]) => {
      const average = data.total / data.count;
      // NaN、無限大、負の値をチェック
      const validAverage = typeof average === 'number' && 
        !isNaN(average) && 
        isFinite(average) && 
        average >= 0 ? 
        Number(average.toFixed(1)) : 0;
      
      console.log(`Industry ${industry}: average=${average}, validAverage=${validAverage}`);
      
      return {
        industry,
        average: validAverage
      };
    })
    .filter(item => item.average > 0); // 0より大きい平均値のみを含める

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
                    domain={[0, 'dataMax']}
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
