import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";
import StatsOverview from "@/components/StatsOverview";
import ScoreDistributionChart from "@/components/ScoreDistributionChart";
import DataSourceStatus from "@/components/DataSourceStatus";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessData } from "@/hooks/useBusinessData";
import { Business } from "@/types/business";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { businesses, isLoading, error, refreshData } = useBusinessData();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "ログアウトしました",
      description: "ご利用ありがとうございました",
    });
  };

  // 手動データ取得の結果を処理
  const handleDataFetched = (newData: Business[]) => {
    console.log('データ取得完了:', newData);
    toast({
      title: "データ取得完了",
      description: `${newData.length}社の企業データを取得しました`,
    });
    // データが更新されたのでリフレッシュ
    refreshData();
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "データ取得エラー",
        description: "企業データの取得に失敗しました",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (!user) {
    return <LoginForm onLogin={() => {}} />;
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              クソサイト・スカウター
            </h1>
            <p className="text-muted-foreground">ビジネスチャンスを発見しよう</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {businesses.length} 件の企業
            </Badge>
            {isLoading && (
              <Badge variant="secondary" className="px-3 py-1">
                データ取得中...
              </Badge>
            )}
          </div>
        </div>

        {/* データソース状況 */}
        <DataSourceStatus onRefresh={refreshData} onDataFetched={handleDataFetched} />

        {/* 統計概要 */}
        <StatsOverview businesses={businesses} />

        {/* チャート */}
        <ScoreDistributionChart businesses={businesses} />

        {/* アクションエリア */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 企業一覧
              </CardTitle>
              <CardDescription>
                登録済み企業の詳細情報を確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  • 詳細な企業情報
                  <br />
                  • フィルタリング機能
                  <br />
                  • ページネーション
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => navigate("/businesses")}
                  disabled={isLoading}
                >
                  企業一覧を見る
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 レポート生成
              </CardTitle>
              <CardDescription>
                分析結果をレポート形式で出力
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  • 詳細分析レポート
                  <br />
                  • PDF・Excel出力
                  <br />
                  • カスタムフィルター
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/report")}
                  disabled={isLoading}
                >
                  レポート生成
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ 設定
              </CardTitle>
              <CardDescription>
                アプリケーション設定の管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  • データソース設定
                  <br />
                  • 分析パラメータ
                  <br />
                  • アカウント管理
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/settings")}
                >
                  設定を開く
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* クイック統計 */}
        <Card>
          <CardHeader>
            <CardTitle>クイック統計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {businesses.filter(b => !b.has_website).length}
                </div>
                <div className="text-sm text-muted-foreground">サイトなし企業</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {businesses.filter(b => b.has_website && (b.overall_score || 0) < 2.5).length}
                </div>
                <div className="text-sm text-muted-foreground">低品質サイト</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {businesses.filter(b => b.has_website && (b.overall_score || 0) >= 2.5 && (b.overall_score || 0) < 3.5).length}
                </div>
                <div className="text-sm text-muted-foreground">改善の余地あり</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {businesses.filter(b => b.is_new).length}
                </div>
                <div className="text-sm text-muted-foreground">新規取得企業</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ローディング状態 */}
        {isLoading && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <div className="font-medium">企業データを取得中...</div>
                  <div className="text-sm text-muted-foreground">
                    オープンデータソースから最新の企業情報を取得しています
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Index;
