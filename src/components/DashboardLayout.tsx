
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const userPoints = 2450;
  const userName = "田中 太郎";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ク</span>
                </div>
                <span className="font-bold text-gray-900">スカウター</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="px-3 py-1">
                💎 {userPoints.toLocaleString()} pt
              </Badge>
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm">
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー */}
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">ユーザー情報</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">名前:</span>
                        <span className="font-medium">{userName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">権限:</span>
                        <Badge variant="outline">一般ユーザー</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">今日の活動</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">検索回数:</span>
                        <span className="font-medium">12回</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">レポート生成:</span>
                        <span className="font-medium">3回</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">獲得ポイント:</span>
                        <span className="font-medium text-green-600">+150pt</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">統計情報</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">総企業数:</span>
                        <span className="font-medium">15,742</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">サイトなし:</span>
                        <span className="font-medium text-red-600">3,481</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">改善余地大:</span>
                        <span className="font-medium text-orange-600">6,789</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* メインコンテンツエリア */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
