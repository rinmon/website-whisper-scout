
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Bell, Shield, CreditCard, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  
  const [settings, setSettings] = useState({
    name: "田中 太郎",
    email: "tanaka@example.com",
    company: "株式会社サンプル",
    notifications: {
      email: true,
      push: false,
      weekly_report: true,
    },
    privacy: {
      analytics: true,
      marketing: false,
    }
  });

  const handleLogout = () => {
    logout();
    toast({
      title: "ログアウトしました",
      description: "ご利用ありがとうございました",
    });
    navigate("/");
  };

  const handleSave = () => {
    toast({
      title: "設定を保存しました",
      description: "変更内容が正常に保存されました",
    });
  };

  const handleExportData = () => {
    toast({
      title: "データをエクスポートしています",
      description: "しばらくお待ちください...",
    });
  };

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ユーザー設定</h1>
            <p className="text-muted-foreground">アカウント情報と設定を管理</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: プロフィール情報 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  プロフィール
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">氏名</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">会社名</Label>
                  <Input
                    id="company"
                    value={settings.company}
                    onChange={(e) => setSettings({...settings, company: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* プランと使用状況 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  プラン情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">現在のプラン:</span>
                  <Badge variant="default">スタンダード</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">月間検索数:</span>
                  <span className="text-sm font-medium">1,247 / 5,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">有効期限:</span>
                  <span className="text-sm font-medium">2024-07-20</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  プランをアップグレード
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右側: 設定項目 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 通知設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  通知設定
                </CardTitle>
                <CardDescription>通知の受信方法を設定できます</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">メール通知</Label>
                    <p className="text-sm text-gray-600">重要な更新をメールで受信</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: {...settings.notifications, email: checked}
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">プッシュ通知</Label>
                    <p className="text-sm text-gray-600">ブラウザでリアルタイム通知</p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: {...settings.notifications, push: checked}
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weekly-report">週次レポート</Label>
                    <p className="text-sm text-gray-600">毎週のサマリーレポート</p>
                  </div>
                  <Switch
                    id="weekly-report"
                    checked={settings.notifications.weekly_report}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: {...settings.notifications, weekly_report: checked}
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* プライバシー設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  プライバシー設定
                </CardTitle>
                <CardDescription>データの使用方法を管理</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">使用状況の分析</Label>
                    <p className="text-sm text-gray-600">サービス改善のためのデータ収集</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        privacy: {...settings.privacy, analytics: checked}
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing">マーケティング利用</Label>
                    <p className="text-sm text-gray-600">個人向けおすすめ機能</p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={settings.privacy.marketing}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        privacy: {...settings.privacy, marketing: checked}
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* データ管理 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  データ管理
                </CardTitle>
                <CardDescription>個人データのエクスポートと削除</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label>データのエクスポート</Label>
                    <p className="text-sm text-gray-600">すべてのデータをダウンロード</p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    エクスポート
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <Label>アカウント削除</Label>
                    <p className="text-sm text-gray-600">すべてのデータを完全削除</p>
                  </div>
                  <Button variant="destructive">
                    アカウント削除
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
                設定を保存
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;
