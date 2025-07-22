import { useState, useEffect } from "react";
import { useGlobalProgress } from "@/hooks/useGlobalProgress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, CheckCircle, AlertCircle, Trash2, Loader2, RefreshCw, MapPin, Activity, Plus } from "lucide-react";
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
  const [fetchResults, setFetchResults] = useState<{ total: number; time: string; error?: boolean } | null>(null);
  
  // Global progress state
  const {
    isRunning: isProgressRunning,
    progress,
    currentStatus,
    selectedDataSourceGroup,
    startProgress,
    updateProgress,
    stopProgress,
    reset: resetProgress,
  } = useGlobalProgress();

  // Hook for data operations
  const {
    stats,
    saveBusinessesToMaster,
    addMultipleBusinessesToUser,
    clearAllUserData,
    deleteMockData,
    isSavingBusinesses,
    isDeleting,
  } = useBusinessData();

  const isOperationRunning = isSavingBusinesses || isDeleting || isProgressRunning;

  const corporateDataSources = CorporateDataService.getAvailableDataSources();

  // Handler for fetching data from corporate sources
  const handleCorporateDataFetch = async () => {
    if (isOperationRunning) return;

    // グローバルプログレス開始
    startProgress(`${getSelectedGroupLabel()}の企業情報取得を開始...`, selectedDataSourceGroup);
    setFetchResults(null);
    const startTime = Date.now();

    // タイムアウト設定（5分）
    const timeoutId = setTimeout(() => {
      stopProgress('❌ タイムアウト: 処理が5分を超えたため停止しました');
      setFetchResults({ total: 0, time: '300+', error: true });
    }, 300000);

    const progressCallback: ProgressCallback = (status, current, total) => {
      updateProgress(total > 0 ? (current / total) * 100 : 0, status);
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
        case 'scraping':
          corporateData = await CorporateDataService.fetchFromScraping(progressCallback);
          break;
        case 'priority':
           corporateData = await CorporateDataService.fetchPriority(progressCallback);
          break;
        default:
          corporateData = await CorporateDataService.fetchAll(progressCallback);
          break;
      }

      // Clear timeout if successful
      clearTimeout(timeoutId);

      // Save fetched data to Supabase master data
      if (corporateData.length > 0) {
        updateProgress(80, `取得した${corporateData.length}件のデータを企業マスターに保存中...`);
        const savedBusinesses = await saveBusinessesToMaster(corporateData);
        
        // ユーザーとの関連付けも自動実行
        if (savedBusinesses.length > 0) {
          updateProgress(90, `${savedBusinesses.length}件のデータをあなたの企業リストに追加中...`);
          const businessIds = savedBusinesses.map(business => business.id);
          await addMultipleBusinessesToUser(businessIds);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        setFetchResults({ total: savedBusinesses.length, time: duration });
        stopProgress(`✅ 企業データ取得・保存完了: ${savedBusinesses.length}社 (処理時間: ${duration}秒)`);
      } else {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        setFetchResults({ total: 0, time: duration });
        stopProgress('取得できる企業データはありませんでした。');
      }
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      console.error('企業データ取得または保存エラー:', error);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stopProgress(`❌ エラー: ${errorMessage}`);
      setFetchResults({ total: 0, time: duration, error: true });
    } finally {
      // グローバルプログレスが自動的に5秒後にリセットされる
    }
  };

  // Handler for clearing all user data
  const handleClearAllUserData = async () => {
    if (isOperationRunning) return;
    try {
      await clearAllUserData();
      setFetchResults(null);
    } catch (error) {
      console.error('ユーザーデータ削除エラー:', error);
    }
  };

  // モックデータを削除
  const handleDeleteMockData = async () => {
    if (isOperationRunning) return;
    try {
      await deleteMockData();
      setFetchResults(null);
    } catch (error) {
      console.error('モックデータ削除エラー:', error);
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
    <DashboardLayout title="データソース" description="実際のWebサイトからのスクレイピングによる企業情報データ取得">
      <div className="space-y-6">
        <Card className={isOperationRunning ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              リアルデータ取得・管理状況
              {isOperationRunning && (
                <Badge variant="outline" className="ml-2 border-blue-500 text-blue-700">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  処理中
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              あなたの企業リスト: {stats?.totalCount || 0}社
              <br />
              <span className="text-sm text-muted-foreground">
                実際のWebサイトからスクレイピングした企業データを取得・管理します
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                実データスクレイピング機能
              </h4>
              <p className="text-sm text-green-700">
                食べログ、えきてん、まいぷれから実際の企業データをスクレイピングで取得します。
                重複チェックやレート制限機能により、サイトをブロックされることなく効率的にデータを収集します。
              </p>
            </div>

            <DataSourceSelector
              selectedGroup={selectedDataSourceGroup}
              onGroupSelect={(groupValue) => {
                // グローバル状態を更新
                useGlobalProgress.setState({ selectedDataSourceGroup: groupValue });
              }}
              onStartFetch={handleCorporateDataFetch}
              isRunning={isSavingBusinesses}
            />

            {(isSavingBusinesses || isProgressRunning) && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">データ取得中...</span>
                  </div>
                  <span className="text-xs text-blue-700 font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-3" />
                <p className="text-sm text-blue-800">
                  {currentStatus}
                </p>
              </div>
            )}

            {fetchResults && !isSavingBusinesses && (
              <div className={`p-4 rounded-lg border-l-4 ${fetchResults.error 
                ? 'bg-red-50 border-red-500 text-red-900' 
                : 'bg-green-50 border-green-500 text-green-900'
              }`}>
                <div className="flex items-center mb-2">
                  {fetchResults.error 
                    ? <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    : <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  }
                  <span className="font-medium">
                    {fetchResults.error ? 'データ取得エラー' : 'データ取得完了'}
                  </span>
                </div>
                <p className="text-sm">
                  {fetchResults.error 
                    ? `処理中にエラーが発生しました。詳細はコンソールログを確認してください。`
                    : `${fetchResults.total}社の企業データを正常に取得・保存しました。`
                  }
                </p>
                <p className="text-xs mt-1 opacity-75">
                  処理時間: {fetchResults.time}秒
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteMockData}
                disabled={isOperationRunning}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                モックデータを削除
              </Button>
              
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
                    自分の企業リストを削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当によろしいですか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      あなたの企業リスト（{stats?.totalCount || 0}社）の関連付けを削除します。企業マスターデータは削除されません。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllUserData}>続行</AlertDialogAction>
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
              実データ取得ソース一覧
            </CardTitle>
            <CardDescription>
              実際のWebサイトからスクレイピングでデータを取得
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <div className="text-sm font-medium">食べログ</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">スクレイピング</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>優先度: 2</div>
                  <div>レート制限: 3秒間隔</div>
                  <div>URL: <a href="https://tabelog.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">tabelog.com</a></div>
                  <div>全国の飲食店情報を取得</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <div className="text-sm font-medium">えきてん</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">スクレイピング</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>優先度: 1（最優先）</div>
                  <div>レート制限: 4秒間隔</div>
                  <div>URL: <a href="https://www.ekiten.jp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ekiten.jp</a></div>
                  <div>地域密着型の店舗情報を取得</div>
                </div>
              </div>

              <div className="p-4 border rounded-lg border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <div className="text-sm font-medium">まいぷれ</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">スクレイピング</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>優先度: 3</div>
                  <div>レート制限: 3秒間隔</div>
                  <div>URL: <a href="https://www.maipre.jp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">maipre.jp</a></div>
                  <div>地域の店舗・企業情報を取得</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DataSources;
