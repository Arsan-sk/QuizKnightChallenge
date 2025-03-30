export interface QuizAnalytics {
  // Basic stats
  totalAttempts: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageTime: number | null; // in seconds
  
  // Question stats
  questionStats: {
    questionId: number;
    questionText: string;
    correctCount: number;
    totalAttempts: number;
    averageTime: number | null;
  }[];
  
  // Distribution
  performanceDistribution: {
    scoreRange: string;
    count: number;
  }[];
  
  // Time-based performance
  timePerformance: {
    date: string;
    averageScore: number | null;
    attempts: number;
    correct: number;
    wrong: number;
  }[];
} 