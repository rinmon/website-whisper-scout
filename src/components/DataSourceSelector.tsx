import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Building2, FileText, BarChart3, Star, Play, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { useState, useEffect } from "react";

interface DataSourceGroup {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  estimatedCount: string;
}

interface DataSourceSelectorProps {
  selectedGroup: string;
  onGroupSelect: (group: string) => void;
  onStartFetch: () => void;
  isRunning: boolean;
}

const DataSourceSelector = ({ selectedGroup, onGroupSelect, onStartFetch, isRunning }: DataSourceSelectorProps) => {
  const { getDataStats } = useBusinessData();
  const [dataStats, setDataStats] = useState<any>(null);

  // データ統計を取得
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDataStats();
        setDataStats(stats);
      } catch (error) {
        console.error('統計データ取得エラー:', error);
      }
    };
    
    loadStats();
  }, [getDataStats]);

  // データソースの実データ取得状況を判定
  const getDataSourceStatus = (sourceValue: string) => {
    if (!dataStats) return 'unknown';
    
    const totalCount = dataStats.totalCount || 0;
    
    // データソース別の判定ロジック
    switch (sourceValue) {
      case 'nta':
        // 国税庁データがあるかチェック（データソースで判定）
        return totalCount > 0 ? 'success' : 'warning';
      case 'fuma':
        // FUMAデータがあるかチェック
        return totalCount > 100 ? 'success' : 'warning';
      case 'listed':
        // 上場企業データがあるかチェック
        return totalCount > 50 ? 'success' : 'warning';
      case 'priority':
        // 優先度高データがあるかチェック
        return totalCount > 200 ? 'success' : 'warning';
      case 'all':
        // 全データソースの状況
        return totalCount > 500 ? 'success' : totalCount > 100 ? 'partial' : 'warning';
      default:
        return 'unknown';
    }
  };

  // ステータスバッジの取得
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            データ取得済み
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            部分的取得
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            データ不足
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            未確認
          </Badge>
        );
    }
  };

  const dataSourceGroups: DataSourceGroup[] = [
    {
      value: 'all',
      label: '全データソース',
      description: '全ての実データソースから取得（API+スクレイピング）',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500',
      estimatedCount: '実データ'
    },
    {
      value: 'nta',
      label: '国税庁法人番号',
      description: '全法人の基本情報（API経由）',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-green-500',
      estimatedCount: '実データ'
    },
    {
      value: 'fuma',
      label: 'FUMA（フーマ）',
      description: '160万社の企業情報（API経由）',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-purple-500',
      estimatedCount: '実データ'
    },
    {
      value: 'scraping',
      label: 'スクレイピング',
      description: '食べログ・えきてん・まいぷれから直接取得',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-orange-500',
      estimatedCount: '実データ'
    },
    {
      value: 'priority',
      label: '優先度高',
      description: '国税庁API + スクレイピングデータ',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-yellow-500',
      estimatedCount: '実データ'
    }
  ];

  const selectedGroupData = dataSourceGroups.find(g => g.value === selectedGroup);

  return (
    <Card>
      <CardHeader>
        <CardTitle>実データ取得設定</CardTitle>
        <CardDescription>
          実際のWebサイトから取得する企業情報データソースを選択
          {dataStats && (
            <span className="ml-2 text-sm font-medium">
              現在のデータ: {dataStats.totalCount}社
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* データソースグループの選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataSourceGroups.map((group) => {
            const status = getDataSourceStatus(group.value);
            return (
              <div
                key={group.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedGroup === group.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onGroupSelect(group.value)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-full text-white ${group.color}`}>
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{group.label}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        約{group.estimatedCount}社
                      </Badge>
                      {getStatusBadge(status)}
                    </div>
                  </div>
                  {selectedGroup === group.value && (
                    <div className="text-primary">
                      <div className="w-4 h-4 rounded-full bg-primary"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {group.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 選択されたグループの詳細と実行ボタン */}
        {selectedGroupData && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full text-white ${selectedGroupData.color}`}>
                  {selectedGroupData.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{selectedGroupData.label}</h4>
                    {getStatusBadge(getDataSourceStatus(selectedGroupData.value))}
                  </div>
                  <p className="text-sm text-blue-700">
                    {selectedGroupData.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={onStartFetch}
                disabled={isRunning}
                className="min-w-[120px]"
              >
                {isRunning ? (
                  <>処理中...</>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    取得開始
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 利用可能なデータソース一覧（実データ取得状況付き） */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            実データ取得ソース
            <Badge variant="outline" className="ml-2 text-xs">
              スクレイピング対応
            </Badge>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white rounded border flex items-center justify-between">
              <div>
                <strong>食べログ</strong><br />
                全国の飲食店データ
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                スクレイピング対応
              </Badge>
            </div>
            <div className="p-2 bg-white rounded border flex items-center justify-between">
              <div>
                <strong>えきてん</strong><br />
                地域密着型店舗データ
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                スクレイピング対応
              </Badge>
            </div>
            <div className="p-2 bg-white rounded border flex items-center justify-between">
              <div>
                <strong>まいぷれ</strong><br />
                地域企業・店舗データ
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                スクレイピング対応
              </Badge>
            </div>
            <div className="p-2 bg-white rounded border flex items-center justify-between">
              <div>
                <strong>国税庁法人番号公表サイト</strong><br />
                全法人の基本情報
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                API対応
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceSelector;
