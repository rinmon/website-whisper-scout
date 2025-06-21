
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Building2, FileText, BarChart3, Star, Play } from "lucide-react";

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
  const dataSourceGroups: DataSourceGroup[] = [
    {
      value: 'all',
      label: '全データソース',
      description: '全ての企業情報データソースから取得',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500',
      estimatedCount: '5,000+'
    },
    {
      value: 'nta',
      label: '国税庁法人番号',
      description: '全法人の基本情報（法人番号・住所）',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-green-500',
      estimatedCount: '2,000+'
    },
    {
      value: 'fuma',
      label: 'FUMA（フーマ）',
      description: '160万社の企業情報、検索制限なし',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-purple-500',
      estimatedCount: '1,500+'
    },
    {
      value: 'listed',
      label: '上場企業特化',
      description: 'Ullet・Yahoo!ファイナンスから財務情報',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-orange-500',
      estimatedCount: '800+'
    },
    {
      value: 'priority',
      label: '優先度高',
      description: '信頼性の高いデータソース（1-3位）',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-yellow-500',
      estimatedCount: '3,000+'
    }
  ];

  const selectedGroupData = dataSourceGroups.find(g => g.value === selectedGroup);

  return (
    <Card>
      <CardHeader>
        <CardTitle>企業データ取得設定</CardTitle>
        <CardDescription>
          取得する企業情報データソースのカテゴリを選択してください
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* データソースグループの選択 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dataSourceGroups.map((group) => (
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
                  <Badge variant="outline" className="text-xs">
                    約{group.estimatedCount}社
                  </Badge>
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
          ))}
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
                  <h4 className="font-medium">{selectedGroupData.label}</h4>
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

        {/* 利用可能なデータソース一覧 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">利用可能なデータソース</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white rounded border">
              <strong>国税庁法人番号公表サイト</strong><br />
              全法人の基本情報
            </div>
            <div className="p-2 bg-white rounded border">
              <strong>FUMA（フーマ）</strong><br />
              160万社の企業情報
            </div>
            <div className="p-2 bg-white rounded border">
              <strong>BIZMAPS</strong><br />
              高鮮度な企業データ
            </div>
            <div className="p-2 bg-white rounded border">
              <strong>Musubu（ムスブ）</strong><br />
              無料30件まで取得可能
            </div>
            <div className="p-2 bg-white rounded border">
              <strong>Ullet（ユーレット）</strong><br />
              上場企業の財務データ
            </div>
            <div className="p-2 bg-white rounded border">
              <strong>Yahoo!ファイナンス</strong><br />
              上場企業の株価・財務
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceSelector;
