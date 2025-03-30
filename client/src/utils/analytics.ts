// Format number to 1 decimal place with fallback
export function formatNumber(value: number | null, decimals = 1): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  return Number(value).toFixed(decimals);
}

// Format time (seconds) to minutes and seconds
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined || isNaN(Number(seconds))) {
    return 'N/A';
  }
  
  const mins = Math.floor(Number(seconds) / 60);
  const secs = Math.floor(Number(seconds) % 60);
  return `${mins}m ${secs}s`;
}

// Get color based on score
export function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'gray';
  if (score >= 90) return 'green';
  if (score >= 80) return 'teal';
  if (score >= 70) return 'blue';
  if (score >= 60) return 'yellow';
  return 'red';
}

// Prepare data for charts with proper fallbacks
export function prepareQuestionChartData(questionStats: any[]) {
  if (!questionStats || !Array.isArray(questionStats)) {
    return [];
  }
  
  return questionStats.map((q, index) => ({
    id: q.questionId || index + 1,
    label: `Q${q.questionId || index + 1}`,
    correctPercentage: q.totalAttempts > 0 ? 
      (q.correctCount / q.totalAttempts) * 100 : 0,
    averageTime: q.averageTime || 0
  }));
} 