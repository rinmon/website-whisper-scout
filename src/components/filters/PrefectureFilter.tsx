
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface PrefectureFilterProps {
  selectedPrefectures: string[];
  onPrefectureChange: (prefecture: string, checked: boolean) => void;
  onClearAll: () => void;
}

const PrefectureFilter = ({ selectedPrefectures, onPrefectureChange, onClearAll }: PrefectureFilterProps) => {
  const prefecturesByRegion = {
    "北海道・東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    "関東": ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
    "中部": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
    "関西": ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
    "中国・四国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
    "九州・沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
  };

  const handleRegionToggle = (region: string) => {
    const prefectures = prefecturesByRegion[region as keyof typeof prefecturesByRegion];
    const allSelected = prefectures.every(pref => selectedPrefectures.includes(pref));
    
    prefectures.forEach(prefecture => {
      onPrefectureChange(prefecture, !allSelected);
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">都道府県フィルタ</CardTitle>
          {selectedPrefectures.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          )}
        </div>
        {selectedPrefectures.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedPrefectures.map(prefecture => (
              <Badge key={prefecture} variant="secondary" className="text-xs">
                {prefecture}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => onPrefectureChange(prefecture, false)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(prefecturesByRegion).map(([region, prefectures]) => (
          <div key={region} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{region}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRegionToggle(region)}
                className="text-xs"
              >
                {prefectures.every(pref => selectedPrefectures.includes(pref)) ? '全解除' : '全選択'}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {prefectures.map((prefecture) => (
                <div key={prefecture} className="flex items-center space-x-2">
                  <Checkbox
                    id={`prefecture-${prefecture}`}
                    checked={selectedPrefectures.includes(prefecture)}
                    onCheckedChange={(checked) => onPrefectureChange(prefecture, checked as boolean)}
                  />
                  <label 
                    htmlFor={`prefecture-${prefecture}`} 
                    className="text-sm cursor-pointer"
                  >
                    {prefecture}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PrefectureFilter;
