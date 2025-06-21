
import { Checkbox } from "@/components/ui/checkbox";

interface RegionFilterProps {
  selectedRegions: string[];
  onRegionChange: (region: string, checked: boolean) => void;
}

const RegionFilter = ({ selectedRegions, onRegionChange }: RegionFilterProps) => {
  const regions = ["東京都", "大阪府", "愛知県", "神奈川県", "福岡県", "その他"];

  return (
    <div className="space-y-3">
      <h4 className="font-medium">地域</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {regions.map((region) => (
          <div key={region} className="flex items-center space-x-2">
            <Checkbox
              id={`region-${region}`}
              checked={selectedRegions.includes(region)}
              onCheckedChange={(checked) => onRegionChange(region, checked as boolean)}
            />
            <label htmlFor={`region-${region}`} className="text-sm">
              {region}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionFilter;
