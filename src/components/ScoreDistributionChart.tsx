
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

// Comprehensive utility function to ensure safe numeric values
const sanitizeNumber = (value: any, fallback: number = 0): number => {
  // Handle null, undefined, or non-numeric values
  if (value === null || value === undefined || typeof value !== 'number') {
    return fallback;
  }
  
  // Handle NaN and Infinity
  if (isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  
  // Clamp between 0 and 5 for score values
  return Math.max(0, Math.min(5, value));
};

// Sanitize entire data objects
const sanitizeChartData = (data: any[]): any[] => {
  return data.map(item => {
    const sanitized = { ...item };
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'number') {
        sanitized[key] = sanitizeNumber(sanitized[key]);
      }
    });
    return sanitized;
  }).filter(item => {
    // Remove items where all numeric values are 0 (likely invalid)
    const numericValues = Object.values(item).filter(v => typeof v === 'number');
    return numericValues.some(v => v > 0);
  });
};

const ScoreDistributionChart = ({ businesses }: ScoreDistributionChartProps) => {
  console.log("ScoreDistributionChart received businesses:", businesses);

  // First, sanitize all business data
  const sanitizedBusinesses = businesses.map(b => ({
    ...b,
    overall_score: sanitizeNumber(b.overall_score),
    technical_score: sanitizeNumber(b.technical_score),
    eeat_score: sanitizeNumber(b.eeat_score),
    content_score: sanitizeNumber(b.content_score),
    ai_content_score: b.ai_content_score !== null ? sanitizeNumber(b.ai_content_score) : null
  }));

  // Filter: only businesses with websites and valid scores
  const businessesWithWebsite = sanitizedBusinesses.filter(b => {
    const hasValidScore = b.has_website && b.overall_score > 0;
    console.log(`Business ${b.name}: has_website=${b.has_website}, overall_score=${b.overall_score}, hasValidScore=${hasValidScore}`);
    return hasValidScore;
  });

  console.log("Filtered businesses with valid scores:", businessesWithWebsite);

  // Score distribution data preparation with extra validation
  const scoreRanges = [
    { range: "0-1", min: 0, max: 1, color: "#ef4444" },
    { range: "1-2", min: 1, max: 2, color: "#f97316" },
    { range: "2-3", min: 2, max: 3, color: "#eab308" },
    { range: "3-4", min: 3, max: 4, color: "#22c55e" },
    { range: "4-5", min: 4, max: 5, color: "#16a34a" },
  ];

  let distributionData = scoreRanges.map(range => {
    const count = businessesWithWebsite.filter(b => {
      const score = sanitizeNumber(b.overall_score);
      return score >= range.min && score < range.max;
    }).length;
    
    console.log(`Score range ${range.range}: count=${count}`);
    
    return {
      range: range.range,
      count: Math.max(0, count), // Ensure non-negative
      color: range.color
    };
  });

  // Sanitize the distribution data
  distributionData = sanitizeChartData(distributionData);
  console.log("Distribution data after sanitization:", distributionData);

  // Industry average calculation with enhanced validation
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

  let industryData = Object.entries(industryGroups)
    .filter(([_, data]) => data.count > 0)
    .map(([industry, data]) => {
      const rawAverage = data.total / data.count;
      const average = sanitizeNumber(rawAverage);
      
      console.log(`Industry ${industry}: raw=${rawAverage}, sanitized=${average}`);
      
      return {
        industry,
        average
      };
    })
    .filter(item => item.average > 0)
    .sort((a, b) => b.average - a.average);

  // Sanitize industry data
  industryData = sanitizeChartData(industryData);
  console.log("Final industry data after sanitization:", industryData);

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

  // Enhanced empty data handling
  if (businessesWithWebsite.length === 0 || distributionData.length === 0) {
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
          {distributionData.length > 0 && distributionData.some(d => d.count > 0) ? (
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
                    domain={[0, 10]}
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
