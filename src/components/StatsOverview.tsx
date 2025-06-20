
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Building, Globe, AlertTriangle } from "lucide-react";

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

interface StatsOverviewProps {
  businesses: Business[];
}

const StatsOverview = ({ businesses }: StatsOverviewProps) => {
  // 統計計算
  const totalBusinesses = businesses.length;
  const withWebsite = businesses.filter(b => b.has_website).length;
  const withoutWebsite = totalBusinesses - withWebsite;
  const lowQuality = businesses.filter(b => b.has_website && b.overall_score < 2.5).length;
  const mediumQuality = businesses.filter(b => b.has_website && b.overall_score >= 2.5 && b.overall_score < 3.5).length;
  const highQuality = businesses.filter(b => b.has_website && b.overall_score >= 3.5).length;
  
  const avgScore = withWebsite > 0 ? 
    businesses.filter(b => b.has_website).reduce((sum, b) => sum + b.overall_score, 0) / withWebsite : 0;

  const businessOpportunities = withoutWebsite + lowQuality;
  const opportunityRate = totalBusinesses > 0 ? (businessOpportunities / totalBusinesses) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総企業数</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBusinesses.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            登録済み企業
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">サイト保有率</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalBusinesses > 0 ? Math.round((withWebsite / totalBusinesses) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            {withWebsite}/{totalBusinesses} 企業
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均品質スコア</CardTitle>
          {avgScore >= 3.0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            サイト保有企業の平均
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ビジネスチャンス</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {opportunityRate.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            改善余地のある企業
          </p>
        </CardContent>
      </Card>

      {/* 品質分布 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">品質分布</CardTitle>
          <CardDescription>サイト保有企業のスコア分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-sm">低品質 (2.5未満)</span>
              </div>
              <Badge variant="destructive">{lowQuality}社</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                <span className="text-sm">中品質 (2.5-3.5)</span>
              </div>
              <Badge variant="secondary">{mediumQuality}社</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-sm">高品質 (3.5以上)</span>
              </div>
              <Badge variant="default">{highQuality}社</Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
                <span className="text-sm">サイトなし</span>
              </div>
              <Badge variant="outline">{withoutWebsite}社</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 業界別分布 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">業界別分布</CardTitle>
          <CardDescription>登録企業の業界内訳</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              businesses.reduce((acc, business) => {
                acc[business.industry] = (acc[business.industry] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([industry, count]) => (
              <div key={industry} className="flex items-center justify-between">
                <span className="text-sm">{industry}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / totalBusinesses) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline">{count}社</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;
