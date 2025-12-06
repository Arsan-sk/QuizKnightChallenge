import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionStat } from "@/types/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import { formatTime, getScoreColor } from "@/utils/analytics";
import { useState } from "react";

interface QuestionChartProps {
  data: QuestionStat[];
}

export function QuestionChart({ data }: QuestionChartProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  // Skip rendering if no data
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

  // Prepare data for the chart
  const chartData = data.map((q, index) => {
    const correctPercentage = q.totalAttempts > 0
      ? (q.correctCount / q.totalAttempts) * 100
      : 0;

    return {
      id: q.questionId,
      name: `Q${index + 1}`,
      correctPercentage: parseFloat(correctPercentage.toFixed(1)),
      averageTime: q.averageTime,
      questionText: q.questionText,
      correctCount: q.correctCount,
      totalAttempts: q.totalAttempts,
      index: index,
    };
  });

  const handleMouseEnter = (_, index) => {
    setActiveBar(index);
  };

  const handleMouseLeave = () => {
    setActiveBar(null);
  };

  // Customize the tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white dark:bg-gray-800 p-3 border rounded-md shadow-md">
          <p className="font-semibold">{data.questionText}</p>
          <p className="text-sm text-muted-foreground">
            Correct: {data.correctCount} / {data.totalAttempts} ({data.correctPercentage}%)
          </p>
          <p className="text-sm text-muted-foreground">
            Avg. time: {formatTime(data.averageTime)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Question Performance</CardTitle>
            <CardDescription>Success rate and time spent per question</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={10}
              barSize={25}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 'dataMax']}
                tickFormatter={(value) => `${value}s`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="correctPercentage"
                name="Success Rate (%)"
                radius={[4, 4, 0, 0]}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getChartColor(entry.correctPercentage)}
                    fillOpacity={activeBar === index ? 1 : 0.8}
                    stroke={activeBar === index ? '#000' : 'none'}
                    strokeWidth={activeBar === index ? 1 : 0}
                  />
                ))}
                <LabelList
                  dataKey="correctPercentage"
                  position="top"
                  formatter={(value) => `${value}%`}
                  style={{ fontSize: '11px' }}
                />
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="averageTime"
                name="Avg. Time (s)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get color based on correctness percentage
function getChartColor(percentage: number): string {
  if (percentage >= 80) return '#10b981'; // green
  if (percentage >= 70) return '#22c55e'; // lime-green
  if (percentage >= 60) return '#facc15'; // yellow
  if (percentage >= 50) return '#f97316'; // orange
  return '#ef4444'; // red
} 