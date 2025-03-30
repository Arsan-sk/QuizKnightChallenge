import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { ScoreDistribution } from "@/types/analytics";
import { PieChartIcon } from "lucide-react";
import { useState } from "react";

interface DistributionChartProps {
  data: ScoreDistribution[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Skip rendering if no data
  if (!data || data.every(item => item.count === 0)) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>How student scores are distributed</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Convert data to a format suitable for recharts with percentages
  const chartData = data.map(item => ({
    name: item.scoreRange,
    value: item.count,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));

  // Colors for different ranges
  const COLORS = [
    "#ef4444", // red for 0-59%
    "#f59e0b", // amber for 60-69%
    "#6366f1", // indigo for 70-79%
    "#0ea5e9", // blue for 80-89%
    "#16a34a", // green for 90-100%
  ];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom active shape for better highlighting
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    
    return (
      <g>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#888">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="#333" fontWeight="bold">
          {`${payload.value} (${(percent * 100).toFixed(1)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>How student scores are distributed</CardDescription>
          </div>
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} student${value !== 1 ? 's' : ''} (${props.payload.percentage.toFixed(1)}%)`, 
                  name
                ]}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry, index) => {
                  const item = chartData[index];
                  return `${value} (${item?.percentage.toFixed(1)}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 