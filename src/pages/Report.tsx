import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import ReportFilters from "@/components/ReportFilters";
import DetailedAnalytics from "@/components/DetailedAnalytics";
import SalesProposalGenerator from "@/components/SalesProposalGenerator";
import { ArrowLeft, Download, Share2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    industries: [],
    regions: [],
    scoreRange: [0, 5] as [number, number],
    companySize: [],
    hasWebsite: "all"
  });

  const handleLogout = () => {
    navigate("/");
  };

  const handleDownload = () => {
    toast({
      title: "レポートをダウンロード中",
      description: "PDFレポートの準備をしています...",
    });
  };

  const handleShare = () => {
    toast({
      title: "レポートを共有",
      description: "共有リンクをクリップボードにコピーしました",
    });
  };

  const handleExport = (format: string) => {
    toast({
      title: `${format.toUpperCase()}エクスポート開始`,
      description: `データを${format}形式でエクスポートしています...`,
    });
  };

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters);
    console.log("フィルター更新:", filters);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "レポート生成完了",
        description: "最新のデータでレポートが更新されました",
      });
    }, 3000);
  };

  // レポートデータ
  const reportData = {
    totalBusinesses: 15742,
    noWebsite: 3481,
    lowQuality: 6789,
    mediumQuality: 3847,
    highQuality: 1625,
    averageScore: 2.3,
    improvementRate: 12.5,
    generatedAt: "2024-06-19 14:30"
  };

  const opportunityAreas = [
    {
      category: "ウェブサイトなし企業",
      count: 3481,
      potential: "高",
      priority: 1,
      description: "ホームページ制作の直接的な営業機会"
    },
    {
      category: "技術力低スコア",
      count: 4521,
      potential: "中",
      priority: 2,
      description: "サイト改善・リニューアルの提案機会"
    },
    {
      category: "コンテンツ不足",
      count: 2847,
      potential: "中",
      priority: 3,
      description: "コンテンツマーケティング支援の機会"
    }
  ];

  const industryBreakdown = [
    { industry: "IT", total: 4521, noWebsite: 421, lowQuality: 1823 },
    { industry: "商業", total: 3847, noWebsite: 1247, lowQuality: 1521 },
    { industry: "製造業", total: 2951, noWebsite: 847, lowQuality: 1124 },
    { industry: "サービス業", total: 4423, noWebsite: 966, lowQuality: 2321 }
  ];

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              ダッシュボードに戻る
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ビジネスチャンス分析レポート
              </h1>
              <p className="text-muted-foreground">生成日時: {reportData.generatedAt}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="flex items-center"
            >
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF出力
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isGenerating ? "生成中..." : "最新データで更新"}
            </Button>
          </div>
        </div>

        {/* タブ式レイアウト */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              概要
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center">
              フィルター
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              詳細分析
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center">
              営業提案
            </TabsTrigger>
          </TabsList>

          {/* 概要タブ */}
          <TabsContent value="overview" className="space-y-6">
            {/* 概要統計 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">総企業数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.totalBusinesses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">分析対象企業</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">サイトなし企業</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reportData.noWebsite.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {((reportData.noWebsite / reportData.totalBusinesses) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">平均品質スコア</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{reportData.averageScore}</div>
                  <p className="text-xs text-muted-foreground">/ 5.0</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">改善余地企業</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{reportData.lowQuality.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">スコア2.5未満</p>
                </CardContent>
              </Card>
            </div>

            {/* 品質分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  ウェブサイト品質分布
                </CardTitle>
                <CardDescription>企業のウェブサイト品質レベル別分布</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded"></div>
                      <span className="text-sm">サイトなし</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{reportData.noWebsite.toLocaleString()}</span>
                      <Badge variant="secondary">{((reportData.noWebsite / reportData.totalBusinesses) * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={(reportData.noWebsite / reportData.totalBusinesses) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">低品質 (2.5未満)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{reportData.lowQuality.toLocaleString()}</span>
                      <Badge variant="destructive">{((reportData.lowQuality / reportData.totalBusinesses) * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={(reportData.lowQuality / reportData.totalBusinesses) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-sm">中品質 (2.5-3.5)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{reportData.mediumQuality.toLocaleString()}</span>
                      <Badge variant="secondary">{((reportData.mediumQuality / reportData.totalBusinesses) * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={(reportData.mediumQuality / reportData.totalBusinesses) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">高品質 (3.5以上)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{reportData.highQuality.toLocaleString()}</span>
                      <Badge variant="default">{((reportData.highQuality / reportData.totalBusinesses) * 100).toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={(reportData.highQuality / reportData.totalBusinesses) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* ビジネスチャンス分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  優先ビジネスチャンス
                </CardTitle>
                <CardDescription>営業機会の分析と優先度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunityAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={area.potential === "高" ? "destructive" : "secondary"}>
                            優先度 {area.priority}
                          </Badge>
                          <h3 className="font-semibold">{area.category}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{area.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{area.count.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">対象企業</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 業界別分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  業界別分析
                </CardTitle>
                <CardDescription>業界ごとのウェブサイト品質状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {industryBreakdown.map((industry, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{industry.industry}</h3>
                        <span className="text-sm text-muted-foreground">
                          総企業数: {industry.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-600">サイトなし:</span>
                          <span className="font-medium">{industry.noWebsite.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-600">低品質:</span>
                          <span className="font-medium">{industry.lowQuality.toLocaleString()}</span>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 推奨アクション */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  推奨アクション
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">サイトなし企業への直接営業</h4>
                      <p className="text-sm text-muted-foreground">
                        3,481社の企業がウェブサイトを持たないため、ホームページ制作の直接的な営業機会があります。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">低品質サイトの改善提案</h4>
                      <p className="text-sm text-muted-foreground">
                        6,789社が低品質スコアのため、サイトリニューアルや改善提案の機会があります。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">業界特化のアプローチ</h4>
                      <p className="text-sm text-muted-foreground">
                        商業・サービス業界でのサイトなし企業が特に多く、業界特化の営業戦略が効果的です。
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* フィルタータブ */}
          <TabsContent value="filters">
            <ReportFilters 
              onFiltersChange={handleFiltersChange}
              onExport={handleExport}
            />
          </TabsContent>

          {/* 詳細分析タブ */}
          <TabsContent value="analytics">
            <DetailedAnalytics />
          </TabsContent>

          {/* 営業提案タブ */}
          <TabsContent value="proposals">
            <SalesProposalGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Report;
