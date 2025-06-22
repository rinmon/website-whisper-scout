
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

  // 地域別都道府県配置（長方形グリッド）
  const prefectureLayout = {
    hokkaido: [
      ["北海道"]
    ],
    tohoku: [
      ["青森県", "岩手県"],
      ["秋田県", "宮城県"],
      ["山形県", "福島県"]
    ],
    kanto: [
      ["群馬県", "栃木県", "茨城県"],
      ["埼玉県", "千葉県", "東京都"],
      ["山梨県", "神奈川県", ""]
    ],
    chubu: [
      ["新潟県", "富山県", "石川県"],
      ["長野県", "岐阜県", "福井県"],
      ["静岡県", "愛知県", ""]
    ],
    kansai: [
      ["滋賀県", "京都府", ""],
      ["兵庫県", "大阪府", "奈良県"],
      ["", "和歌山県", "三重県"]
    ],
    chugoku_shikoku: [
      ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
      ["徳島県", "香川県", "愛媛県", "高知県", ""]
    ],
    kyushu: [
      ["福岡県", "大分県"],
      ["佐賀県", "熊本県"],
      ["長崎県", "宮崎県"],
      ["", "鹿児島県"],
      ["沖縄県", ""]
    ]
  };

  const getDataColor = (prefecture: string) => {
    if (!prefecture) return "transparent";
    const count = businessData[prefecture] || 0;
    if (selectedPrefectures.includes(prefecture)) return "bg-blue-500 text-white border-blue-600"; // 選択済み（青）
    if (count > 100) return "bg-green-500 text-white border-green-600"; // 多い（緑）
    if (count > 50) return "bg-yellow-500 text-white border-yellow-600"; // 中程度（黄）
    if (count > 0) return "bg-red-500 text-white border-red-600"; // 少ない（赤）
    return "bg-gray-300 text-gray-700 border-gray-400"; // データなし（グレー）
  };

  const PrefectureButton = ({ prefecture }: { prefecture: string }) => {
    if (!prefecture) return <div className="w-20 h-10"></div>;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`w-20 h-10 text-xs font-medium rounded border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${getDataColor(prefecture)}`}
              onClick={() => onPrefectureSelect(prefecture)}
              onMouseEnter={() => setHoveredPrefecture(prefecture)}
              onMouseLeave={() => setHoveredPrefecture(null)}
            >
              {prefecture.replace('県', '').replace('府', '').replace('都', '')}
            </button>
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
      </TooltipProvider>
    );
  };

  const RegionSection = ({ title, layout }: { title: string; layout: string[][] }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-center text-muted-foreground">{title}</h4>
      <div className="space-y-1">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((prefecture, colIndex) => (
              <PrefectureButton key={`${rowIndex}-${colIndex}`} prefecture={prefecture} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

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
        <div className="space-y-6 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg p-6">
          {/* 地域別レイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左列 */}
            <div className="space-y-6">
              <RegionSection title="北海道" layout={prefectureLayout.hokkaido} />
              <RegionSection title="東北" layout={prefectureLayout.tohoku} />
            </div>
            
            {/* 中央列 */}
            <div className="space-y-6">
              <RegionSection title="関東" layout={prefectureLayout.kanto} />
              <RegionSection title="中部" layout={prefectureLayout.chubu} />
            </div>
            
            {/* 右列 */}
            <div className="space-y-6">
              <RegionSection title="関西" layout={prefectureLayout.kansai} />
              <RegionSection title="中国・四国" layout={prefectureLayout.chugoku_shikoku} />
              <RegionSection title="九州・沖縄" layout={prefectureLayout.kyushu} />
            </div>
          </div>
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
