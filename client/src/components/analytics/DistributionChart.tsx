import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ScoreDistribution {
  scoreRange: string;
  count: number;
}

interface DistributionChartProps {
  data: ScoreDistribution[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Handle empty data
  if (!data || !Array.isArray(data) || data.every(d => d.count === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>No distribution data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  // Colors for different ranges
  const COLORS = ['#ef4444', '#f97316', '#facc15', '#84cc16', '#10b981'];
  
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Add percentage to data
  const chartData = data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.count / total) * 100 : 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Distribution</CardTitle>
        <CardDescription>How student scores are distributed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="scoreRange"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ scoreRange, percentage }) => 
                  percentage > 0 
                    ? `${scoreRange} (${percentage.toFixed(1)}%)` 
                    : ''
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => {
                  const item = props.payload;
                  return [`${item.count} (${item.percentage.toFixed(1)}%)`, item.scoreRange];
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 