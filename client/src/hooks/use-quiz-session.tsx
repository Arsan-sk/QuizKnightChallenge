import React, { createContext, useContext, useState, useCallback } from "react";

interface QuizSessionContextType {
  isQuizActive: boolean;
  setQuizActive: (active: boolean) => void;
  currentQuizId?: string;
  setCurrentQuizId: (id?: string) => void;
}

const QuizSessionContext = createContext<QuizSessionContextType | undefined>(undefined);

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const [isQuizActive, setQuizActive] = useState(false);
  const [currentQuizId, setCurrentQuizId] = useState<string>();

  const value: QuizSessionContextType = {
    isQuizActive,
    setQuizActive,
    currentQuizId,
    setCurrentQuizId,
  };

  return (
    <QuizSessionContext.Provider value={value}>
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error("useQuizSession must be used within QuizSessionProvider");
  }
  return context;
}
