
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle, AlertCircle, Activity, Settings, ExternalLink, LogOut } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface DataSourceStatusProps {
  onRefresh: () => void;
  onDataFetched?: (data: any[]) => void;
}

const DataSourceStatus = ({ onRefresh }: DataSourceStatusProps) => {
  const [backgroundStatus, setBackgroundStatus] = useState<any>(null);
  const [dataStats, setDataStats] = useState<any>({ totalCount: 0 });
  
  const { getDataStats } = useBusinessData();
  const { user, signOut } = useAuth();

  // データ統計を取得
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getDataStats();
      setDataStats(stats);
    };
    
    if (user) {
      loadStats();
    }
  }, [user]);

  // バックグラウンド処理の状況を定期的に更新
  useEffect(() => {
    const updateBackgroundStatus = () => {
      const bgStatus = BusinessDataService.getBackgroundFetchStatus();
      setBackgroundStatus(bgStatus);
    };

    updateBackgroundStatus();
    const interval = setInterval(updateBackgroundStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              データ同期状況
              {user && (
                <Badge variant="outline" className="ml-2">
                  {user.email}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              蓄積データ: {dataStats.totalCount}社
              {backgroundStatus?.isRunning && " • 自動取得中"}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Link to="/data-sources">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                詳細管理
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* バックグラウンド処理状況 */}
          {backgroundStatus?.isRunning ? (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center mb-2">
                <Activity className="h-4 w-4 text-green-500 mr-2 animate-pulse" />
                <span className="text-sm font-medium text-green-900">
                  全国データ自動取得中
                </span>
              </div>
              <Progress 
                value={backgroundStatus.totalSources > 0 ? 
                  (backgroundStatus.completedSources / backgroundStatus.totalSources) * 100 : 0} 
                className="h-2" 
              />
              <p className="text-xs text-green-800 mt-1">
                {backgroundStatus.completedSources} / {backgroundStatus.totalSources} 都道府県完了
                <span className="ml-2">
                  最終更新: {new Date(backgroundStatus.lastUpdate).toLocaleTimeString()}
                </span>
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  データ同期完了 - Supabase連携済み
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-1">
                全国47都道府県のデータソースが利用可能です
              </p>
            </div>
          )}

          {/* 主要データソース状況（簡易表示） */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['東京', '大阪', '愛知', '神奈川', '福岡'].map((region, index) => (
              <div key={region} className="flex items-center justify-between p-2 border rounded">
                <span className="text-xs font-medium">{region}</span>
                <CheckCircle className="h-3 w-3 text-green-500" />
              </div>
            ))}
          </div>

          {/* エラー表示 */}
          {backgroundStatus?.errors && backgroundStatus.errors.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-900">
                  一部エラーが発生
                </span>
              </div>
              <div className="text-xs text-red-800">
                詳細管理ページで確認してください
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceStatus;
