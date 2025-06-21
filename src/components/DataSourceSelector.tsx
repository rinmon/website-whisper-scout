
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Building2, Github, BarChart3, Star, Play } from "lucide-react";

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
      description: '全国47都道府県の全データソース',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-blue-500',
      estimatedCount: '10,000+'
    },
    {
      value: 'chamber',
      label: '商工会議所',
      description: '全国の商工会議所データ',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-green-500',
      estimatedCount: '3,000+'
    },
    {
      value: 'github',
      label: 'GitHub組織',
      description: 'テック企業のGitHub組織データ',
      icon: <Github className="h-5 w-5" />,
      color: 'bg-purple-500',
      estimatedCount: '500+'
    },
    {
      value: 'estat',
      label: 'e-Stat API',
      description: '政府統計データ（経済センサス）',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-orange-500',
      estimatedCount: '1,000+'
    },
    {
      value: 'priority',
      label: '優先度高',
      description: '優先度の高いデータソース（1-10）',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-yellow-500',
      estimatedCount: '2,000+'
    }
  ];

  const selectedGroupData = dataSourceGroups.find(g => g.value === selectedGroup);

  return (
    <Card>
      <CardHeader>
        <CardTitle>データ取得設定</CardTitle>
        <CardDescription>
          取得するデータソースのカテゴリを選択してください
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
      </CardContent>
    </Card>
  );
};

export default DataSourceSelector;
