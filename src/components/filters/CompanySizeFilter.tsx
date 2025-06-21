
import { Checkbox } from "@/components/ui/checkbox";

interface CompanySizeFilterProps {
  selectedSizes: string[];
  onSizeChange: (size: string, checked: boolean) => void;
}

const CompanySizeFilter = ({ selectedSizes, onSizeChange }: CompanySizeFilterProps) => {
  const companySizes = ["小規模（1-10名）", "中規模（11-50名）", "大規模（51名以上）"];

  return (
    <div className="space-y-3">
      <h4 className="font-medium">会社規模</h4>
      <div className="space-y-2">
        {companySizes.map((size) => (
          <div key={size} className="flex items-center space-x-2">
            <Checkbox
              id={`size-${size}`}
              checked={selectedSizes.includes(size)}
              onCheckedChange={(checked) => onSizeChange(size, checked as boolean)}
            />
            <label htmlFor={`size-${size}`} className="text-sm">
              {size}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanySizeFilter;
