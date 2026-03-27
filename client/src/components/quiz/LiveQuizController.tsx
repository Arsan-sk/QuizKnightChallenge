import React, { useState, useEffect } from "react";
import { Question } from "./Question";
import { Button } from "@/components/ui/button";

interface LiveQuizControllerProps {
  questions: any[];
  duration: number;
  onAnswer: (questionId: number, answer: string) => void;
  onComplete: () => void;
  userAnswers: Record<number, string>;
}

export function LiveQuizController({ questions, duration, onAnswer, onComplete, userAnswers }: LiveQuizControllerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="live-quiz-controller flex flex-col space-y-4">
      <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20 mb-4">
        <h3 className="text-white font-bold mb-2">Live Session Active</h3>
        <p className="text-sm text-zinc-300">Duration: {duration} minutes</p>
      </div>
      
      <div className="bg-[#1c1c21] rounded-2xl p-6 border border-white/5">
        <Question
          question={currentQuestion}
          onChange={(q) => onAnswer(currentQuestion.id, q.correctAnswer)}
          mode="take"
          userAnswer={userAnswers[currentQuestion.id]}
        />
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>
            Next Question
          </Button>
        ) : (
          <Button onClick={onComplete} className="bg-emerald-500 hover:bg-emerald-600">
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}