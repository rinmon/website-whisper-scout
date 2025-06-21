
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, TrendingUp, Zap } from "lucide-react";

interface Recommendation {
  id: string;
  category: "技術" | "コンテンツ" | "信頼性" | "SEO";
  priority: "高" | "中" | "低";
  title: string;
  description: string;
  impact: string;
  effort: string;
}

interface ImprovementRecommendationsProps {
  businessScore: number;
}

const ImprovementRecommendations = ({ businessScore }: ImprovementRecommendationsProps) => {
  // スコアに基づいた改善提案を生成
  const generateRecommendations = (score: number): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    if (score < 2.0) {
      recommendations.push(
        {
          id: "1",
          category: "技術",
          priority: "高",
          title: "ウェブサイトの基本構造改善",
          description: "HTML構造の最適化、メタタグの適切な設定",
          impact: "SEO向上、ユーザビリティ改善",
          effort: "中程度"
        },
        {
          id: "2",
          category: "コンテンツ",
          priority: "高",
          title: "基本コンテンツの充実",
          description: "企業情報、サービス内容の詳細化",
          impact: "信頼性向上、コンバージョン改善",
          effort: "低"
        }
      );
    } else if (score < 3.5) {
      recommendations.push(
        {
          id: "3",
          category: "SEO",
          priority: "中",
          title: "検索エンジン最適化",
          description: "キーワード戦略の見直し、内部リンク構造改善",
          impact: "検索順位向上",
          effort: "中程度"
        },
        {
          id: "4",
          category: "信頼性",
          priority: "中",
          title: "実績・証明書の追加",
          description: "顧客事例、認証情報の掲載",
          impact: "信頼性向上",
          effort: "低"
        }
      );
    } else {
      recommendations.push(
        {
          id: "5",
          category: "技術",
          priority: "低",
          title: "パフォーマンス最適化",
          description: "画像圧縮、CDN導入検討",
          impact: "ユーザー体験向上",
          effort: "高"
        }
      );
    }

    return recommendations;
  };

  const recommendations = generateRecommendations(businessScore);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "高": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "中": return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "低": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "高": return "destructive";
      case "中": return "secondary";
      case "低": return "default";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          改善提案
        </CardTitle>
        <CardDescription>
          現在のスコアに基づいた具体的な改善アクション
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getPriorityIcon(rec.priority)}
                <h3 className="font-semibold">{rec.title}</h3>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline">{rec.category}</Badge>
                <Badge variant={getPriorityColor(rec.priority) as any}>
                  優先度: {rec.priority}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">{rec.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">期待効果:</span>
                <p className="text-gray-600">{rec.impact}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">工数:</span>
                <p className="text-gray-600">{rec.effort}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="pt-4 border-t">
          <Button className="w-full">
            詳細な改善プランを作成
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovementRecommendations;
