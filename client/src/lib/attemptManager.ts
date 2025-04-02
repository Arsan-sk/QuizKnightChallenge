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
const SYNC_INTERVAL = 5000; // 5 seconds

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
    // Try to synchronize storage first in case of multiple tabs
    synchronizeStorage();
    
    const userAttempts = getUserAttempts(userId);
    
    // First check completed attempts
    const hasCompleted = userAttempts.some(attempt => 
      attempt.quizId === quizId && 
      attempt.userId === userId && 
      attempt.completed
    );
    
    if (hasCompleted) return true;
    
    // Check if there's another active session for this quiz
    const activeAttempt = getActiveSession(quizId, userId);
    if (activeAttempt) {
      // If the attempt is more than 24 hours old, consider it abandoned
      const attemptTime = new Date(activeAttempt.timestamp).getTime();
      const currentTime = new Date().getTime();
      const hoursDiff = (currentTime - attemptTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        // Less than 24 hours old - consider it active
        return true;
      }
    }
    
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
    
    // Start synchronization interval
    startSyncInterval();
    
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
    
    // Trigger a final sync
    synchronizeStorage();
    
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
 * Get active session for a specific quiz and user
 */
export function getActiveSession(quizId: number, userId: number): QuizAttempt | null {
  try {
    // First check sessionStorage (current session)
    const sessionAttempt = sessionStorage.getItem(SESSION_KEY);
    if (sessionAttempt) {
      try {
        const currentAttempt = JSON.parse(sessionAttempt) as QuizAttempt;
        if (currentAttempt.quizId === quizId && 
            currentAttempt.userId === userId && 
            !currentAttempt.completed) {
          return currentAttempt;
        }
      } catch (error) {
        console.error('Failed to parse session attempt:', error);
      }
    }
    
    // Then check localStorage for incomplete attempts
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    if (storedAttempts) {
      try {
        const attempts = JSON.parse(storedAttempts) as QuizAttempt[];
        const activeAttempt = attempts.find(attempt => 
          attempt.quizId === quizId && 
          attempt.userId === userId && 
          !attempt.completed
        );
        
        if (activeAttempt) {
          return activeAttempt;
        }
      } catch (error) {
        console.error('Failed to parse stored quiz attempts:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Start a periodic synchronization interval
 */
let syncIntervalId: number | null = null;

function startSyncInterval() {
  if (syncIntervalId !== null) {
    return; // Already running
  }
  
  syncIntervalId = window.setInterval(() => {
    synchronizeStorage();
  }, SYNC_INTERVAL);
  
  // Also listen for beforeunload to sync on page exit
  window.addEventListener('beforeunload', synchronizeStorage);
  
  return () => {
    if (syncIntervalId !== null) {
      window.clearInterval(syncIntervalId);
      syncIntervalId = null;
    }
    window.removeEventListener('beforeunload', synchronizeStorage);
  };
}

/**
 * Synchronize session storage with local storage
 */
export function synchronizeStorage(): void {
  try {
    const sessionAttempt = sessionStorage.getItem(SESSION_KEY);
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    
    if (!sessionAttempt || !storedAttempts) {
      return;
    }
    
    const currentAttempt = JSON.parse(sessionAttempt) as QuizAttempt;
    const attempts = JSON.parse(storedAttempts) as QuizAttempt[];
    
    // Update the session attempt in localStorage if it exists
    const updatedAttempts = attempts.map(attempt => {
      if (attempt.quizId === currentAttempt.quizId && 
          attempt.userId === currentAttempt.userId &&
          attempt.timestamp === currentAttempt.timestamp) {
        return currentAttempt; // Use the most recent version from sessionStorage
      }
      return attempt;
    });
    
    // If the session attempt doesn't exist in localStorage yet, add it
    if (!attempts.some(attempt => 
      attempt.quizId === currentAttempt.quizId && 
      attempt.userId === currentAttempt.userId &&
      attempt.timestamp === currentAttempt.timestamp
    )) {
      updatedAttempts.push(currentAttempt);
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAttempts));
  } catch (error) {
    console.error('Failed to synchronize storage:', error);
  }
}

/**
 * Clean up stale attempts (older than 24 hours and not completed)
 */
export function cleanupStaleAttempts(): void {
  try {
    const storedAttempts = localStorage.getItem(STORAGE_KEY);
    if (!storedAttempts) return;
    
    const attempts = JSON.parse(storedAttempts) as QuizAttempt[];
    const currentTime = new Date().getTime();
    
    // Keep completed attempts and those less than 24 hours old
    const freshAttempts = attempts.filter(attempt => {
      if (attempt.completed) return true;
      
      const attemptTime = new Date(attempt.timestamp).getTime();
      const hoursDiff = (currentTime - attemptTime) / (1000 * 60 * 60);
      
      return hoursDiff < 24;
    });
    
    if (freshAttempts.length !== attempts.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshAttempts));
    }
  } catch (error) {
    console.error('Failed to cleanup stale attempts:', error);
  }
}

/**
 * Clear all attempt data (for testing purposes)
 */
export function clearAttemptData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    
    if (syncIntervalId !== null) {
      window.clearInterval(syncIntervalId);
      syncIntervalId = null;
      window.removeEventListener('beforeunload', synchronizeStorage);
    }
  } catch (error) {
    console.error('Failed to clear attempt data:', error);
  }
} 