
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Users, Building } from "lucide-react";

interface AnalysisData {
  prefecture: string;
  totalCompanies: number;
  withWebsite: number;
  avgScore: number;
  topIndustry: string;
}

interface CrossPrefectureAnalysisProps {
  selectedPrefectures: string[];
  analysisData: AnalysisData[];
}

const CrossPrefectureAnalysis = ({ selectedPrefectures, analysisData }: CrossPrefectureAnalysisProps) => {
  const totalCompanies = analysisData.reduce((sum, data) => sum + data.totalCompanies, 0);
  const totalWithWebsite = analysisData.reduce((sum, data) => sum + data.withWebsite, 0);
  const avgOverallScore = analysisData.length > 0 
    ? analysisData.reduce((sum, data) => sum + data.avgScore, 0) / analysisData.length 
    : 0;

  const industryDistribution = analysisData.reduce((acc, data) => {
    acc[data.topIndustry] = (acc[data.topIndustry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topIndustries = Object.entries(industryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (selectedPrefectures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            クロス都道府県分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            都道府県を選択すると分析結果を表示します
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 全体サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            選択地域サマリー ({selectedPrefectures.length}都道府県)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalCompanies.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">総企業数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalWithWebsite.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">WEBサイト保有</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{avgOverallScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">平均スコア</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalCompanies > 0 ? ((totalWithWebsite / totalCompanies) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">WEB普及率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 都道府県別詳細 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            都道府県別詳細
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisData.map((data) => (
              <div key={data.prefecture} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{data.prefecture}</h4>
                  <Badge variant="secondary">{data.topIndustry}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">企業数</div>
                    <div className="font-medium">{data.totalCompanies.toLocaleString()}社</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">WEBサイト</div>
                    <div className="font-medium">{data.withWebsite.toLocaleString()}社</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">平均スコア</div>
                    <div className="font-medium">{data.avgScore.toFixed(1)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>WEB普及率</span>
                    <span>{((data.withWebsite / data.totalCompanies) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(data.withWebsite / data.totalCompanies) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 業界分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            主要業界分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topIndustries.map(([industry, count]) => (
              <div key={industry} className="flex items-center justify-between">
                <span className="text-sm">{industry}</span>
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={(count / selectedPrefectures.length) * 100} 
                    className="h-2 w-20" 
                  />
                  <span className="text-sm font-medium w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossPrefectureAnalysis;
