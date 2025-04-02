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
const SESSION_KEY = 'quiz_knight_current_attempt';

/**
 * Get all quiz attempts for the current user
 */
export function getUserAttempts(userId: number): QuizAttempt[] {
  try {
    // Check both localStorage and sessionStorage
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    const sessionAttempt = sessionStorage.getItem(SESSION_KEY);
    
    let attempts: QuizAttempt[] = [];
    
    // Process localStorage attempts
    if (storedAttempts) {
      try {
        const parsedAttempts = JSON.parse(storedAttempts) as QuizAttempt[];
        attempts = parsedAttempts.filter(attempt => attempt.userId === userId);
      } catch (error) {
        console.error('Failed to parse stored quiz attempts:', error);
      }
    }
    
    // Add current session attempt if it exists and belongs to this user
    if (sessionAttempt) {
      try {
        const currentAttempt = JSON.parse(sessionAttempt) as QuizAttempt;
        if (currentAttempt.userId === userId && 
            !attempts.some(a => 
              a.quizId === currentAttempt.quizId && 
              a.userId === currentAttempt.userId && 
              a.timestamp === currentAttempt.timestamp)) {
          attempts.push(currentAttempt);
        }
      } catch (error) {
        console.error('Failed to parse session attempt:', error);
      }
    }
    
    return attempts;
  } catch (error) {
    console.error('Error retrieving user attempts:', error);
    return [];
  }
}

/**
 * Check if user has already attempted this quiz
 */
export function hasAttemptedQuiz(quizId: number, userId: number): boolean {
  try {
    const userAttempts = getUserAttempts(userId);
    
    // First check completed attempts
    const hasCompleted = userAttempts.some(attempt => 
      attempt.quizId === quizId && 
      attempt.userId === userId && 
      attempt.completed
    );
    
    if (hasCompleted) return true;
    
    // Check server-side if possible (this would require an API endpoint)
    // This is a fallback mechanism that could be implemented
    
    return false;
  } catch (error) {
    console.error('Error checking quiz attempt:', error);
    // In case of error, default to false to allow the user to take the quiz
    // rather than incorrectly blocking them
    return false; 
  }
}

/**
 * Register a new quiz attempt
 */
export function registerAttempt(quizId: number, userId: number): QuizAttempt {
  try {
    // Get existing attempts
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
    
    // Add the new attempt to both storages for redundancy
    attempts.push(newAttempt);
    
    // Save to localStorage for persistence across sessions
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    
    // Also save current attempt to sessionStorage for better session handling
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newAttempt));
    
    return newAttempt;
  } catch (error) {
    console.error('Failed to register quiz attempt:', error);
    // Return a valid attempt object even if storage fails
    return {
      quizId,
      userId,
      timestamp: new Date().toISOString(),
      completed: false
    };
  }
}

/**
 * Mark an attempt as completed
 */
export function completeAttempt(quizId: number, userId: number): void {
  try {
    // Update in localStorage
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    if (storedAttempts) {
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
        console.error('Failed to update quiz attempt in localStorage:', error);
      }
    }
    
    // Update in sessionStorage
    const sessionAttempt = sessionStorage.getItem(SESSION_KEY);
    if (sessionAttempt) {
      try {
        const currentAttempt = JSON.parse(sessionAttempt) as QuizAttempt;
        if (currentAttempt.quizId === quizId && currentAttempt.userId === userId) {
          currentAttempt.completed = true;
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentAttempt));
        }
      } catch (error) {
        console.error('Failed to update quiz attempt in sessionStorage:', error);
      }
    }
    
    // Optionally, also record this on the server via API call
    // This would be the most reliable approach, but requires backend support
  } catch (error) {
    console.error('Failed to complete quiz attempt:', error);
  }
}

/**
 * Get the current active attempt if any
 */
export function getCurrentAttempt(): QuizAttempt | null {
  try {
    const sessionAttempt = sessionStorage.getItem(SESSION_KEY);
    if (sessionAttempt) {
      return JSON.parse(sessionAttempt) as QuizAttempt;
    }
    return null;
  } catch (error) {
    console.error('Failed to get current attempt:', error);
    return null;
  }
}

/**
 * Clear all attempt data (for testing purposes)
 */
export function clearAttemptData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear attempt data:', error);
  }
} 