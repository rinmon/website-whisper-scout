
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, BarChart3 } from "lucide-react";

interface JapanMapProps {
  selectedPrefectures: string[];
  onPrefectureSelect: (prefecture: string) => void;
  businessData?: Record<string, number>;
}

const JapanMap = ({ selectedPrefectures, onPrefectureSelect, businessData = {} }: JapanMapProps) => {
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 簡易的な都道府県位置データ（実際のプロジェクトではより正確な座標を使用）
  const prefecturePositions = {
    "北海道": { x: 45, y: 15, size: "large" },
    "青森県": { x: 45, y: 45, size: "medium" },
    "岩手県": { x: 50, y: 50, size: "medium" },
    "宮城県": { x: 48, y: 55, size: "medium" },
    "秋田県": { x: 42, y: 50, size: "medium" },
    "山形県": { x: 40, y: 55, size: "medium" },
    "福島県": { x: 42, y: 60, size: "medium" },
    "茨城県": { x: 48, y: 65, size: "medium" },
    "栃木県": { x: 42, y: 65, size: "medium" },
    "群馬県": { x: 38, y: 65, size: "medium" },
    "埼玉県": { x: 38, y: 68, size: "medium" },
    "千葉県": { x: 48, y: 68, size: "medium" },
    "東京都": { x: 42, y: 70, size: "large" },
    "神奈川県": { x: 40, y: 72, size: "medium" },
    "新潟県": { x: 35, y: 58, size: "medium" },
    "富山県": { x: 30, y: 65, size: "small" },
    "石川県": { x: 28, y: 62, size: "small" },
    "福井県": { x: 28, y: 68, size: "small" },
    "山梨県": { x: 35, y: 70, size: "small" },
    "長野県": { x: 32, y: 68, size: "medium" },
    "岐阜県": { x: 28, y: 70, size: "medium" },
    "静岡県": { x: 32, y: 75, size: "medium" },
    "愛知県": { x: 25, y: 72, size: "medium" },
    "三重県": { x: 22, y: 75, size: "medium" },
    "滋賀県": { x: 20, y: 70, size: "small" },
    "京都府": { x: 18, y: 72, size: "medium" },
    "大阪府": { x: 16, y: 75, size: "medium" },
    "兵庫県": { x: 14, y: 72, size: "medium" },
    "奈良県": { x: 18, y: 77, size: "small" },
    "和歌山県": { x: 15, y: 80, size: "medium" },
    "鳥取県": { x: 10, y: 70, size: "small" },
    "島根県": { x: 8, y: 72, size: "medium" },
    "岡山県": { x: 12, y: 75, size: "medium" },
    "広島県": { x: 8, y: 77, size: "medium" },
    "山口県": { x: 5, y: 80, size: "medium" },
    "徳島県": { x: 15, y: 82, size: "small" },
    "香川県": { x: 12, y: 80, size: "small" },
    "愛媛県": { x: 8, y: 82, size: "medium" },
    "高知県": { x: 10, y: 85, size: "medium" },
    "福岡県": { x: 2, y: 85, size: "medium" },
    "佐賀県": { x: 0, y: 87, size: "small" },
    "長崎県": { x: -2, y: 88, size: "medium" },
    "熊本県": { x: 2, y: 88, size: "medium" },
    "大分県": { x: 5, y: 85, size: "medium" },
    "宮崎県": { x: 7, y: 88, size: "medium" },
    "鹿児島県": { x: 5, y: 92, size: "medium" },
    "沖縄県": { x: 0, y: 98, size: "medium" }
  };

  const getCircleSize = (size: string) => {
    switch (size) {
      case "large": return 8;
      case "medium": return 6;
      case "small": return 4;
      default: return 6;
    }
  };

  const getDataColor = (prefecture: string) => {
    const count = businessData[prefecture] || 0;
    if (selectedPrefectures.includes(prefecture)) return "#3b82f6"; // 選択済み
    if (count > 100) return "#10b981"; // 多い
    if (count > 50) return "#f59e0b"; // 中程度
    if (count > 0) return "#ef4444"; // 少ない
    return "#6b7280"; // データなし
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          日本地図 - 都道府県選択
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>選択済み</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>データ多</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>データ中</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>データ少</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg overflow-hidden">
          <TooltipProvider>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Object.entries(prefecturePositions).map(([prefecture, position]) => (
                <Tooltip key={prefecture}>
                  <TooltipTrigger asChild>
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r={getCircleSize(position.size)}
                      fill={getDataColor(prefecture)}
                      stroke="white"
                      strokeWidth="0.5"
                      className="cursor-pointer hover:stroke-2 transition-all duration-200"
                      onClick={() => onPrefectureSelect(prefecture)}
                      onMouseEnter={() => setHoveredPrefecture(prefecture)}
                      onMouseLeave={() => setHoveredPrefecture(null)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{prefecture}</div>
                      <div className="text-sm text-muted-foreground">
                        企業数: {businessData[prefecture] || 0}社
                      </div>
                      <div className="text-xs">
                        クリックで{selectedPrefectures.includes(prefecture) ? '選択解除' : '選択'}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </svg>
          </TooltipProvider>
        </div>

        {hoveredPrefecture && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{hoveredPrefecture}</h4>
                <p className="text-sm text-muted-foreground">
                  企業数: {businessData[hoveredPrefecture] || 0}社
                </p>
              </div>
              <Button
                size="sm"
                variant={selectedPrefectures.includes(hoveredPrefecture) ? "destructive" : "default"}
                onClick={() => onPrefectureSelect(hoveredPrefecture)}
              >
                {selectedPrefectures.includes(hoveredPrefecture) ? '選択解除' : '選択'}
              </Button>
            </div>
          </div>
        )}

        {selectedPrefectures.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">選択中の都道府県</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPrefectures.length}都道府県選択済み
                </p>
              </div>
              <Badge variant="secondary">
                <BarChart3 className="mr-1 h-3 w-3" />
                総企業数: {selectedPrefectures.reduce((total, pref) => total + (businessData[pref] || 0), 0)}社
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JapanMap;
