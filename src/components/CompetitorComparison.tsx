
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Competitor {
  name: string;
  overall_score: number;
  industry: string;
}

interface CompetitorComparisonProps {
  currentBusiness: {
    name: string;
    overall_score: number;
    industry: string;
  };
}

const CompetitorComparison = ({ currentBusiness }: CompetitorComparisonProps) => {
  // 競合他社のモックデータ
  const competitors: Competitor[] = [
    { name: "業界リーダー A社", overall_score: 4.2, industry: currentBusiness.industry },
    { name: "競合 B社", overall_score: 3.1, industry: currentBusiness.industry },
    { name: "新興 C社", overall_score: 2.8, industry: currentBusiness.industry },
  ];

  const getComparisonIcon = (currentScore: number, competitorScore: number) => {
    if (currentScore > competitorScore) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (currentScore < competitorScore) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "text-green-600";
    if (score >= 2.5) return "text-yellow-600";
    if (score > 0) return "text-red-600";
    return "text-gray-500";
  };

  const industryAverage = competitors.reduce((sum, comp) => sum + comp.overall_score, 0) / competitors.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>競合比較</CardTitle>
        <CardDescription>
          {currentBusiness.industry}業界での位置づけ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 現在の企業 */}
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-900">{currentBusiness.name}</h3>
            <Badge variant="default">現在</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">総合スコア</span>
            <span className={`font-bold ${getScoreColor(currentBusiness.overall_score)}`}>
              {currentBusiness.overall_score.toFixed(1)}
            </span>
          </div>
          <Progress value={currentBusiness.overall_score * 20} className="mt-2 h-2" />
        </div>

        {/* 競合他社 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">競合他社</h4>
          {competitors.map((competitor, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  {getComparisonIcon(currentBusiness.overall_score, competitor.overall_score)}
                  <span className="font-medium">{competitor.name}</span>
                </div>
                <span className={`font-bold ${getScoreColor(competitor.overall_score)}`}>
                  {competitor.overall_score.toFixed(1)}
                </span>
              </div>
              <Progress value={competitor.overall_score * 20} className="h-2" />
            </div>
          ))}
        </div>

        {/* 業界平均 */}
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700">業界平均</span>
            <span className={`font-bold ${getScoreColor(industryAverage)}`}>
              {industryAverage.toFixed(1)}
            </span>
          </div>
          <Progress value={industryAverage * 20} className="h-2" />
          <p className="text-xs text-gray-600 mt-2">
            {currentBusiness.overall_score > industryAverage 
              ? "業界平均を上回っています" 
              : "業界平均を下回っています"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitorComparison;
