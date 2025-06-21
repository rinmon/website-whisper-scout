
import { Badge } from "@/components/ui/badge";

interface ActiveFiltersProps {
  industries: string[];
  regions: string[];
  companySize: string[];
}

const ActiveFilters = ({ industries, regions, companySize }: ActiveFiltersProps) => {
  const hasActiveFilters = industries.length > 0 || regions.length > 0 || companySize.length > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium text-muted-foreground">アクティブフィルター</h5>
      <div className="flex flex-wrap gap-2">
        {industries.map((industry) => (
          <Badge key={industry} variant="secondary">
            {industry}
          </Badge>
        ))}
        {regions.map((region) => (
          <Badge key={region} variant="secondary">
            {region}
          </Badge>
        ))}
        {companySize.map((size) => (
          <Badge key={size} variant="secondary">
            {size}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;
