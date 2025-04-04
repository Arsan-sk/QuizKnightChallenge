import { useState, useEffect, useCallback, useRef } from "react";
import { Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { isFunction, isValidArray, safeAccess, createComponentId } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LiveQuizControllerProps {
  questions: QuestionType[];
  duration: number;
  onAnswer: (answer: string, questionIndex: number) => void;
  onComplete: () => void;
  userAnswers: string[];
}

export function LiveQuizController({ 
  questions, 
  duration, 
  onAnswer, 
  onComplete,
  userAnswers
}: LiveQuizControllerProps) {
  // Use ErrorBoundary to catch any errors
  return (
    <ErrorBoundary componentName="LiveQuizController">
      <LiveQuizControllerInner
        questions={questions}
        duration={duration}
        onAnswer={onAnswer}
        onComplete={onComplete}
        userAnswers={userAnswers}
      />
    </ErrorBoundary>
  );
}

function LiveQuizControllerInner({ 
  questions, 
  duration, 
  onAnswer, 
  onComplete,
  userAnswers
}: LiveQuizControllerProps) {
  const { toast } = useToast();
  const quizSessionId = useRef(createComponentId('quiz-session-')).current;
  const isMounted = useRef(true);
  const processingAnswer = useRef(false);
  
  // Randomize question order for each student
  const [randomizedQuestions, setRandomizedQuestions] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(duration);
  const [timePerQuestion, setTimePerQuestion] = useState(Math.floor(duration / questions.length));
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(timePerQuestion);
  const [hasWarned, setHasWarned] = useState(false);
  
  // Initialize the randomized questions on component mount
  useEffect(() => {
    try {
      // Check if questions is a valid array
      if (!isValidArray(questions)) {
        console.error("Invalid questions array:", questions);
        toast({
          title: "Error",
          description: "Unable to load quiz questions. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a copy of the questions for randomization
      const questionsCopy = [...questions];
      
      // Simple shuffle algorithm (Fisher-Yates)
      for (let i = questionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
      }
      
      setRandomizedQuestions(questionsCopy);
      
      // Calculate average time per question
      const calculatedTimePerQuestion = Math.floor(duration / questions.length);
      setTimePerQuestion(calculatedTimePerQuestion);
      setQuestionTimeRemaining(calculatedTimePerQuestion);
      
      console.log("Quiz session initialized:", {
        quizSessionId,
        questionCount: questions.length,
        duration,
        timePerQuestion: calculatedTimePerQuestion
      });
    } catch (error) {
      console.error("Error initializing quiz:", error);
      toast({
        title: "Error",
        description: "There was a problem setting up the quiz. Please refresh and try again.",
        variant: "destructive",
      });
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, [questions, duration, toast]);
  
  // Quiz timer countdown
  useEffect(() => {
    if (quizTimeRemaining <= 0) {
      // Time's up - submit the quiz
      if (isFunction(onComplete)) {
        try {
          onComplete();
        } catch (error) {
          console.error("Error completing quiz on timeout:", error);
        }
      }
      return;
    }
    
    const timer = setInterval(() => {
      setQuizTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizTimeRemaining, onComplete]);
  
  // Question timer countdown with auto-advance
  useEffect(() => {
    if (questionTimeRemaining <= 0) {
      // Time's up for this question - move to the next one
      if (currentQuestionIndex < randomizedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTimeRemaining(timePerQuestion);
      } else {
        // End of quiz
        if (isFunction(onComplete)) {
          try {
            onComplete();
          } catch (error) {
            console.error("Error completing quiz on last question timeout:", error);
          }
        }
      }
      return;
    }
    
    if (questionTimeRemaining === 10 && !hasWarned) {
      // Warn user when 10 seconds remain for the question
      toast({
        title: "Time running out",
        description: "10 seconds left for this question",
        variant: "warning",
      });
      setHasWarned(true);
    }
    
    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questionTimeRemaining, currentQuestionIndex, randomizedQuestions.length, onComplete, timePerQuestion, hasWarned, toast]);
  
  // Reset the warning flag when changing questions
  useEffect(() => {
    setHasWarned(false);
  }, [currentQuestionIndex]);
  
  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Safe access to current question
  const currentQuestion = safeAccess<QuestionType, null>(
    randomizedQuestions, 
    `[${currentQuestionIndex}]`, 
    null
  );
  
  // Handle current question answer
  const handleAnswer = useCallback((answer: string) => {
    // Prevent double submission and check if we're mounted
    if (processingAnswer.current || !isMounted.current) return;
    processingAnswer.current = true;
    
    try {
      // Safety checks
      if (!isValidArray(randomizedQuestions) || !currentQuestion) {
        console.error("Cannot handle answer - invalid questions state");
        processingAnswer.current = false;
        return;
      }
      
      // Map the randomized question back to its original index
      const originalIndex = questions.findIndex(q => 
        q.id === randomizedQuestions[currentQuestionIndex].id
      );
      
      if (originalIndex === -1) {
        console.error("Could not find matching question ID");
        processingAnswer.current = false;
        return;
      }
      
      // Call the onAnswer prop with error handling
      if (isFunction(onAnswer)) {
        onAnswer(answer, originalIndex);
        console.log(`Answer recorded for question ${currentQuestionIndex + 1}:`, {
          questionId: currentQuestion.id,
          answer,
          originalIndex
        });
      }
      
      // Move to next question
      if (currentQuestionIndex < randomizedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTimeRemaining(timePerQuestion);
      } else {
        if (isFunction(onComplete)) {
          onComplete();
        }
      }
    } catch (error) {
      console.error("Error when handling answer selection:", error);
      toast({
        title: "Error",
        description: "There was a problem recording your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        processingAnswer.current = false;
      }, 300);
    }
  }, [currentQuestion, currentQuestionIndex, onAnswer, onComplete, questions, randomizedQuestions, timePerQuestion, toast]);
  
  // Handle safe manual navigation to next question
  const handleNextQuestion = useCallback(() => {
    try {
      if (currentQuestionIndex < randomizedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTimeRemaining(timePerQuestion);
      } else if (isFunction(onComplete)) {
        onComplete();
      }
    } catch (error) {
      console.error("Error navigating to next question:", error);
    }
  }, [currentQuestionIndex, onComplete, randomizedQuestions.length, timePerQuestion]);
  
  if (!isValidArray(randomizedQuestions) || !currentQuestion) {
    return (
      <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-amber-700 dark:text-amber-300">
            Loading quiz questions...
          </p>
        </div>
      </div>
    );
  }
  
  // Get the user's answer for the current question
  const currentUserAnswer = safeAccess<string, string>(
    userAnswers, 
    `[${questions.findIndex(q => q.id === currentQuestion.id)}]`, 
    ""
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">
            Question {currentQuestionIndex + 1} of {randomizedQuestions.length}
          </h3>
          <p className="text-muted-foreground text-sm">
            Time remaining: {formatTime(questionTimeRemaining)}
          </p>
        </div>
        <div>
          <CountdownTimer
            duration={duration}
            remainingTime={quizTimeRemaining}
            size="md"
            showText={false}
          />
        </div>
      </div>
      
      <Progress value={(currentQuestionIndex / randomizedQuestions.length) * 100} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`question-${currentQuestion.id}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <Question
                question={currentQuestion}
                mode="take"
                onAnswer={handleAnswer}
                userAnswer={currentUserAnswer}
              />
            </CardContent>
            <CardFooter className="flex justify-between py-4">
              <div className="text-muted-foreground text-sm">
                {Math.floor(questionTimeRemaining / 60)}:{(questionTimeRemaining % 60).toString().padStart(2, '0')} remaining
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextQuestion();
                }}
                size="sm"
                disabled={currentQuestionIndex === randomizedQuestions.length - 1}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      <div className="space-y-3">
        {currentQuestion.options?.map((option, index) => {
          const isSelected = currentUserAnswer === option;
          const optionImage = safeAccess<string, string>(currentQuestion, `optionImages[${index}]`, "");
          
          return (
            <motion.div
              key={`live-option-${currentQuestion.id}-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                try {
                  if (!processingAnswer.current) {
                    handleAnswer(option);
                  }
                } catch (error) {
                  console.error("Failed to handle option click:", error);
                  toast({
                    title: "Error",
                    description: "Failed to record your answer. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              className={cn(
                "border rounded-md p-3 relative transition-all cursor-pointer hover:shadow-md",
                isSelected && "border-primary bg-primary/5",
                "hover:border-primary/50 hover:bg-primary/5"
              )}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  try {
                    if (!processingAnswer.current) {
                      handleAnswer(option);
                    }
                  } catch (error) {
                    console.error("Failed to handle keyboard option selection:", error);
                    toast({
                      title: "Error",
                      description: "Failed to record your answer. Please try again.",
                      variant: "destructive"
                    });
                  }
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "font-medium text-sm w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isSelected 
                    ? "bg-primary/20 text-primary dark:bg-primary/30" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                
                {/* Custom radio button styling that's more noticeable */}
                <div 
                  className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                    isSelected 
                      ? "border-primary bg-primary text-white" 
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                
                <span className={cn(
                  "flex-1 text-base",
                  isSelected && "text-primary font-medium"
                )}>
                  {option}
                </span>
              </div>
              
              {optionImage && (
                <div className="mt-3 ml-9">
                  <img 
                    src={optionImage} 
                    alt={`Option ${index + 1}`} 
                    className="max-w-full max-h-32 h-auto rounded-md border"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 