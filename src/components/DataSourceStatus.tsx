
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock, Play } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";
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
  
  const dataSources = BusinessDataService.getAvailableDataSources();

  const handleManualFetch = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentStatus('データ取得を開始...');
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
      
      setCurrentStatus('データ取得完了！');
      
      // 親コンポーネントに結果を通知
      if (onDataFetched) {
        onDataFetched(businesses);
      }
      
      // 既存のリフレッシュ機能も呼び出し
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
              データソース状況
            </CardTitle>
            <CardDescription>企業データの取得元と状況</CardDescription>
          </div>
          <div className="flex gap-2">
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
              {isRunning ? '取得中...' : '手動取得'}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRunning}>
              <RefreshCw className="mr-2 h-4 w-4" />
              更新
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

          {/* 取得結果表示 */}
          {fetchResults && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-900">
                  取得完了: {fetchResults.total}社のデータを{fetchResults.time}で取得
                </span>
              </div>
            </div>
          )}

          {/* データソース一覧 */}
          {dataSources.map((source, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(source.type, source.enabled)}
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground">{source.url}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(source.type, source.enabled)}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-900">
                実装状況
              </span>
            </div>
            <p className="text-xs text-yellow-800 mt-1">
              現在は模擬データで動作テスト中。実際のデータソース接続は段階的に実装予定
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceStatus;
