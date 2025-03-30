import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon } from "lucide-react";
import { ScoreDistribution } from "@/types/analytics";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DistributionChartProps {
  data: ScoreDistribution[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Convert data to a format suitable for recharts
  const chartData = data.map(item => ({
    range: item.scoreRange,
    count: item.count,
    fill: getColorForRange(item.scoreRange),
  }));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Score Distribution
        </CardTitle>
        <BarChartIcon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} student${value !== 1 ? 's' : ''}`, 'Count']}
                labelFormatter={(label) => `Score range: ${label}`}
              />
              <Bar 
                dataKey="count" 
                name="Students" 
                fill="#4f46e5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Distribution of student scores across different score ranges
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get a color based on the score range
function getColorForRange(range: string): string {
  if (range.includes("90-100")) return "#16a34a"; // green
  if (range.includes("80-89")) return "#0ea5e9"; // blue
  if (range.includes("70-79")) return "#6366f1"; // indigo
  if (range.includes("60-69")) return "#f59e0b"; // amber
  return "#ef4444"; // red
} 