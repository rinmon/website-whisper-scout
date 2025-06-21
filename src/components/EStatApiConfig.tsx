
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Key, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { BusinessDataService } from '@/services/businessDataService';
import { EStatApiService } from '@/services/estatApiService';

const EStatApiConfig = () => {
  const [appId, setAppId] = useState('');
  const [isConfigured, setIsConfigured] = useState(EStatApiService.isConfigured());
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestAndSave = async () => {
    if (!appId.trim()) {
      setTestResult({ success: false, message: 'アプリケーションIDを入力してください' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const isValid = await BusinessDataService.setEStatApiKey(appId.trim());
      
      if (isValid) {
        setIsConfigured(true);
        setTestResult({ success: true, message: 'APIキーの設定が完了しました' });
        setAppId('');
      } else {
        setTestResult({ success: false, message: 'APIキーが無効です。正しいアプリケーションIDを確認してください' });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `設定エラー: ${error instanceof Error ? error.message : '不明なエラー'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('estat_app_id');
    setIsConfigured(false);
    setTestResult(null);
    setAppId('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              e-Stat API設定
            </CardTitle>
            <CardDescription>
              政府統計ポータルサイトAPIによる企業統計データ取得
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  設定済み
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1 h-3 w-3" />
                  未設定
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API概要 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>e-Stat API</strong>は政府統計の総合窓口で提供される無料APIです。
            経済センサスや法人企業統計などの公的な企業データを取得できます。
          </AlertDescription>
        </Alert>

        {/* 設定フォーム */}
        {!isConfigured && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="estat-appid">アプリケーションID</Label>
              <Input
                id="estat-appid"
                type="text"
                placeholder="e-StatのアプリケーションIDを入力"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleTestAndSave}
                disabled={isLoading || !appId.trim()}
                className="flex-1"
              >
                {isLoading ? '設定中...' : 'テスト & 保存'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://www.e-stat.go.jp/api/api-info/api-guide', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                登録ページ
              </Button>
            </div>
          </div>
        )}

        {/* 設定済みの場合 */}
        {isConfigured && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  e-Stat APIが設定されています
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                政府統計データから企業情報を取得できます
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              設定をリセット
            </Button>
          </div>
        )}

        {/* テスト結果 */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* 利用ガイドライン */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">利用ガイドライン</h4>
          <div className="text-xs text-blue-800 space-y-1">
            <p>• アプリケーションIDの登録が必要（無料）</p>
            <p>• リクエスト制限: 10万件/日</p>
            <p>• 商用利用可能（適切な利用範囲内）</p>
            <p>• データの再配布は制限あり</p>
          </div>
          <Button
            variant="link"
            className="p-0 h-auto text-xs text-blue-600"
            onClick={() => window.open('https://www.e-stat.go.jp/api/api-info/api-spec', '_blank')}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            API仕様書を確認
          </Button>
        </div>

        {/* 取得可能なデータ */}
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">取得可能な企業データ</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded border">
              <strong>経済センサス</strong><br />
              企業の基本情報・規模
            </div>
            <div className="p-2 bg-gray-50 rounded border">
              <strong>法人企業統計</strong><br />
              資本金・従業員数
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EStatApiConfig;
