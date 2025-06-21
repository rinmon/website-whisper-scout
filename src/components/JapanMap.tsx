
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

  // 簡略化された日本地図の都道府県パス（デフォルメ版）
  const prefecturePaths = {
    "北海道": "M20,10 L60,10 L65,25 L55,35 L25,30 Z",
    "青森県": "M45,35 L55,35 L50,45 L40,45 Z",
    "岩手県": "M50,45 L60,45 L58,55 L48,55 Z",
    "宮城県": "M48,55 L58,55 L55,65 L45,65 Z",
    "秋田県": "M40,45 L50,45 L48,55 L38,55 Z",
    "山形県": "M38,55 L48,55 L45,65 L35,65 Z",
    "福島県": "M45,65 L55,65 L52,75 L42,75 Z",
    "茨城県": "M52,75 L62,75 L60,85 L50,85 Z",
    "栃木県": "M42,75 L52,75 L50,85 L40,85 Z",
    "群馬県": "M32,75 L42,75 L40,85 L30,85 Z",
    "埼玉県": "M40,85 L50,85 L48,95 L38,95 Z",
    "千葉県": "M50,85 L60,85 L65,95 L55,100 L45,95 Z",
    "東京都": "M38,95 L48,95 L50,105 L40,105 Z",
    "神奈川県": "M40,105 L50,105 L48,115 L38,115 Z",
    "新潟県": "M25,55 L40,55 L38,75 L23,75 Z",
    "富山県": "M23,75 L33,75 L31,85 L21,85 Z",
    "石川県": "M15,75 L25,75 L23,85 L13,85 Z",
    "福井県": "M13,85 L23,85 L21,95 L11,95 Z",
    "山梨県": "M30,85 L40,85 L38,95 L28,95 Z",
    "長野県": "M20,85 L35,85 L33,100 L18,100 Z",
    "岐阜県": "M18,100 L33,100 L31,110 L16,110 Z",
    "静岡県": "M28,95 L43,95 L45,110 L30,115 L25,110 Z",
    "愛知県": "M16,110 L31,110 L35,120 L20,125 L10,120 Z",
    "三重県": "M20,125 L35,120 L33,135 L18,135 Z",
    "滋賀県": "M10,120 L20,125 L18,135 L8,130 Z",
    "京都府": "M8,130 L18,135 L15,145 L5,140 Z",
    "大阪府": "M5,140 L15,145 L12,155 L2,150 Z",
    "兵庫県": "M-5,135 L8,130 L5,145 L-8,140 Z",
    "奈良県": "M12,155 L22,150 L20,165 L10,165 Z",
    "和歌山県": "M10,165 L20,165 L15,180 L5,175 Z",
    "鳥取県": "M-8,140 L2,150 L-1,160 L-11,155 Z",
    "島根県": "M-20,145 L-8,140 L-11,155 L-23,150 Z",
    "岡山県": "M-11,155 L2,150 L-1,165 L-14,160 Z",
    "広島県": "M-23,150 L-11,155 L-14,170 L-26,165 Z",
    "山口県": "M-26,165 L-14,170 L-17,185 L-29,180 Z",
    "徳島県": "M2,150 L12,155 L10,170 L0,165 Z",
    "香川県": "M-14,160 L-4,165 L-7,175 L-17,170 Z",
    "愛媛県": "M-26,165 L-14,170 L-17,185 L-29,180 Z",
    "高知県": "M0,165 L10,170 L5,185 L-10,180 Z",
    "福岡県": "M-35,180 L-25,185 L-28,195 L-38,190 Z",
    "佐賀県": "M-38,190 L-28,195 L-31,205 L-41,200 Z",
    "長崎県": "M-50,185 L-38,190 L-41,205 L-53,200 Z",
    "熊本県": "M-28,195 L-18,200 L-21,210 L-31,205 Z",
    "大分県": "M-17,185 L-7,190 L-10,200 L-20,195 Z",
    "宮崎県": "M-10,200 L0,205 L-3,215 L-13,210 Z",
    "鹿児島県": "M-21,210 L-11,215 L-14,230 L-24,225 Z",
    "沖縄県": "M-45,240 L-35,240 L-32,250 L-42,250 Z"
  };

  const getDataColor = (prefecture: string) => {
    const count = businessData[prefecture] || 0;
    if (selectedPrefectures.includes(prefecture)) return "#3b82f6"; // 選択済み（青）
    if (count > 100) return "#10b981"; // 多い（緑）
    if (count > 50) return "#f59e0b"; // 中程度（黄）
    if (count > 0) return "#ef4444"; // 少ない（赤）
    return "#d1d5db"; // データなし（グレー）
  };

  const getStrokeColor = (prefecture: string) => {
    return selectedPrefectures.includes(prefecture) ? "#1d4ed8" : "#374151";
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
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>選択済み</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>データ多(100+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>データ中(50+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>データ少(1+)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>データなし</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full bg-gradient-to-b from-blue-50 to-green-50 rounded-lg p-4">
          <TooltipProvider>
            <svg viewBox="-60 0 140 260" className="w-full h-96">
              {/* 日本列島の背景 */}
              <rect x="-60" y="0" width="140" height="260" fill="#e0f2fe" opacity="0.3" />
              
              {/* 都道府県のパス */}
              {Object.entries(prefecturePaths).map(([prefecture, path]) => (
                <Tooltip key={prefecture}>
                  <TooltipTrigger asChild>
                    <path
                      d={path}
                      fill={getDataColor(prefecture)}
                      stroke={getStrokeColor(prefecture)}
                      strokeWidth={selectedPrefectures.includes(prefecture) ? "2" : "1"}
                      className="cursor-pointer hover:opacity-80 transition-all duration-200"
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
              
              {/* 都道府県名のラベル（主要都市のみ） */}
              <text x="42" y="25" fontSize="8" textAnchor="middle" fill="#374151" className="pointer-events-none">北海道</text>
              <text x="42" y="105" fontSize="6" textAnchor="middle" fill="#374151" className="pointer-events-none">東京</text>
              <text x="2" y="155" fontSize="6" textAnchor="middle" fill="#374151" className="pointer-events-none">大阪</text>
              <text x="-32" y="195" fontSize="6" textAnchor="middle" fill="#374151" className="pointer-events-none">福岡</text>
              <text x="-38" y="245" fontSize="6" textAnchor="middle" fill="#374151" className="pointer-events-none">沖縄</text>
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
