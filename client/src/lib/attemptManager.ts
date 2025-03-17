/**
 * Quiz attempt manager to track and enforce single-attempt policy
 */

interface QuizAttempt {
  quizId: number;
  userId: number;
  timestamp: string;
  completed: boolean;
}

const STORAGE_KEY = 'quiz_knight_attempts';

/**
 * Get all quiz attempts for the current user
 */
export function getUserAttempts(userId: number): QuizAttempt[] {
  const storedAttempts = localStorage.getItem(STORAGE_KEY);
  if (!storedAttempts) return [];
  
  try {
    const attempts = JSON.parse(storedAttempts) as QuizAttempt[];
    return attempts.filter(attempt => attempt.userId === userId);
  } catch (error) {
    console.error('Failed to parse stored quiz attempts:', error);
    return [];
  }
}

/**
 * Check if user has already attempted this quiz
 */
export function hasAttemptedQuiz(quizId: number, userId: number): boolean {
  const userAttempts = getUserAttempts(userId);
  return userAttempts.some(attempt => 
    attempt.quizId === quizId && attempt.completed
  );
}

/**
 * Register a new quiz attempt
 */
export function registerAttempt(quizId: number, userId: number): QuizAttempt {
  const storedAttempts = localStorage.getItem(STORAGE_KEY);
  let attempts: QuizAttempt[] = [];
  
  if (storedAttempts) {
    try {
      attempts = JSON.parse(storedAttempts);
    } catch (error) {
      console.error('Failed to parse stored quiz attempts:', error);
    }
  }
  
  // Create the new attempt
  const newAttempt: QuizAttempt = {
    quizId,
    userId,
    timestamp: new Date().toISOString(),
    completed: false
  };
  
  // Add the new attempt
  attempts.push(newAttempt);
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  
  return newAttempt;
}

/**
 * Mark an attempt as completed
 */
export function completeAttempt(quizId: number, userId: number): void {
  const storedAttempts = localStorage.getItem(STORAGE_KEY);
  if (!storedAttempts) return;
  
  try {
    const attempts = JSON.parse(storedAttempts) as QuizAttempt[];
    
    // Find the user's incomplete attempt for this quiz
    const updatedAttempts = attempts.map(attempt => {
      if (attempt.quizId === quizId && attempt.userId === userId && !attempt.completed) {
        return { ...attempt, completed: true };
      }
      return attempt;
    });
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAttempts));
  } catch (error) {
    console.error('Failed to update quiz attempt:', error);
  }
}

/**
 * Clear all attempt data (for testing purposes)
 */
export function clearAttemptData(): void {
  localStorage.removeItem(STORAGE_KEY);
} 