import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface TimePerformance {
  date: string;
  averageScore: number | null;
  attempts: number;
  correct: number;
  wrong: number;
}

interface PerformanceChartProps {
  data: TimePerformance[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Handle empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>No time-based data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  // Format the dates and ensure values are numbers
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    averageScore: typeof item.averageScore === 'number' ? parseFloat(item.averageScore.toFixed(1)) : 0,
    attempts: item.attempts || 0,
    correct: item.correct || 0,
    wrong: item.wrong || 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>How scores and attempts change over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                yAxisId="left" 
                label={{ value: 'Average Score', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100]}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Number of Attempts', angle: 90, position: 'insideRight' }} 
              />
              <Tooltip 
                formatter={(value) => typeof value === 'number' ? value.toFixed(1) : value} 
              />
              <Legend />
              <Area 
                yAxisId="right" 
                dataKey="attempts" 
                name="Total Attempts" 
                fill="#60a5fa" 
                stroke="#3b82f6" 
                fillOpacity={0.3} 
              />
              <Line 
                yAxisId="left" 
                dataKey="averageScore" 
                name="Average Score" 
                stroke="#f97316" 
                strokeWidth={2} 
                dot={{ r: 4 }} 
              />
              <Bar 
                yAxisId="right" 
                dataKey="correct" 
                name="Correct Answers" 
                fill="#10b981" 
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="wrong" 
                name="Wrong Answers" 
                fill="#ef4444" 
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 