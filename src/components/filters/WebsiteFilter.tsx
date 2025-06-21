
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebsiteFilterProps {
  hasWebsite: string;
  onWebsiteChange: (value: string) => void;
}

const WebsiteFilter = ({ hasWebsite, onWebsiteChange }: WebsiteFilterProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">ウェブサイト</h4>
      <Select value={hasWebsite} onValueChange={onWebsiteChange}>
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
  );
};

export default WebsiteFilter;
