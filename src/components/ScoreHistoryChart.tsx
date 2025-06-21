
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ScoreHistoryData {
  date: string;
  overall_score: number;
  technical_score: number;
  eeat_score: number;
  content_score: number;
}

interface ScoreHistoryChartProps {
  data: ScoreHistoryData[];
}

const ScoreHistoryChart = ({ data }: ScoreHistoryChartProps) => {
  const chartConfig = {
    overall_score: {
      label: "総合スコア",
      color: "#2563eb",
    },
    technical_score: {
      label: "技術力",
      color: "#dc2626",
    },
    eeat_score: {
      label: "信頼性",
      color: "#16a34a",
    },
    content_score: {
      label: "コンテンツ",
      color: "#ca8a04",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>スコア推移</CardTitle>
        <CardDescription>過去6ヶ月のスコア変化</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                className="text-xs"
                domain={[0, 5]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="overall_score" 
                stroke="var(--color-overall_score)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="technical_score" 
                stroke="var(--color-technical_score)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="eeat_score" 
                stroke="var(--color-eeat_score)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="content_score" 
                stroke="var(--color-content_score)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ScoreHistoryChart;
