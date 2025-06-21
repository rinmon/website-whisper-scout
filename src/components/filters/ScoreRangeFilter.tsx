
import { Slider } from "@/components/ui/slider";

interface ScoreRangeFilterProps {
  scoreRange: [number, number];
  onScoreRangeChange: (newRange: number[]) => void;
}

const ScoreRangeFilter = ({ scoreRange, onScoreRangeChange }: ScoreRangeFilterProps) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">スコア範囲</h4>
      <div className="px-2">
        <Slider
          value={scoreRange}
          onValueChange={onScoreRangeChange}
          max={5}
          min={0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{scoreRange[0].toFixed(1)}</span>
          <span>{scoreRange[1].toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreRangeFilter;
