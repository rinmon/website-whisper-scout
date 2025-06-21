
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock, Play, Trash2, RotateCcw, Pause, Activity } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";
import { useBusinessData } from "@/hooks/useBusinessData";
import type { ProgressCallback } from "@/services/businessDataService";

interface DataSourceStatusProps {
  onRefresh: () => void;
  onDataFetched?: (data: any[]) => void;
}

const DataSourceStatus = ({ onRefresh, onDataFetched }: DataSourceStatusProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [fetchResults, setFetchResults] = useState<{ total: number; time: string } | null>(null);
  const [backgroundStatus, setBackgroundStatus] = useState<any>(null);
  
  const { clearAllData, removeSampleData, getDataStats } = useBusinessData();
  const dataSources = BusinessDataService.getAvailableDataSources();
  const dataStats = getDataStats();

  // バックグラウンド処理の状況を定期的に更新
  useEffect(() => {
    const updateBackgroundStatus = () => {
      const bgStatus = BusinessDataService.getBackgroundFetchStatus();
      setBackgroundStatus(bgStatus);
    };

    updateBackgroundStatus();
    const interval = setInterval(updateBackgroundStatus, 3000); // 3秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  const handleManualFetch = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentStatus('全国対応データ取得を開始...');
    setFetchResults(null);
    
    const startTime = Date.now();

    const progressCallback: ProgressCallback = (status: string, current: number, total: number) => {
      setCurrentStatus(status);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    };

    try {
      const businesses = await BusinessDataService.fetchFromOpenSourcesWithProgress(progressCallback);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      setFetchResults({
        total: businesses.length,
        time: `${duration}秒`
      });
      
      setCurrentStatus('優先ソース取得完了！バックグラウンド処理中...');
      
      if (onDataFetched) {
        onDataFetched(businesses);
      }
      
      onRefresh();
      
    } catch (error) {
      console.error('データ取得エラー:', error);
      setCurrentStatus('データ取得に失敗しました');
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentStatus('');
      }, 3000);
    }
  };

  const handleStopBackground = () => {
    BusinessDataService.stopBackgroundFetch();
    setCurrentStatus('バックグラウンド処理を停止しました');
    setTimeout(() => setCurrentStatus(''), 2000);
  };

  const handleClearAllData = async () => {
    if (confirm('すべての蓄積データを削除しますか？この操作は取り消せません。')) {
      setCurrentStatus('データを削除中...');
      try {
        await clearAllData();
        setCurrentStatus('すべてのデータを削除しました');
        onRefresh();
      } catch (error) {
        console.error('データ削除エラー:', error);
        setCurrentStatus('データ削除に失敗しました');
      }
      setTimeout(() => setCurrentStatus(''), 2000);
    }
  };

  const handleClearUrlHistory = () => {
    if (confirm('URL履歴をクリアしますか？次回取得時に全URLを再取得します。')) {
      BusinessDataService.clearUrlHistory();
      setCurrentStatus('URL履歴をクリアしました');
      setTimeout(() => setCurrentStatus(''), 2000);
    }
  };

  const handleRemoveSampleData = () => {
    if (confirm('サンプルデータのみを削除しますか？')) {
      setCurrentStatus('サンプルデータを削除中...');
      try {
        removeSampleData();
        setCurrentStatus('サンプルデータを削除しました');
        onRefresh();
      } catch (error) {
        console.error('サンプルデータ削除エラー:', error);
        setCurrentStatus('サンプルデータ削除に失敗しました');
      }
      setTimeout(() => setCurrentStatus(''), 2000);
    }
  };

  const getStatusIcon = (type: string, enabled: boolean = true) => {
    if (!enabled) return <Clock className="h-4 w-4 text-gray-400" />;
    
    switch (type) {
      case 'api':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scrape':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'csv':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (type: string, enabled: boolean = true) => {
    if (!enabled) return <Badge variant="outline">無効</Badge>;
    
    switch (type) {
      case 'api':
        return <Badge variant="default">API接続</Badge>;
      case 'scrape':
        return <Badge variant="secondary">スクレイピング</Badge>;
      case 'csv':
        return <Badge variant="outline">CSV取得</Badge>;
      default:
        return <Badge variant="outline">未実装</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              データソース状況（全国対応）
            </CardTitle>
            <CardDescription>
              全国47都道府県対応 • 蓄積データ: {dataStats.totalCount}社
              {backgroundStatus?.isRunning && " • バックグラウンド処理中"}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualFetch}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isRunning ? '取得中...' : '優先取得'}
            </Button>
            {backgroundStatus?.isRunning && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStopBackground}
              >
                <Pause className="mr-2 h-4 w-4" />
                BG停止
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRemoveSampleData}
              disabled={isRunning}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              サンプル削除
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearUrlHistory}
              disabled={isRunning}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              履歴クリア
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAllData}
              disabled={isRunning}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              全削除
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 進捗表示 */}
          {isRunning && (
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center mb-2">
                <RefreshCw className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
                <span className="text-sm font-medium text-blue-900">
                  {currentStatus}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-blue-800 mt-1">
                {progress.toFixed(0)}% 完了
              </p>
            </div>
          )}

          {/* バックグラウンド処理状況 */}
          {backgroundStatus?.isRunning && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center mb-2">
                <Activity className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  バックグラウンド処理中 - 地方都市データ取得
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
          )}

          {/* 状況メッセージ表示 */}
          {currentStatus && !isRunning && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  {currentStatus}
                </span>
              </div>
            </div>
          )}

          {/* 取得結果表示 */}
          {fetchResults && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  優先取得完了: {fetchResults.total}社のデータを{fetchResults.time}で取得
                </span>
              </div>
            </div>
          )}

          {/* データソース一覧（優先度上位5つを表示） */}
          {dataSources.slice(0, 5).map((source, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(source.type, source.enabled)}
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground">
                    優先度 {source.priority} • {source.maxPages}ページ
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(source.type, source.enabled)}
              </div>
            </div>
          ))}
          
          {/* その他のソース情報 */}
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center">
              <Database className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                全国対応実装完了
              </span>
            </div>
            <p className="text-xs text-blue-800 mt-1">
              優先ソース5件＋地方都市{dataSources.length - 5}件をバックグラウンド処理中。
              47都道府県から企業データを自動取得します。
            </p>
          </div>

          {/* エラー表示 */}
          {backgroundStatus?.errors && backgroundStatus.errors.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-900">
                  バックグラウンド処理エラー
                </span>
              </div>
              <div className="text-xs text-red-800 space-y-1">
                {backgroundStatus.errors.slice(-3).map((error: string, i: number) => (
                  <div key={i}>• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceStatus;
