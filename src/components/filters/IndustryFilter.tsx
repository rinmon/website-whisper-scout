
import { Checkbox } from "@/components/ui/checkbox";

interface IndustryFilterProps {
  selectedIndustries: string[];
  onIndustryChange: (industry: string, checked: boolean) => void;
}

const IndustryFilter = ({ selectedIndustries, onIndustryChange }: IndustryFilterProps) => {
  const industries = ["IT", "商業", "製造業", "サービス業", "建設業", "医療・介護", "教育"];

  return (
    <div className="space-y-3">
      <h4 className="font-medium">業界</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {industries.map((industry) => (
          <div key={industry} className="flex items-center space-x-2">
            <Checkbox
              id={`industry-${industry}`}
              checked={selectedIndustries.includes(industry)}
              onCheckedChange={(checked) => onIndustryChange(industry, checked as boolean)}
            />
            <label htmlFor={`industry-${industry}`} className="text-sm">
              {industry}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndustryFilter;
