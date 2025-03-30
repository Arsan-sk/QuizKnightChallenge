import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LabelList 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { formatNumber, formatTime } from '../../utils/analytics';

interface QuestionStat {
  questionId: number;
  questionText: string;
  correctCount: number;
  totalAttempts: number;
  averageTime: number | null;
}

interface QuestionChartProps {
  data: QuestionStat[];
}

export function QuestionChart({ data }: QuestionChartProps) {
  // Handle empty data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Question Performance</CardTitle>
          <CardDescription>No question data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = data.map(q => {
    const correctPercentage = q.totalAttempts > 0 
      ? (q.correctCount / q.totalAttempts) * 100 
      : 0;
    
    const avgTimeMinutes = q.averageTime 
      ? q.averageTime / 60 
      : 0;
    
    return {
      name: `Q${q.questionId}`,
      correctPercentage: parseFloat(correctPercentage.toFixed(1)),
      averageTime: parseFloat(avgTimeMinutes.toFixed(1)),
      questionText: q.questionText
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Performance</CardTitle>
        <CardDescription>How students performed on individual questions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: 'Questions', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                yAxisId="left" 
                label={{ value: 'Correct Answers (%)', angle: -90, position: 'insideLeft' }} 
                domain={[0, 100]}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                label={{ value: 'Average Time (min)', angle: 90, position: 'insideRight' }} 
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "correctPercentage") return [`${value}%`, "Correct"];
                  if (name === "averageTime") return [`${value} min`, "Avg. Time"];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label);
                  return item ? `${label}: ${item.questionText}` : label;
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="correctPercentage" 
                name="Correct Answers" 
                fill="#4ade80" 
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="correctPercentage" position="top" formatter={(v) => `${v}%`} />
              </Bar>
              <Bar 
                yAxisId="right" 
                dataKey="averageTime" 
                name="Avg. Time (min)" 
                fill="#60a5fa" 
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="averageTime" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 