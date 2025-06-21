import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import ScoreHistoryChart from "@/components/ScoreHistoryChart";
import ImprovementRecommendations from "@/components/ImprovementRecommendations";
import TechnicalDetails from "@/components/TechnicalDetails";
import CompetitorComparison from "@/components/CompetitorComparison";
import { ArrowLeft, ExternalLink, Globe, Shield, Zap, FileText, TrendingUp, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessData } from "@/hooks/useBusinessData";

// モック履歴データ
const mockHistoryData = [
  { date: "2024-01", overall_score: 1.8, technical_score: 1.5, eeat_score: 2.2, content_score: 1.6 },
  { date: "2024-02", overall_score: 1.9, technical_score: 1.6, eeat_score: 2.3, content_score: 1.7 },
  { date: "2024-03", overall_score: 2.0, technical_score: 1.7, eeat_score: 2.4, content_score: 1.8 },
  { date: "2024-04", overall_score: 2.1, technical_score: 1.8, eeat_score: 2.5, content_score: 1.9 },
];

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { businesses } = useBusinessData();
  
  // 蓄積された実際のデータから企業を検索
  const business = businesses.find(b => b.id === parseInt(id || "0"));

  if (!business) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">企業が見つかりません</h1>
          <Button onClick={() => navigate("/businesses")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            企業一覧に戻る
          </Button>
        </div>
      </DashboardLayout>
    );
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "ログアウトしました",
      description: "ご利用ありがとうございました",
    });
    navigate("/");
  };

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-green-600";
    if (score >= 2.5) return "text-yellow-600";
    if (score > 0) return "text-red-600";
    return "text-gray-500";
  };

  const getAIContentBadge = (aiScore: number | null) => {
    if (aiScore === null) return null;
    if (aiScore >= 0.7) return <Badge variant="destructive">AI生成疑い</Badge>;
    if (aiScore >= 0.3) return <Badge variant="secondary">AI混合</Badge>;
    return <Badge variant="default">人間作成</Badge>;
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate("/businesses")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              企業一覧に戻る
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-muted-foreground">{business.industry} • {business.location}</p>
            </div>
          </div>
          {business.has_website && (
            <Button variant="outline" asChild>
              <a href={business.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                サイトを開く
              </a>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左側: 企業基本情報 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  企業情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">設立年:</span>
                    <span className="text-sm font-medium">{business.established_year || '不明'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">従業員数:</span>
                    <span className="text-sm font-medium">{business.employee_count || '不明'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">業界:</span>
                    <Badge variant="outline">{business.industry}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">所在地:</span>
                    <span className="text-sm font-medium">{business.location}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-2">企業概要:</p>
                  <p className="text-sm">{business.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* 総合スコア（サイドバーに移動） */}
            {business.has_website && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    総合スコア
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(business.overall_score)}`}>
                      {business.overall_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">/ 5.0</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側: タブ形式の詳細情報 */}
          <div className="lg:col-span-3">
            {business.has_website ? (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">概要</TabsTrigger>
                  <TabsTrigger value="history">履歴</TabsTrigger>
                  <TabsTrigger value="technical">技術詳細</TabsTrigger>
                  <TabsTrigger value="improvements">改善提案</TabsTrigger>
                  <TabsTrigger value="competition">競合比較</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* 詳細スコア */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-5 w-5" />
                        詳細スコア
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">技術力スコア</span>
                          <span className={`text-sm font-bold ${getScoreColor(business.technical_score)}`}>
                            {business.technical_score.toFixed(1)}
                          </span>
                        </div>
                        <Progress value={business.technical_score * 20} className="h-3" />
                        <p className="text-xs text-gray-600 mt-1">
                          サイト速度、モバイル対応、セキュリティなどの技術的品質
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">信頼性 (E-E-A-T)</span>
                          <span className={`text-sm font-bold ${getScoreColor(business.eeat_score)}`}>
                            {business.eeat_score.toFixed(1)}
                          </span>
                        </div>
                        <Progress value={business.eeat_score * 20} className="h-3" />
                        <p className="text-xs text-gray-600 mt-1">
                          専門性、権威性、信頼性の評価
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">コンテンツ品質</span>
                          <span className={`text-sm font-bold ${getScoreColor(business.content_score)}`}>
                            {business.content_score.toFixed(1)}
                          </span>
                        </div>
                        <Progress value={business.content_score * 20} className="h-3" />
                        <p className="text-xs text-gray-600 mt-1">
                          情報の充実度、読みやすさ、有用性
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI分析結果 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        AI分析結果
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">コンテンツ判定:</span>
                        {getAIContentBadge(business.ai_content_score)}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        AIによるコンテンツ生成の可能性: {((business.ai_content_score || 0) * 100).toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <ScoreHistoryChart data={mockHistoryData} />
                </TabsContent>

                <TabsContent value="technical">
                  <TechnicalDetails businessId={business.id} />
                </TabsContent>

                <TabsContent value="improvements">
                  <ImprovementRecommendations businessScore={business.overall_score} />
                </TabsContent>

                <TabsContent value="competition">
                  <CompetitorComparison 
                    currentBusiness={{
                      name: business.name,
                      overall_score: business.overall_score,
                      industry: business.industry
                    }}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-red-500 text-xl font-bold mb-2">ウェブサイトなし</div>
                  <p className="text-gray-600 mb-4">
                    この企業はウェブサイトを持っていません。
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">提案チャンス！</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• ホームページ制作の提案</li>
                      <li>• デジタルマーケティング支援</li>
                      <li>• オンライン集客の改善</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDetail;
