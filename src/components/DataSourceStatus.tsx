
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { BusinessDataService } from "@/services/businessDataService";

const DataSourceStatus = ({ onRefresh }: { onRefresh: () => void }) => {
  const dataSources = BusinessDataService.getAvailableDataSources();

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'csv':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'api':
        return <Badge variant="default">API接続</Badge>;
      case 'csv':
        return <Badge variant="secondary">CSV取得</Badge>;
      case 'scrape':
        return <Badge variant="outline">スクレイピング</Badge>;
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
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dataSources.map((source, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(source.type)}
                <div>
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground">{source.url}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(source.type)}
              </div>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                サンプルデータで動作確認中
              </span>
            </div>
            <p className="text-xs text-blue-800 mt-1">
              実際のオープンデータ接続は順次実装予定です
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSourceStatus;
