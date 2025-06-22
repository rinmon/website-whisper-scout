
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const navigate = useNavigate();

  const handleAuthRedirect = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* ロゴ・タイトル */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">ク</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              クソサイト・スカウター
            </h1>
            <p className="text-muted-foreground mt-2">
              ビジネスチャンス発見ツール
            </p>
          </div>
        </div>

        {/* 認証へのリダイレクト */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">ログインが必要です</CardTitle>
            <CardDescription>
              アカウントにログインまたは新規登録してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleAuthRedirect}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              ログイン・新規登録
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                認証ページにリダイレクトします
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 機能説明 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-blue-600 text-xl">🔍</span>
            </div>
            <h3 className="font-semibold text-gray-900">スマート検索</h3>
            <p className="text-sm text-muted-foreground">
              業界・地域別に企業を検索
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900">AI分析</h3>
            <p className="text-sm text-muted-foreground">
              サイト品質を自動評価
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-green-600 text-xl">📈</span>
            </div>
            <h3 className="font-semibold text-gray-900">レポート生成</h3>
            <p className="text-sm text-muted-foreground">
              提案資料を自動作成
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
