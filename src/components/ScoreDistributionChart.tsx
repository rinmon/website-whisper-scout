
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

// 超厳密な数値サニタイズ関数
const sanitizeNumber = (value: any, fallback: number = 0): number => {
  // null、undefined、空文字列のチェック
  if (value === null || value === undefined || value === "" || value === "null" || value === "undefined") {
    console.log(`Sanitizing null/undefined value, using fallback: ${fallback}`);
    return fallback;
  }
  
  // 既に数値の場合
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    // 文字列から数値への変換
    const stringValue = String(value).trim();
    if (stringValue === "") {
      console.log(`Sanitizing empty string, using fallback: ${fallback}`);
      return fallback;
    }
    num = Number(stringValue);
  }
  
  // NaN、Infinity、-Infinityのチェック
  if (!Number.isFinite(num) || Number.isNaN(num) || !isFinite(num)) {
    console.log(`Sanitizing invalid number (${value}), using fallback: ${fallback}`);
    return fallback;
  }
  
  // 0-5の範囲に制限し、小数点2桁まで
  const bounded = Math.max(0, Math.min(5, num));
  const rounded = Math.round(bounded * 100) / 100;
  
  // 再度NaNチェック
  if (!Number.isFinite(rounded) || Number.isNaN(rounded)) {
    console.log(`Final NaN check failed for value: ${value}, using fallback: ${fallback}`);
    return fallback;
  }
  
  return rounded;
};

// 安全な除算関数
const safeDivide = (numerator: any, denominator: any, fallback: number = 0): number => {
  const num = sanitizeNumber(numerator, 0);
  const den = sanitizeNumber(denominator, 1);
  
  if (den === 0) {
    console.log(`Division by zero detected, using fallback: ${fallback}`);
    return fallback;
  }
  
  const result = num / den;
  return sanitizeNumber(result, fallback);
};

// 配列の安全な最大値取得
const safeMax = (values: any[], fallback: number = 1): number => {
  if (!Array.isArray(values) || values.length === 0) {
    console.log(`Invalid array for max calculation, using fallback: ${fallback}`);
    return fallback;
  }
  
  const sanitizedValues = values
    .map(v => sanitizeNumber(v, 0))
    .filter(v => v >= 0 && Number.isFinite(v));
  
  if (sanitizedValues.length === 0) {
    console.log(`No valid values in array for max calculation, using fallback: ${fallback}`);
    return fallback;
  }
  
  const max = Math.max(...sanitizedValues);
  const result = sanitizeNumber(max, fallback);
  console.log(`Safe max calculated: ${result} from values:`, sanitizedValues);
  return result;
};

// 安全な軸設定関数
const getSafeAxisConfig = (maxValue: any) => {
  const sanitizedMax = sanitizeNumber(maxValue, 1);
  console.log(`Creating axis config for max value: ${sanitizedMax}`);
  
  // 最小値を1に設定して、domainMaxを計算
  const domainMax = Math.max(2, Math.ceil(sanitizedMax) + 1);
  const tickCount = Math.max(2, Math.min(6, domainMax));
  
  const config = {
    domain: [0, domainMax] as [number, number],
    tickCount: tickCount
  };
  
  console.log(`Axis config created:`, config);
  return config;
};

// 安全なチャートデータ作成
const createSafeChartData = (data: any[]): any[] => {
  if (!Array.isArray(data)) {
    console.log("Invalid data array, returning empty array");
    return [];
  }
  
  return data.map((item, index) => {
    const safeItem = {
      ...item,
      count: sanitizeNumber(item.count, 0),
      average: item.average !== undefined ? sanitizeNumber(item.average, 0) : undefined
    };
    
    // 追加のNaNチェック
    Object.keys(safeItem).forEach(key => {
      if (typeof safeItem[key] === 'number' && (Number.isNaN(safeItem[key]) || !Number.isFinite(safeItem[key]))) {
        console.warn(`Found invalid number in chart data at index ${index}, key ${key}:`, safeItem[key]);
        safeItem[key] = 0;
      }
    });
    
    return safeItem;
  });
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

  // チャートデータの安全性確保
  const safeDistributionData = createSafeChartData(distributionData);
  console.log("Safe distribution data:", safeDistributionData);

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

  // 業界データの安全性確保
  const safeIndustryData = createSafeChartData(industryData);
  console.log("Safe industry data:", safeIndustryData);

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
  if (businessesWithWebsite.length === 0 || safeDistributionData.every(d => sanitizeNumber(d.count) === 0)) {
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

  // 軸の安全な設定を計算
  const countValues = safeDistributionData.map(d => sanitizeNumber(d.count));
  const maxCount = safeMax(countValues, 1);
  const yAxisConfig = getSafeAxisConfig(maxCount);

  console.log("Y-axis configuration:", yAxisConfig);
  console.log("Count values for Y-axis:", countValues);

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
              <BarChart data={safeDistributionData}>
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
                  domain={yAxisConfig.domain}
                  type="number"
                  allowDecimals={false}
                  tickCount={yAxisConfig.tickCount}
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
          {safeIndustryData.length > 0 ? (
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeIndustryData} layout="horizontal">
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
