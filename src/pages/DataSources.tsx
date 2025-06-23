import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, AlertCircle, Trash2, Loader2, RefreshCw, MapPin, Activity } from "lucide-react";
import { CorporateDataService, ProgressCallback } from "@/services/corporateDataService";
import { useBusinessData } from "@/hooks/useBusinessData";
import DashboardLayout from "@/components/DashboardLayout";
import DataSourceSelector from "@/components/DataSourceSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BusinessPayload } from "@/types/business";
import { Badge } from "@/components/ui/badge";

const DataSources = () => {
  // Local UI state
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [fetchResults, setFetchResults] = useState<{ total: number; time: string; error?: boolean } | null>(null);
  const [selectedDataSourceGroup, setSelectedDataSourceGroup] = useState<string>('all');

  // Hook for data operations
  const {
    stats,
    saveBusinesses,
    clearAllData,
    isSaving,
    isDeleting,
  } = useBusinessData();

  const isOperationRunning = isSaving || isDeleting;

  const corporateDataSources = CorporateDataService.getAvailableDataSources();

  // Handler for fetching data from corporate sources
  const handleCorporateDataFetch = async () => {
    if (isOperationRunning) return;

    setProgress(0);
    setCurrentStatus(`${getSelectedGroupLabel()}の企業情報取得を開始...`);
    setFetchResults(null);
    const startTime = Date.now();

    const progressCallback: ProgressCallback = (status, current, total) => {
      setCurrentStatus(status);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    };

    try {
      let corporateData: BusinessPayload[] = [];
      
      // Fetch data based on selected source
      switch (selectedDataSourceGroup) {
        case 'nta':
          corporateData = await CorporateDataService.fetchFromNTA(progressCallback);
          break;
        case 'fuma':
          corporateData = await CorporateDataService.fetchFromFUMA(progressCallback);
          break;
        case 'listed':
          corporateData = await CorporateDataService.fetchFromListed(progressCallback);
          break;
        case 'priority':
           corporateData = await CorporateDataService.fetchPriority(progressCallback);
          break;
        default:
          corporateData = await CorporateDataService.fetchAll(progressCallback);
          break;
      }

      // Save fetched data to Supabase via the hook
      if (corporateData.length > 0) {
        setCurrentStatus(`取得した${corporateData.length}件のデータを保存中...`);
        await saveBusinesses(corporateData);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        setFetchResults({ total: corporateData.length, time: duration });
        setCurrentStatus(`✅ 取得完了: ${corporateData.length}社 (処理時間: ${duration}秒)`);
      } else {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        setFetchResults({ total: 0, time: duration });
        setCurrentStatus('取得できる企業データはありませんでした。');
      }
    } catch (error) {
      console.error('企業データ取得または保存エラー:', error);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      setCurrentStatus('エラーが発生しました。詳細はコンソールを確認してください。');
      setFetchResults({ total: 0, time: duration, error: true });
    } finally {
      setTimeout(() => {
        if (!isOperationRunning) {
            setCurrentStatus('');
        }
      }, 7000);
    }
  };

  // Handler for clearing all data
  const handleClearAllData = async () => {
    if (isOperationRunning) return;
    setCurrentStatus('すべてのデータを削除しています...');
    try {
      await clearAllData();
      setCurrentStatus('すべてのデータが正常に削除されました。');
      setFetchResults(null);
    } catch (error) {
      console.error('全データ削除エラー:', error);
      setCurrentStatus('データの削除に失敗しました。');
    } finally {
        setTimeout(() => {
            if (!isOperationRunning) {
                setCurrentStatus('');
            }
        }, 5000);
    }
  };

  const getSelectedGroupLabel = () => {
    const group = CorporateDataService.getDataSourceGroups().find(g => g.value === selectedDataSourceGroup);
    return group ? group.label : '全データ';
  };

  const getStatusIcon = (type: string, enabled: boolean = true) => {
    if (!enabled) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    switch (type) {
      case 'API':
        return <Activity className="h-5 w-5 text-blue-500" />;
      case 'Webスクレイピング':
        return <RefreshCw className="h-5 w-5 text-green-500" />;
      case 'ファイル':
        return <Database className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (type: string, enabled: boolean = true) => {
    if (!enabled) return <Badge variant="outline">無効</Badge>;
    switch (type) {
      case 'API':
        return <Badge className="bg-blue-100 text-blue-800">API</Badge>;
      case 'Webスクレイピング':
        return <Badge className="bg-green-100 text-green-800">Webスクレイピング</Badge>;
      case 'ファイル':
        return <Badge className="bg-purple-100 text-purple-800">ファイル</Badge>;
      default:
        return <Badge variant="secondary">その他</Badge>;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'border-green-300';
    if (priority <= 7) return 'border-yellow-300';
    return 'border-red-300';
  };

  return (
    <DashboardLayout title="データソース" description="信頼性の高い企業情報データソースの設定と取得状況">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              取得状況
            </CardTitle>
            <CardDescription>
              蓄積データ: {stats?.totalCount || 0}社
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataSourceSelector
              selectedGroup={selectedDataSourceGroup}
              onGroupSelect={setSelectedDataSourceGroup}
              onStartFetch={handleCorporateDataFetch}
              isRunning={isSaving}
            />

            {(isSaving || (progress > 0 && progress < 100)) && (
              <div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                  {(isSaving || progress > 0) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStatus}
                </p>
              </div>
            )}

            {fetchResults && !isSaving && (
              <div className={`p-3 rounded-md text-sm ${fetchResults.error ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                {fetchResults.error 
                  ? <AlertCircle className="inline-block mr-2 h-4 w-4" />
                  : <CheckCircle className="inline-block mr-2 h-4 w-4" />
                }
                {fetchResults.error 
                  ? `エラーが発生しました。 (処理時間: ${fetchResults.time}秒)`
                  : `取得完了: ${fetchResults.total}社 (処理時間: ${fetchResults.time}秒)`
                }
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={isOperationRunning || (stats?.totalCount || 0) === 0}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    全削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      すべての蓄積データ（{stats?.totalCount || 0}社）を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllData}>続行</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

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
                    <div>URL: <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{source.url}</a></div>
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
