
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Monitor, Smartphone, Shield, Zap, Search, Globe } from "lucide-react";

interface TechnicalData {
  performance: {
    loading_speed: number;
    mobile_score: number;
    desktop_score: number;
  };
  seo: {
    meta_tags: boolean;
    structured_data: boolean;
    sitemap: boolean;
    ssl: boolean;
  };
  accessibility: {
    score: number;
    issues: string[];
  };
}

interface TechnicalDetailsProps {
  businessId: number;
}

const TechnicalDetails = ({ businessId }: TechnicalDetailsProps) => {
  // モックデータ - 実際にはAPIから取得
  const mockTechnicalData: TechnicalData = {
    performance: {
      loading_speed: businessId === 1 ? 2.3 : businessId === 3 ? 1.1 : 0,
      mobile_score: businessId === 1 ? 72 : businessId === 3 ? 95 : 0,
      desktop_score: businessId === 1 ? 85 : businessId === 3 ? 98 : 0,
    },
    seo: {
      meta_tags: businessId !== 2,
      structured_data: businessId === 3,
      sitemap: businessId !== 2,
      ssl: businessId !== 2,
    },
    accessibility: {
      score: businessId === 1 ? 78 : businessId === 3 ? 92 : 0,
      issues: businessId === 1 ? ["色のコントラスト不足", "alt属性の不備"] : 
              businessId === 3 ? [] : ["データなし"]
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSpeedRating = (speed: number) => {
    if (speed <= 1.5) return { label: "高速", color: "default" };
    if (speed <= 3.0) return { label: "普通", color: "secondary" };
    return { label: "低速", color: "destructive" };
  };

  const speedRating = getSpeedRating(mockTechnicalData.performance.loading_speed);

  return (
    <div className="space-y-6">
      {/* パフォーマンス */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            パフォーマンス
          </CardTitle>
          <CardDescription>サイト速度とユーザー体験指標</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Globe className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{mockTechnicalData.performance.loading_speed}s</div>
              <div className="text-sm text-gray-600">読み込み時間</div>
              <Badge variant={speedRating.color as any} className="mt-1">
                {speedRating.label}
              </Badge>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Smartphone className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <div className={`text-2xl font-bold ${getPerformanceColor(mockTechnicalData.performance.mobile_score)}`}>
                {mockTechnicalData.performance.mobile_score}
              </div>
              <div className="text-sm text-gray-600">モバイルスコア</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Monitor className="mx-auto h-8 w-8 text-purple-500 mb-2" />
              <div className={`text-2xl font-bold ${getPerformanceColor(mockTechnicalData.performance.desktop_score)}`}>
                {mockTechnicalData.performance.desktop_score}
              </div>
              <div className="text-sm text-gray-600">デスクトップスコア</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            SEO対策状況
          </CardTitle>
          <CardDescription>検索エンジン最適化の実装状況</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mockTechnicalData.seo.meta_tags ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">メタタグ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mockTechnicalData.seo.structured_data ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">構造化データ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mockTechnicalData.seo.sitemap ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">サイトマップ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${mockTechnicalData.seo.ssl ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">SSL証明書</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクセシビリティ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            アクセシビリティ
          </CardTitle>
          <CardDescription>ウェブアクセシビリティの評価</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">総合スコア</span>
              <span className={`text-sm font-bold ${getPerformanceColor(mockTechnicalData.accessibility.score)}`}>
                {mockTechnicalData.accessibility.score}/100
              </span>
            </div>
            <Progress value={mockTechnicalData.accessibility.score} className="h-3" />
          </div>
          {mockTechnicalData.accessibility.issues.length > 0 && mockTechnicalData.accessibility.issues[0] !== "データなし" && (
            <div>
              <p className="text-sm font-medium mb-2">改善が必要な項目:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {mockTechnicalData.accessibility.issues.map((issue, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalDetails;
