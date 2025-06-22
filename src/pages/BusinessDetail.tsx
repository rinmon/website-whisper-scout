import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Business } from "@/types/business";
import { WebsiteAnalysis } from "@/types/websiteAnalysis";
import { SupabaseBusinessService } from "@/services/supabase/business";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const BusinessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const fetchBusiness = async (businessId: string) => {
    setIsLoading(true);
    try {
      console.log('企業詳細を取得中:', businessId);
      const business = await SupabaseBusinessService.getBusinessById(businessId);
      if (business) {
        setBusiness(business);
        
        // website_analysisも取得
        const analysis = await SupabaseBusinessService.getWebsiteAnalysis(businessId);
        setWebsiteAnalysis(analysis);
      }
    } catch (error) {
      console.error('企業詳細取得エラー:', error);
      toast({
        title: "エラー",
        description: "企業情報の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // URLパラメータのidは文字列なので、そのまま使用
      const isValidId = typeof id === 'string' && id.trim() !== '';
      if (isValidId) {
        fetchBusiness(id);
      }
    }
  }, [id]);

  const handleAnalyze = async () => {
    if (!business?.website_url) {
      toast({
        title: "エラー",
        description: "ウェブサイトURLが見つかりません",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('ウェブサイト分析を開始:', business.website_url);
      
      // ここで実際の分析APIを呼び出す
      // 現在はモック分析結果を生成
      const mockAnalysis = {
        id: business.id,
        business_id: business.id,
        overall_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        technical_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        content_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        user_experience_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        seo_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        performance_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        accessibility_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        security_score: Math.round((Math.random() * 2 + 3) * 10) / 10,
        mobile_compatibility: Math.random() > 0.3,
        ssl_certificate: Math.random() > 0.2,
        page_speed: Math.round(Math.random() * 3000 + 1000),
        recommendations: [
          "モバイル対応の改善が必要です",
          "ページ読み込み速度の最適化をお勧めします",
          "SEOメタタグの追加を検討してください"
        ],
        analyzed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Supabaseに分析結果を保存
      await SupabaseBusinessService.saveWebsiteAnalysis(mockAnalysis);
      
      // 企業データも更新
      const updatedBusiness = {
        ...business,
        overall_score: mockAnalysis.overall_score,
        technical_score: mockAnalysis.technical_score,
        content_score: mockAnalysis.content_score,
        user_experience_score: mockAnalysis.user_experience_score,
        seo_score: mockAnalysis.seo_score,
        last_analyzed: mockAnalysis.analyzed_at
      };
      
      await SupabaseBusinessService.updateBusiness(business.id, updatedBusiness);
      
      setBusiness(updatedBusiness);
      setWebsiteAnalysis(mockAnalysis);
      
      toast({
        title: "分析完了",
        description: "ウェブサイトの分析が完了しました",
      });
    } catch (error) {
      console.error('分析エラー:', error);
      toast({
        title: "分析エラー",
        description: "ウェブサイトの分析に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <div className="font-medium">企業情報を取得中...</div>
                <div className="text-sm text-muted-foreground">
                  データベースから企業情報を取得しています
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!business) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="font-medium">企業情報が見つかりません</div>
              <div className="text-sm text-muted-foreground">
                指定されたIDの企業情報が存在しないか、アクセス権がありません
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const data = [
    { name: '全体スコア', value: business.overall_score || 0 },
    { name: '技術スコア', value: business.technical_score || 0 },
    { name: 'コンテンツスコア', value: business.content_score || 0 },
    { name: 'UXスコア', value: business.user_experience_score || 0 },
    { name: 'SEOスコア', value: business.seo_score || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {business.name}
            </h1>
            <p className="text-muted-foreground">
              {business.catch_copy || "キャッチコピーが設定されていません"}
            </p>
          </div>
          <div className="flex gap-2">
            {business.is_new && (
              <Badge variant="secondary" className="px-3 py-1">
                新規企業
              </Badge>
            )}
            {business.has_website ? (
              <Badge variant="outline" className="px-3 py-1">
                ウェブサイトあり
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-3 py-1">
                ウェブサイトなし
              </Badge>
            )}
          </div>
        </div>

        {/* 企業情報 */}
        <Card>
          <CardHeader>
            <CardTitle>企業情報</CardTitle>
            <CardDescription>
              基本情報と連絡先
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-bold">会社名</div>
              <div className="text-muted-foreground">{business.name}</div>
            </div>
            <div>
              <div className="text-sm font-bold">所在地</div>
              <div className="text-muted-foreground">{business.address || "未登録"}</div>
            </div>
            <div>
              <div className="text-sm font-bold">電話番号</div>
              <div className="text-muted-foreground">{business.phone_number || "未登録"}</div>
            </div>
            <div>
              <div className="text-sm font-bold">ウェブサイト</div>
              {business.website_url ? (
                <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {business.website_url}
                </a>
              ) : (
                <div className="text-muted-foreground">未登録</div>
              )}
            </div>
            <div>
              <div className="text-sm font-bold">設立日</div>
              <div className="text-muted-foreground">{business.establishment_date || "未登録"}</div>
            </div>
            <div>
              <div className="text-sm font-bold">従業員数</div>
              <div className="text-muted-foreground">{business.number_of_employees || "未登録"}</div>
            </div>
          </CardContent>
        </Card>

        {/* スコア */}
        <Card>
          <CardHeader>
            <CardTitle>ウェブサイト分析</CardTitle>
            <CardDescription>
              AIによるウェブサイトの自動評価
            </CardDescription>
          </CardHeader>
          <CardContent>
            {websiteAnalysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-bold">全体スコア</div>
                    <div className="text-2xl font-semibold">{websiteAnalysis.overall_score}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">最終分析日</div>
                    <div className="text-muted-foreground">{new Date(websiteAnalysis.analyzed_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-sm text-muted-foreground">
                  {websiteAnalysis.recommendations?.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-muted-foreground">
                  まだウェブサイトの分析が行われていません
                </div>
              </div>
            )}
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !business.website_url}
            >
              {isAnalyzing ? "分析中..." : "ウェブサイトを分析する"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BusinessDetail;
