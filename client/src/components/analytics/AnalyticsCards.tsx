import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatNumber, formatTime, getScoreColor } from '../../utils/analytics';

interface AnalyticsCardsProps {
  analytics: {
    totalAttempts: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    averageTime: number | null;
  };
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalAttempts || 0}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold text-${getScoreColor(analytics.averageScore)}-600`}>
            {formatNumber(analytics.averageScore)}%
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(analytics.highestScore)}%
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(analytics.lowestScore)}%
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(analytics.averageTime)}</div>
        </CardContent>
      </Card>
    </div>
  );
} 