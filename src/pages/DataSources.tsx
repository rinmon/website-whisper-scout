import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock, Play, Trash2, RotateCcw, Pause, Activity, MapPin } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";
import { useBusinessData } from "@/hooks/useBusinessData";
import DashboardLayout from "@/components/DashboardLayout";
import JapanMap from "@/components/JapanMap";
import EStatApiConfig from "@/components/EStatApiConfig";
import DataSourceSelector from "@/components/DataSourceSelector";
import type { ProgressCallback } from "@/services/businessDataService";

const DataSources = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [fetchResults, setFetchResults] = useState<{ total: number; time: string } | null>(null);
  const [backgroundStatus, setBackgroundStatus] = useState<any>(null);
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [selectedDataSourceGroup, setSelectedDataSourceGroup] = useState<string>('all');
  
  const { clearAllData, removeSampleData, removeGitHubData, getDataStats, refreshData, getPrefectureStats } = useBusinessData();
  const dataSources = BusinessDataService.getAvailableDataSources();
  const dataStats = getDataStats();
  const prefectureStats = getPrefectureStats();

  // データソースグループの定義
  const dataSourceGroups = [
    { value: 'all', label: '全データソース' },
    { value: 'chamber', label: '商工会議所' },
    { value: 'github', label: 'GitHub組織' },
    { value: 'estat', label: 'e-Stat API' },
    { value: 'priority', label: '優先度高' }
  ];

  // バックグラウンド処理の状況を定期的に更新
  useEffect(() => {
    const updateBackgroundStatus = () => {
      const bgStatus = BusinessDataService.getBackgroundFetchStatus();
      setBackgroundStatus(bgStatus);
    };

    updateBackgroundStatus();
    const interval = setInterval(updateBackgroundStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // 都道府県選択ハンドラー
  const handlePrefectureSelect = (prefecture: string) => {
    setSelectedPrefectures(prev => 
      prev.includes(prefecture) 
        ? prev.filter(p => p !== prefecture)
        : [...prev, prefecture]
    );
  };

  const handleFullDataFetch = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentStatus(`${getSelectedGroupLabel()}の詳細取得を開始...`);
    setFetchResults(null);
    
    const startTime = Date.now();

    const progressCallback: ProgressCallback = (status: string, current: number, total: number) => {
      setCurrentStatus(status);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    };

    try {
      let businesses;
      
      // 選択されたグループに応じて取得方法を変更
      switch (selectedDataSourceGroup) {
        case 'chamber':
          businesses = await BusinessDataService.fetchByGroup('chamber', progressCallback);
          break;
        case 'github':
          businesses = await BusinessDataService.fetchByGroup('github', progressCallback);
          break;
        case 'estat':
          businesses = await BusinessDataService.fetchByGroup('estat', progressCallback);
          break;
        case 'priority':
          businesses = await BusinessDataService.fetchByGroup('priority', progressCallback);
          break;
        default:
          businesses = await BusinessDataService.fetchFromOpenSourcesWithProgress(progressCallback);
      }
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      setFetchResults({
        total: businesses.length,
        time: `${duration}秒`
      });
      
      setCurrentStatus(`${getSelectedGroupLabel()}取得完了！継続的バックグラウンド処理中...`);
      refreshData();
      
    } catch (error) {
      console.error('データ取得エラー:', error);
      setCurrentStatus('データ取得に失敗しました');
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentStatus('');
      }, 5000);
    }
  };

  const getSelectedGroupLabel = () => {
    const dataSourceGroups = [
      { value: 'all', label: '全データソース' },
      { value: 'chamber', label: '商工会議所' },
      { value: 'github', label: 'GitHub組織' },
      { value: 'estat', label: 'e-Stat API' },
      { value: 'priority', label: '優先度高' }
    ];
    const group = dataSourceGroups.find(g => g.value === selectedDataSourceGroup);
    return group ? group.label : '全データソース';
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
        refreshData();
      } catch (error) {
        console.error('データ削除エラー:', error);
        setCurrentStatus('データ削除に失敗しました');
      }
      setTimeout(() => setCurrentStatus(''), 2000);
    }
  };

  const handleRemoveSampleData = () => {
    if (confirm('サンプルデータのみを削除しますか？')) {
      setCurrentStatus('サンプルデータを削除中...');
      try {
        removeSampleData();
        setCurrentStatus('サンプルデータを削除しました');
        refreshData();
      } catch (error) {
        console.error('サンプルデータ削除エラー:', error);
        setCurrentStatus('サンプルデータ削除に失敗しました');
      }
      setTimeout(() => setCurrentStatus(''), 2000);
    }
  };

  const handleRemoveGitHubData = () => {
    if (confirm('GitHub組織検索で取得したサンプルデータを削除しますか？')) {
      setCurrentStatus('GitHubサンプルデータを削除中...');
      try {
        removeGitHubData();
        setCurrentStatus('GitHubサンプルデータを削除しました');
        refreshData();
      } catch (error) {
        console.error('GitHubデータ削除エラー:', error);
        setCurrentStatus('GitHubデータ削除に失敗しました');
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

  const getPriorityColor = (priority: number) => {
    if (priority <= 5) return 'bg-green-100 border-green-300';
    if (priority <= 10) return 'bg-blue-100 border-blue-300';
    return 'bg-gray-100 border-gray-300';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">データソース管理</h1>
            <p className="text-muted-foreground">
              全国47都道府県のデータソース設定と取得状況
            </p>
          </div>
        </div>

        {/* 改善されたデータソース選択UI */}
        <DataSourceSelector
          selectedGroup={selectedDataSourceGroup}
          onGroupSelect={setSelectedDataSourceGroup}
          onStartFetch={handleFullDataFetch}
          isRunning={isRunning}
        />

        {/* 日本地図セクション */}
        <JapanMap
          selectedPrefectures={selectedPrefectures}
          onPrefectureSelect={handlePrefectureSelect}
          businessData={Object.fromEntries(
            Object.entries(prefectureStats).map(([pref, stats]) => [pref, stats.total])
          )}
        />

        {/* e-Stat API設定 */}
        <EStatApiConfig />

        {/* 進捗とステータス */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              取得状況
            </CardTitle>
            <CardDescription>
              蓄積データ: {dataStats.totalCount}社
              {backgroundStatus?.isRunning && " • バックグラウンド処理中"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      バックグラウンド処理中 - 地方都市データ取得
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStopBackground}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    停止
                  </Button>
                </div>
                <Progress 
                  value={backgroundStatus.totalSources > 0 ? 
                    (backgroundStatus.completedSources / backgroundStatus.totalSources) * 100 : 0} 
                  className="h-2" 
                />
                <p className="text-xs text-green-800 mt-1">
                  {backgroundStatus.completedSources} / {backgroundStatus.totalSources} 都道府県完了
                </p>
              </div>
            )}

            {/* 管理ボタン */}
            <div className="flex gap-2 flex-wrap">
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
                onClick={handleRemoveGitHubData}
                disabled={isRunning}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                GitHub削除
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
          </CardContent>
        </Card>

        {/* 全データソース一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              全国データソース一覧（{dataSources.length}件）
            </CardTitle>
            <CardDescription>
              全47都道府県対応のデータソース設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataSources.map((source, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${getPriorityColor(source.priority)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(source.type, source.enabled)}
                      <div className="text-sm font-medium">{source.name}</div>
                    </div>
                    {getStatusBadge(source.type, source.enabled)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>優先度: {source.priority}</div>
                    <div>最大ページ: {source.maxPages || 1}</div>
                    <div>1ページ件数: {source.perPage || 100}</div>
                    <div className="truncate">{source.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataSources;
