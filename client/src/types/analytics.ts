export interface QuestionStat {
  questionId: number;
  questionText: string;
  totalAttempts: number;
  correctCount: number;
  averageTime: number;
}

export interface ScoreDistribution {
  scoreRange: string;
  count: number;
}

export interface TimePerformance {
  date: string;
  attempts: number;
  averageScore: number;
  correct: number;
  wrong: number;
}

export interface StudentReport {
  userId: number;
  username: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: number;
  completedAt: string;
}

export interface QuizAnalytics {
  // Basic stats
  totalAttempts: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  averageTime: number | null; // in seconds
  
  // Question stats
  questionStats: QuestionStat[];
  
  // Distribution
  performanceDistribution: ScoreDistribution[];
  
  // Time-based performance
  timePerformance: TimePerformance[];
  
  // Student reports
  studentReports: StudentReport[];
} 