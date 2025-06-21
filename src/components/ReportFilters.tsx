
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Filter, X, Download } from "lucide-react";

interface FilterState {
  industries: string[];
  regions: string[];
  scoreRange: [number, number];
  companySize: string[];
  hasWebsite: string;
}

interface ReportFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  onExport: (format: string) => void;
}

const ReportFilters = ({ onFiltersChange, onExport }: ReportFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    industries: [],
    regions: [],
    scoreRange: [0, 5],
    companySize: [],
    hasWebsite: "all"
  });

  const industries = ["IT", "商業", "製造業", "サービス業", "建設業", "医療・介護", "教育"];
  const regions = ["東京都", "大阪府", "愛知県", "神奈川県", "福岡県", "その他"];
  const companySizes = ["小規模（1-10名）", "中規模（11-50名）", "大規模（51名以上）"];

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const newIndustries = checked 
      ? [...filters.industries, industry]
      : filters.industries.filter(i => i !== industry);
    
    const newFilters = { ...filters, industries: newIndustries };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const newRegions = checked 
      ? [...filters.regions, region]
      : filters.regions.filter(r => r !== region);
    
    const newFilters = { ...filters, regions: newRegions };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCompanySizeChange = (size: string, checked: boolean) => {
    const newSizes = checked 
      ? [...filters.companySize, size]
      : filters.companySize.filter(s => s !== size);
    
    const newFilters = { ...filters, companySize: newSizes };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleScoreRangeChange = (newRange: number[]) => {
    const newFilters = { ...filters, scoreRange: [newRange[0], newRange[1]] as [number, number] };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      industries: [],
      regions: [],
      scoreRange: [0, 5] as [number, number],
      companySize: [],
      hasWebsite: "all"
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                レポートフィルター
              </CardTitle>
              <CardDescription>分析条件を設定してください</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                クリア
              </Button>
              <Select onValueChange={(value) => onExport(value)}>
                <SelectTrigger className="w-32">
                  <Download className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="エクスポート" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 業界フィルター */}
          <div className="space-y-3">
            <h4 className="font-medium">業界</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {industries.map((industry) => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industry-${industry}`}
                    checked={filters.industries.includes(industry)}
                    onCheckedChange={(checked) => handleIndustryChange(industry, checked as boolean)}
                  />
                  <label htmlFor={`industry-${industry}`} className="text-sm">
                    {industry}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 地域フィルター */}
          <div className="space-y-3">
            <h4 className="font-medium">地域</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {regions.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={filters.regions.includes(region)}
                    onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                  />
                  <label htmlFor={`region-${region}`} className="text-sm">
                    {region}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* スコア範囲 */}
          <div className="space-y-3">
            <h4 className="font-medium">スコア範囲</h4>
            <div className="px-2">
              <Slider
                value={filters.scoreRange}
                onValueChange={handleScoreRangeChange}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{filters.scoreRange[0].toFixed(1)}</span>
                <span>{filters.scoreRange[1].toFixed(1)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 会社規模 */}
          <div className="space-y-3">
            <h4 className="font-medium">会社規模</h4>
            <div className="space-y-2">
              {companySizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={filters.companySize.includes(size)}
                    onCheckedChange={(checked) => handleCompanySizeChange(size, checked as boolean)}
                  />
                  <label htmlFor={`size-${size}`} className="text-sm">
                    {size}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ウェブサイト有無 */}
          <div className="space-y-3">
            <h4 className="font-medium">ウェブサイト</h4>
            <Select value={filters.hasWebsite} onValueChange={(value) => {
              const newFilters = { ...filters, hasWebsite: value };
              setFilters(newFilters);
              onFiltersChange(newFilters);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="yes">あり</SelectItem>
                <SelectItem value="no">なし</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* アクティブフィルター表示 */}
          {(filters.industries.length > 0 || filters.regions.length > 0 || filters.companySize.length > 0) && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-muted-foreground">アクティブフィルター</h5>
              <div className="flex flex-wrap gap-2">
                {filters.industries.map((industry) => (
                  <Badge key={industry} variant="secondary">
                    {industry}
                  </Badge>
                ))}
                {filters.regions.map((region) => (
                  <Badge key={region} variant="secondary">
                    {region}
                  </Badge>
                ))}
                {filters.companySize.map((size) => (
                  <Badge key={size} variant="secondary">
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportFilters;
