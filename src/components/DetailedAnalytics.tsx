
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, MapPin, Building2, Users } from "lucide-react";

const DetailedAnalytics = () => {
  // 地域別データ
  const regionalData = [
    { region: "東京都", total: 5247, noWebsite: 1247, lowQuality: 2134, averageScore: 2.8 },
    { region: "大阪府", total: 3521, noWebsite: 847, lowQuality: 1523, averageScore: 2.6 },
    { region: "愛知県", total: 2847, noWebsite: 634, lowQuality: 1247, averageScore: 2.9 },
    { region: "神奈川県", total: 2134, noWebsite: 445, lowQuality: 921, averageScore: 3.1 },
    { region: "福岡県", total: 1847, noWebsite: 423, lowQuality: 847, averageScore: 2.7 },
    { region: "その他", total: 3146, noWebsite: 885, lowQuality: 1447, averageScore: 2.5 }
  ];

  // 会社規模別データ
  const companySizeData = [
    { size: "小規模（1-10名）", count: 8934, percentage: 56.8, averageScore: 2.1 },
    { size: "中規模（11-50名）", count: 4521, percentage: 28.7, averageScore: 2.6 },
    { size: "大規模（51名以上）", count: 2287, percentage: 14.5, averageScore: 3.4 }
  ];

  // 時系列データ
  const trendData = [
    { month: "1月", totalAnalyzed: 12450, noWebsiteRate: 25.3, averageScore: 2.2 },
    { month: "2月", totalAnalyzed: 13120, noWebsiteRate: 24.8, averageScore: 2.3 },
    { month: "3月", totalAnalyzed: 14230, noWebsiteRate: 23.9, averageScore: 2.4 },
    { month: "4月", totalAnalyzed: 14890, noWebsiteRate: 23.2, averageScore: 2.4 },
    { month: "5月", totalAnalyzed: 15320, noWebsiteRate: 22.8, averageScore: 2.3 },
    { month: "6月", totalAnalyzed: 15742, noWebsiteRate: 22.1, averageScore: 2.3 }
  ];

  const chartConfig = {
    total: { label: "総企業数", color: "#2563eb" },
    noWebsite: { label: "サイトなし", color: "#dc2626" },
    lowQuality: { label: "低品質", color: "#ca8a04" },
    averageScore: { label: "平均スコア", color: "#16a34a" }
  };

  const COLORS = ['#2563eb', '#dc2626', '#ca8a04', '#16a34a', '#7c3aed', '#ea580c'];

  return (
    <div className="space-y-6">
      {/* 地域別分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            地域別分析
          </CardTitle>
          <CardDescription>都道府県別のウェブサイト品質状況</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" name="総企業数" />
                <Bar dataKey="noWebsite" fill="var(--color-noWebsite)" name="サイトなし" />
                <Bar dataKey="lowQuality" fill="var(--color-lowQuality)" name="低品質" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionalData.map((region, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{region.region}</h4>
                  <Badge variant={region.averageScore >= 3.0 ? "default" : "secondary"}>
                    {region.averageScore.toFixed(1)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>総企業数:</span>
                    <span className="font-medium">{region.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">サイトなし:</span>
                    <span className="font-medium">{region.noWebsite.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">低品質:</span>
                    <span className="font-medium">{region.lowQuality.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 会社規模別分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            会社規模別分析
          </CardTitle>
          <CardDescription>従業員数別のウェブサイト品質傾向</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={companySizeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ size, percentage }) => `${size}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {companySizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            <div className="space-y-4">
              {companySizeData.map((data, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{data.size}</span>
                    <Badge variant={data.averageScore >= 3.0 ? "default" : "secondary"}>
                      平均 {data.averageScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{data.count.toLocaleString()}社</span>
                    <span>{data.percentage}%</span>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* トレンド分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            トレンド分析
          </CardTitle>
          <CardDescription>過去6ヶ月間の分析データ推移</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="totalAnalyzed" 
                  stroke="var(--color-total)" 
                  strokeWidth={2}
                  name="分析企業数"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="noWebsiteRate" 
                  stroke="var(--color-noWebsite)" 
                  strokeWidth={2}
                  name="サイトなし率(%)"
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="var(--color-averageScore)" 
                  strokeWidth={2}
                  name="平均スコア"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* キーインサイト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            キーインサイト
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-900 mb-2">地域特性</h4>
              <p className="text-sm text-blue-800">
                神奈川県が最も高い平均スコア（3.1）を記録。首都圏の企業はウェブサイト品質が高い傾向。
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-green-900 mb-2">規模による差</h4>
              <p className="text-sm text-green-800">
                大規模企業（51名以上）の平均スコアは3.4と高く、小規模企業は2.1と大きな改善余地あり。
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-semibold text-orange-900 mb-2">市場機会</h4>
              <p className="text-sm text-orange-800">
                小規模企業が全体の56.8%を占め、サイトなし企業が多いため、大きな営業機会が存在。
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-900 mb-2">改善トレンド</h4>
              <p className="text-sm text-purple-800">
                サイトなし企業の割合は6ヶ月で25.3%→22.1%と減少傾向。市場は徐々に改善している。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedAnalytics;
