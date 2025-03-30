import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { AnalyticsCards } from '../components/analytics/AnalyticsCards';
import { QuestionChart } from '../components/analytics/QuestionChart';
import { DistributionChart } from '../components/analytics/DistributionChart';
import { PerformanceChart } from '../components/analytics/PerformanceChart';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { QuizAnalytics } from '@/types/analytics';
import { formatTime, formatNumber } from '../utils/analytics';

// Default empty analytics state with proper structure
const emptyAnalytics: QuizAnalytics = {
  totalAttempts: 0,
  averageScore: null,
  highestScore: null,
  lowestScore: null,
  averageTime: null,
  questionStats: [],
  performanceDistribution: [
    { scoreRange: "0-59%", count: 0 },
    { scoreRange: "60-69%", count: 0 },
    { scoreRange: "70-79%", count: 0 },
    { scoreRange: "80-89%", count: 0 },
    { scoreRange: "90-100%", count: 0 }
  ],
  timePerformance: []
};

export default function QuizAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<QuizAnalytics>(emptyAnalytics);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quiz details to get title
        try {
          const quizResponse = await fetch(`/api/quizzes/${id}`);
          if (quizResponse.ok) {
            const quizData = await quizResponse.json();
            setQuizTitle(quizData.title || "Quiz Analytics");
          } else {
            console.error("Error response when fetching quiz:", quizResponse.status, quizResponse.statusText);
            setQuizTitle("Quiz Analytics");
          }
        } catch (error) {
          console.error("Error fetching quiz details:", error);
          setQuizTitle("Quiz Analytics");
        }
        
        // Fetch analytics data
        const response = await fetch(`/api/analytics/quiz/${id}`);
        
        if (!response.ok) {
          // If response is not ok, throw with status text
          const errorData = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
          throw new Error(errorData?.error || `Failed to fetch analytics: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate the response data has the expected structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid analytics data received');
        }
        
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setError(error.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return <AnalyticsLoadingSkeleton />;
  }
  
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  const hasData = analytics.totalAttempts > 0;
  
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{quizTitle}</h1>
          <p className="text-muted-foreground">Analytics Dashboard</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
      
      {!hasData ? (
        <Alert className="mb-6">
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There are no attempts for this quiz yet. Analytics will be available once students complete the quiz.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <AnalyticsCards analytics={analytics} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuestionChart data={analytics.questionStats} />
              <DistributionChart data={analytics.performanceDistribution} />
            </div>
          </TabsContent>
          
          <TabsContent value="questions">
            <QuestionChart data={analytics.questionStats} />
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold p-4 border-b">Question Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="p-3 text-left">Question</th>
                      <th className="p-3 text-center">Correct</th>
                      <th className="p-3 text-center">Total</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.questionStats.map((q) => {
                      const correctPercentage = q.totalAttempts > 0 
                        ? (q.correctCount / q.totalAttempts) * 100 
                        : 0;
                      
                      return (
                        <tr key={q.questionId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 text-left">
                            <span className="font-semibold">Q{q.questionId}:</span> {q.questionText}
                          </td>
                          <td className="p-3 text-center">{q.correctCount}</td>
                          <td className="p-3 text-center">{q.totalAttempts}</td>
                          <td className="p-3 text-center">
                            <span className={correctPercentage >= 70 ? 'text-green-600' : 'text-red-600'}>
                              {formatNumber(correctPercentage)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">{formatTime(q.averageTime)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution">
            <DistributionChart data={analytics.performanceDistribution} />
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold p-4 border-b">Score Distribution Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="p-3 text-left">Score Range</th>
                      <th className="p-3 text-center">Number of Students</th>
                      <th className="p-3 text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.performanceDistribution.map((range) => {
                      const total = analytics.performanceDistribution.reduce(
                        (sum, item) => sum + item.count, 0
                      );
                      const percentage = total > 0 ? (range.count / total) * 100 : 0;
                      
                      return (
                        <tr key={range.scoreRange} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="p-3 text-left">{range.scoreRange}</td>
                          <td className="p-3 text-center">{range.count}</td>
                          <td className="p-3 text-center">{formatNumber(percentage)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <PerformanceChart data={analytics.timePerformance} />
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold p-4 border-b">Daily Performance Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-center">Attempts</th>
                      <th className="p-3 text-center">Avg. Score</th>
                      <th className="p-3 text-center">Correct</th>
                      <th className="p-3 text-center">Wrong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.timePerformance.map((day) => (
                      <tr key={day.date} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="p-3 text-left">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">{day.attempts}</td>
                        <td className="p-3 text-center">{formatNumber(day.averageScore)}%</td>
                        <td className="p-3 text-center">{day.correct}</td>
                        <td className="p-3 text-center">{day.wrong}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Loading skeleton component for better UX
function AnalyticsLoadingSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-40 mt-4 md:mt-0" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
} 