import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimePerformance } from "@/types/analytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface PerformanceChartProps {
  data: TimePerformance[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Format date for better display
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Performance Over Time</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'averageScore') return [`${value}%`, 'Average Score'];
                  if (name === 'attempts') return [value, 'Attempts'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="averageScore" 
                stroke="#4f46e5" 
                activeDot={{ r: 8 }}
                name="Average Score (%)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="attempts" 
                stroke="#10b981" 
                name="Attempts" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Performance and attempts trends for the past 7 days
        </div>
      </CardContent>
    </Card>
  );
} 