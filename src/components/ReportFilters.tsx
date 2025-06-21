
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X, Download } from "lucide-react";
import IndustryFilter from "./filters/IndustryFilter";
import RegionFilter from "./filters/RegionFilter";
import ScoreRangeFilter from "./filters/ScoreRangeFilter";
import CompanySizeFilter from "./filters/CompanySizeFilter";
import WebsiteFilter from "./filters/WebsiteFilter";
import ActiveFilters from "./filters/ActiveFilters";

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

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    const newIndustries = checked 
      ? [...filters.industries, industry]
      : filters.industries.filter(i => i !== industry);
    updateFilters({ ...filters, industries: newIndustries });
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    const newRegions = checked 
      ? [...filters.regions, region]
      : filters.regions.filter(r => r !== region);
    updateFilters({ ...filters, regions: newRegions });
  };

  const handleCompanySizeChange = (size: string, checked: boolean) => {
    const newSizes = checked 
      ? [...filters.companySize, size]
      : filters.companySize.filter(s => s !== size);
    updateFilters({ ...filters, companySize: newSizes });
  };

  const handleScoreRangeChange = (newRange: number[]) => {
    updateFilters({ ...filters, scoreRange: [newRange[0], newRange[1]] as [number, number] });
  };

  const handleWebsiteChange = (value: string) => {
    updateFilters({ ...filters, hasWebsite: value });
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      industries: [],
      regions: [],
      scoreRange: [0, 5] as [number, number],
      companySize: [],
      hasWebsite: "all"
    };
    updateFilters(clearedFilters);
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
          <IndustryFilter 
            selectedIndustries={filters.industries}
            onIndustryChange={handleIndustryChange}
          />
          <Separator />
          <RegionFilter 
            selectedRegions={filters.regions}
            onRegionChange={handleRegionChange}
          />
          <Separator />
          <ScoreRangeFilter 
            scoreRange={filters.scoreRange}
            onScoreRangeChange={handleScoreRangeChange}
          />
          <Separator />
          <CompanySizeFilter 
            selectedSizes={filters.companySize}
            onSizeChange={handleCompanySizeChange}
          />
          <Separator />
          <WebsiteFilter 
            hasWebsite={filters.hasWebsite}
            onWebsiteChange={handleWebsiteChange}
          />
          <ActiveFilters 
            industries={filters.industries}
            regions={filters.regions}
            companySize={filters.companySize}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportFilters;
