
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock, Play, Trash2, Pause, Activity, MapPin } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";
import { CorporateDataService } from "@/services/corporateDataService";
import { useBusinessData } from "@/hooks/useBusinessData";
import DashboardLayout from "@/components/DashboardLayout";
import JapanMap from "@/components/JapanMap";
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
  
  const { clearAllData, removeSampleData, getDataStats, refreshData, getPrefectureStats } = useBusinessData();
  const corporateDataSources = CorporateDataService.getAvailableDataSources();
  const dataStats = getDataStats();
  const prefectureStats = getPrefectureStats();

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

  const handleCorporateDataFetch = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentStatus(`${getSelectedGroupLabel()}の企業情報取得を開始...`);
    setFetchResults(null);
    
    const startTime = Date.now();

    const progressCallback = (status: string, current: number, total: number) => {
      setCurrentStatus(status);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    };

    try {
      let corporateData;
      
      // 選択されたグループに応じて取得方法を変更
      switch (selectedDataSourceGroup) {
        case 'nta':
          corporateData = await CorporateDataService.fetchFromNTA();
          break;
        case 'fuma':
          corporateData = await CorporateDataService.fetchFromFUMA();
          break;
        case 'listed':
          // 上場企業特化データ取得（後で実装）
          corporateData = await CorporateDataService.fetchFromFUMA('上場企業');
          break;
        case 'priority':
          corporateData = await CorporateDataService.fetchFromAllSources(progressCallback);
          break;
        default:
          corporateData = await CorporateDataService.fetchFromAllSources(progressCallback);
      }
      
      // 企業情報をBusinessオブジェクトに変換
      const businesses = corporateData.map((corp, index) => ({
        id: Date.now() + index,
        name: corp.name,
        website_url: corp.website || '',
        has_website: !!corp.website,
        prefecture: corp.prefecture || '不明',
        industry: corp.industry || '不明',
        employees: corp.employees || '不明',
        capital: corp.capital || '不明',
        phone: corp.phone || '',
        address: corp.address || '',
        data_source: corp.source,
        overall_score: corp.website ? Math.random() * 5 : 0,
        is_new: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // データストレージに保存
      const { DataStorageService } = await import('@/services/dataStorageService');
      DataStorageService.addBusinesses(businesses);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      setFetchResults({
        total: businesses.length,
        time: `${duration}秒`
      });
      
      setCurrentStatus(`${getSelectedGroupLabel()}取得完了！`);
      refreshData();
      
    } catch (error) {
      console.error('企業データ取得エラー:', error);
      setCurrentStatus('企業データ取得に失敗しました');
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
      { value: 'nta', label: '国税庁法人番号' },
      { value: 'fuma', label: 'FUMA（フーマ）' },
      { value: 'listed', label: '上場企業特化' },
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
    if (priority <= 2) return 'bg-green-100 border-green-300';
    if (priority <= 4) return 'bg-blue-100 border-blue-300';
    return 'bg-gray-100 border-gray-300';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">企業データソース管理</h1>
            <p className="text-muted-foreground">
              信頼性の高い企業情報データソースの設定と取得状況
            </p>
          </div>
        </div>

        {/* 企業データソース選択UI */}
        <DataSourceSelector
          selectedGroup={selectedDataSourceGroup}
          onGroupSelect={setSelectedDataSourceGroup}
          onStartFetch={handleCorporateDataFetch}
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

            {/* 取得結果表示 */}
            {fetchResults && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-900">
                    取得完了: {fetchResults.total}社 (処理時間: {fetchResults.time})
                  </span>
                </div>
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

        {/* 企業データソース一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              企業データソース一覧（{corporateDataSources.length}件）
            </CardTitle>
            <CardDescription>
              信頼性の高い企業情報データソース
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {corporateDataSources.map((source, index) => (
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
                    <div>最大取得件数: {source.maxRecords}</div>
                    <div>URL: {source.url}</div>
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
