import { Card } from "@/components/ui/card";
import { QuizAnalytics } from "@/types/analytics";
import { formatNumber, formatTime, getScoreColor } from "@/utils/analytics";
import { BarChart, Clock, Target, Trophy, Users } from "lucide-react";

interface AnalyticsCardsProps {
  analytics: QuizAnalytics;
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  const cards = [
    {
      title: "Total Attempts",
      value: analytics.totalAttempts.toString(),
      icon: <Users className="h-5 w-5 text-blue-500" />,
      color: "blue",
      description: "Total quiz attempts",
    },
    {
      title: "Average Score",
      value: `${formatNumber(analytics.averageScore)}%`,
      icon: <Target className="h-5 w-5 text-indigo-500" />,
      color: getScoreColor(analytics.averageScore),
      description: "Average student score",
    },
    {
      title: "Highest Score",
      value: `${formatNumber(analytics.highestScore)}%`,
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      color: "yellow",
      description: "Best performance",
    },
    {
      title: "Lowest Score",
      value: `${formatNumber(analytics.lowestScore)}%`,
      icon: <BarChart className="h-5 w-5 text-red-500" />,
      color: getScoreColor(analytics.lowestScore),
      description: "Lowest performance",
    },
    {
      title: "Average Time",
      value: formatTime(analytics.averageTime),
      icon: <Clock className="h-5 w-5 text-green-500" />,
      color: "green",
      description: "Average completion time",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-4 border border-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
            <div className="rounded-full p-2 bg-background">{card.icon}</div>
          </div>
        </Card>
      ))}
    </div>
  );
} 