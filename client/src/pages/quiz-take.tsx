import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizProgress } from "@/components/ui/quiz-progress";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { QuestionTransition } from "@/components/ui/question-transition";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Trophy, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { QuizReview } from "@/components/quiz/QuizReview";
import { WebcamMonitor } from "@/components/quiz/WebcamMonitor";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { hasAttemptedQuiz, registerAttempt, completeAttempt } from "@/lib/attemptManager";
import { LiveQuizController } from "@/components/quiz/LiveQuizController";

type LeaderboardEntry = {
  id: number;
  userId: number;
  score: number;
  timeTaken: number;
  completedAt: string;
  username: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
};

export default function QuizTake() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeStarted, setTimeStarted] = useState<Date>();
  const [warnings, setWarnings] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [enableWebcam, setEnableWebcam] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    timeTaken: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    pointsEarned: number;
  } | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isProcessingVisibility, setIsProcessingVisibility] = useState(false);
  const [isSubmissionInProgress, setIsSubmissionInProgress] = useState(false);
  const [tabSwitchTimestamp, setTabSwitchTimestamp] = useState<number | null>(null);
  
  // Use refs to prevent race conditions
  const submittingRef = useRef(false);
  const warningsRef = useRef(0);
  const isActiveRef = useRef(true);

  const { data: quiz, isError: quizError, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
    onError: (error) => {
      toast({
        title: "Error loading quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: questions, isError: questionsError } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${id}/questions`],
    onError: (error) => {
      toast({
        title: "Error loading questions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/quizzes/${id}/leaderboard`],
    enabled: quizCompleted,
  });

  // Check if user has already attempted this quiz
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  useEffect(() => {
    if (user && id) {
      const attempted = hasAttemptedQuiz(parseInt(id), user.id);
      setHasAttempted(attempted);
      
      if (attempted) {
        toast({
          title: "Quiz already attempted",
          description: "You have already completed this quiz. Multiple attempts are not allowed.",
          variant: "destructive",
        });
      } else {
        // Register a new attempt
        registerAttempt(parseInt(id), user.id);
      }
    }
  }, [user, id, toast]);

  const submitQuiz = async () => {
    // Use refs to track submission status to avoid race conditions
    if (submittingRef.current || isSubmissionInProgress) {
      console.log("Submission already in progress, ignoring duplicate call");
      return; // Prevent double submissions
    }
    
    try {
      console.log("Starting quiz submission process");
      submittingRef.current = true;
      setSubmitting(true);
      setIsSubmissionInProgress(true); // Additional flag to prevent race conditions
      
      // Calculate correct answers
      let correctCount = 0;
      let wrongCount = 0;
      
      if (!questions || !questions.length) {
        throw new Error("Questions not loaded properly");
      }
      
      for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correctAnswer) {
          correctCount++;
        } else if (answers[i]) {
          wrongCount++;
        }
      }
      
      // Calculate score as percentage
      const scorePercentage = (correctCount / questions.length) * 100;
      
      // Points calculation: 2 points per correct answer
      const pointsEarned = correctCount * 2;
      
      // Create a timestamp to handle timing issues
      const submitTime = timeStarted ? (Date.now() - timeStarted.getTime()) : 0;
      
      // Submit result with retry mechanism
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          console.log(`Submitting quiz, attempt ${retryCount + 1}/${maxRetries + 1}`);
          // Prepare request data
          const requestData = {
            answers: JSON.stringify(answers),
            score: Math.round(scorePercentage),
            timeTaken: Math.floor(submitTime / 1000),
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            totalQuestions: questions.length,
          };
          
          console.log("Submission data:", requestData);
          
          // Submit result - fixed API request format
          const result = await apiRequest(
            `/api/quizzes/${id}/results`, 
            {
              method: 'POST',
              data: requestData
            }
          );
          
          console.log("Submission successful:", result);
          
          setQuizResult({
            score: Math.round(scorePercentage),
            timeTaken: Math.floor(submitTime / 1000),
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            totalQuestions: questions.length,
            pointsEarned: pointsEarned
          });
          
          if (user && id) {
            completeAttempt(parseInt(id), user.id);
            
            // Clear quiz state from localStorage since we've successfully submitted
            try {
              localStorage.removeItem('quiz_state');
            } catch (err) {
              console.error("Error clearing quiz state:", err);
            }
          }
          
          // Success - exit the retry loop
          break;
        } catch (apiError) {
          retryCount++;
          console.error(`API Error submitting quiz (attempt ${retryCount}/${maxRetries}):`, apiError);
          
          if (retryCount > maxRetries) {
            toast({
              title: "Error submitting quiz",
              description: "There was a network error. Please check your connection and try again.",
              variant: "destructive",
            });
            throw apiError;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      await refetchLeaderboard();
      setQuizCompleted(true);
      console.log("Quiz submission completed successfully");
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error submitting quiz",
        description: "There was an error submitting your quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      // Keep isSubmissionInProgress true if submission was successful
      // This prevents further changes to the quiz after submission
      if (!quizCompleted) {
        setIsSubmissionInProgress(false);
      }
      // Small delay before resetting submittingRef to prevent multiple calls
      setTimeout(() => {
        submittingRef.current = false;
      }, 500);
    }
  };

  const handleWebcamViolation = useCallback(() => {
    if (isSubmissionInProgress || submittingRef.current || !isActiveRef.current) return; // Avoid adding violations during submission
    
    const newWarnings = warningsRef.current + 1;
    warningsRef.current = newWarnings;
    setWarnings(newWarnings);
    
    // Update localStorage state
    if (user && id) {
      try {
        localStorage.setItem('quiz_state', JSON.stringify({
          quizId: id,
          userId: user.id,
          warnings: newWarnings,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.error("Error saving quiz state:", err);
      }
    }
    
    if (newWarnings >= 3) {
      toast({
        title: "Quiz terminated",
        description: "Multiple people detected. Your quiz has been automatically submitted.",
        variant: "destructive",
      });
      
      // Set flags to prevent multiple submissions
      submittingRef.current = true;
      setIsSubmissionInProgress(true);
      
      // Use setTimeout to ensure state updates before submission
      setTimeout(() => {
        if (isActiveRef.current) {
          submitQuiz();
        }
      }, 300);
    }
  }, [submitQuiz, toast, id, user, isSubmissionInProgress]);

  useEffect(() => {
    setTimeStarted(new Date());
    warningsRef.current = warnings;
    isActiveRef.current = true;
    
    let visibilityTimer: number | null = null;
    
    // Tab switching detection - completely rewritten for reliability
    const handleVisibilityChange = () => {
      // Debug visibility change events
      console.log("Visibility change detected, document.hidden:", document.hidden);
      
      // Exit early if not active or quiz already completed
      if (!isActiveRef.current || quizCompleted || isSubmissionInProgress || submittingRef.current) {
        console.log("Skipping visibility handling due to state:", {
          isActive: isActiveRef.current,
          quizCompleted,
          isSubmissionInProgress,
          isSubmitting: submittingRef.current
        });
        return;
      }
      
      if (document.hidden) {
        // When tab becomes hidden - store timestamp and disable hotkey detection
        console.log("Tab hidden, storing timestamp");
        setIsProcessingVisibility(true);
        setTabSwitchTimestamp(Date.now());
      } else if (tabSwitchTimestamp) {
        // When tab becomes visible again
        const hiddenDuration = (Date.now() - tabSwitchTimestamp) / 1000;
        console.log("Tab visible again, hidden duration:", hiddenDuration);
        
        // Only count as violation if hidden for more than 1 second
        if (hiddenDuration > 1) {
          const newWarnings = warningsRef.current + 1;
          warningsRef.current = newWarnings;
          setWarnings(newWarnings);
          
          toast({
            title: `Tab Switching Warning ${newWarnings}/3`,
            description: `Tab switching detected. ${3 - newWarnings} warnings left before automatic submission.`,
            variant: "destructive",
          });
          
          if (newWarnings >= 3) {
            toast({
              title: "Quiz terminated",
              description: "Too many tab switches detected. Your quiz has been automatically submitted.",
              variant: "destructive",
            });
            
            // Set flags before submission to prevent race conditions
            submittingRef.current = true;
            setIsSubmissionInProgress(true);
            
            // Use a timeout to ensure state updates before submission
            visibilityTimer = window.setTimeout(() => {
              if (isActiveRef.current) {
                submitQuiz();
              }
            }, 500);
          }
        }
        
        // Reset tab switch tracking
        setTabSwitchTimestamp(null);
        
        // Add a small delay before enabling hotkey detection again
        visibilityTimer = window.setTimeout(() => {
          if (isActiveRef.current) {
            setIsProcessingVisibility(false);
          }
        }, 500);
      }
    };

    // Copy-paste prevention
    const preventCopyPaste = (e: ClipboardEvent) => {
      if (quizCompleted || isSubmissionInProgress || submittingRef.current || !isActiveRef.current) return;
      
      e.preventDefault();
      setCopyPasteAttempts(prev => {
        const newAttempts = prev + 1;
        toast({
          title: "Copy/Paste Blocked",
          description: "Copy and paste functionality is disabled during the quiz.",
          variant: "destructive",
        });
        
        if (newAttempts >= 3) {
          toast({
            title: "Warning",
            description: "Multiple copy/paste attempts detected. This will be logged.",
            variant: "destructive",
          });
        }
        return newAttempts;
      });
    };

    // Hotkey blocking - only active when not processing visibility changes
    const preventHotkeys = (e: KeyboardEvent) => {
      // Skip this check if we're currently processing a visibility change
      if (isProcessingVisibility) {
        console.log("Skipping hotkey check during visibility processing");
        return;
      }
      
      if (quizCompleted || isSubmissionInProgress || submittingRef.current || !isActiveRef.current) {
        return;
      }
      
      if (e.ctrlKey || e.altKey || e.metaKey) {
        // Allow some essential combinations like Ctrl+Home, Ctrl+End for navigation
        const allowedCombinations = ['Home', 'End'];
        if (!allowedCombinations.includes(e.key)) {
          e.preventDefault();
          toast({
            title: "Hotkey Blocked",
            description: "Keyboard shortcuts are disabled during the quiz.",
            variant: "destructive",
          });
        }
      }
    };

    // Full screen handling with improved error handling
    const enterFullScreen = () => {
      try {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {
            console.error("Error attempting to enable full-screen mode:", err);
            toast({
              title: "Full Screen Error",
              description: "Could not enter full screen mode. Please try manually.",
              variant: "destructive",
            });
          });
        }
        setIsFullScreen(true);
      } catch (err) {
        console.error("Error in enterFullScreen:", err);
      }
    };

    const exitHandler = () => {
      if (!document.fullscreenElement && !quizCompleted && !isSubmissionInProgress && !submittingRef.current && isActiveRef.current) {
        setIsFullScreen(false);
        const newWarnings = warningsRef.current + 1;
        warningsRef.current = newWarnings;
        setWarnings(newWarnings);
        
        toast({
          title: `Warning ${newWarnings}/3`,
          description: `Full-screen mode exited. ${3 - newWarnings} warnings left before automatic submission.`,
          variant: "destructive",
        });
        
        if (newWarnings >= 3) {
          toast({
            title: "Quiz terminated",
            description: "Too many full-screen exits detected. Your quiz has been automatically submitted.",
            variant: "destructive",
          });
          submittingRef.current = true;
          setIsSubmissionInProgress(true);
          
          // Use a timeout to avoid race conditions
          visibilityTimer = window.setTimeout(() => {
            if (isActiveRef.current) {
              submitQuiz();
            }
          }, 500);
        } else {
          // Try to re-enter fullscreen after a brief delay
          visibilityTimer = window.setTimeout(() => {
            if (!isSubmissionInProgress && !submittingRef.current && !quizCompleted && isActiveRef.current) {
              enterFullScreen();
            }
          }, 2000);
        }
      }
    };

    // Enter full screen when starting quiz
    if (!isFullScreen && !quizCompleted && !isSubmissionInProgress && !submittingRef.current) {
      enterFullScreen();
    }

    // Event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("keydown", preventHotkeys);
    document.addEventListener("fullscreenchange", exitHandler);

    // Save initial state to localStorage as a backup
    if (user && id) {
      try {
        localStorage.setItem('quiz_state', JSON.stringify({
          quizId: id,
          userId: user.id,
          warnings: warnings,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.error("Error saving quiz state:", err);
      }
    }

    return () => {
      // Set isActive to false to prevent callbacks from running after unmount
      isActiveRef.current = false;
      
      // Clear any pending timers
      if (visibilityTimer !== null) {
        window.clearTimeout(visibilityTimer);
      }
      
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("keydown", preventHotkeys);
      document.removeEventListener("fullscreenchange", exitHandler);
    };
  }, [
    quizCompleted, 
    isFullScreen, 
    id, 
    user, 
    warnings, 
    submitQuiz, 
    isSubmissionInProgress, 
    isProcessingVisibility,
    tabSwitchTimestamp
  ]);

  if (isLoading) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading quiz...</p>
          
          <div className="mt-8 p-4 bg-muted rounded-lg max-w-md">
            <h3 className="font-medium mb-2">Quiz Proctoring Information</h3>
            <p className="text-sm mb-4">
              This quiz uses advanced proctoring technology to ensure academic integrity.
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2">
              <li>Leaving the quiz tab will be recorded as a violation</li>
              <li>Copy and paste functionality is disabled</li>
              <li>You must remain in full-screen mode</li>
              <li>Keyboard shortcuts are restricted</li>
              <li className="font-medium">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={enableWebcam}
                    onChange={(e) => setEnableWebcam(e.target.checked)}
                    className="mr-2"
                  />
                  Enable webcam monitoring for enhanced security
                </label>
              </li>
            </ul>
            <p className="text-sm mt-4">
              After 3 violations, your quiz will be automatically submitted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (quizError || questionsError) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Quiz</h1>
          <p className="text-muted-foreground">
            There was a problem loading the quiz. Please try again later.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/student")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasAttempted) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Quiz Already Attempted</h1>
          <p className="text-muted-foreground mb-6">
            You have already completed this quiz. Multiple attempts are not allowed.
          </p>
          <Button onClick={() => setLocation("/student")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previous = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (quizCompleted && quizResult) {
    return (
      <div>
        <NavBar />
        <div className="container max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-xl text-muted-foreground">
              Your score: {quizResult.score}% ({quizResult.correctAnswers} of {quizResult.totalQuestions} correct)
            </p>
            <p className="text-md text-muted-foreground mt-1">
              <Trophy className="inline-block mr-1 h-4 w-4 text-yellow-500" />
              You earned {quizResult.pointsEarned} points!
            </p>
          </motion.div>

          {leaderboard && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription>Top performers on this quiz</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 
                            ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                            : index === 1 
                              ? 'bg-gray-100 dark:bg-gray-800/50' 
                              : index === 2 
                                ? 'bg-amber-100 dark:bg-amber-900/20' 
                                : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-bold w-6 text-center">{index + 1}</div>
                          <Avatar>
                            <AvatarFallback>
                              {entry.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{entry.username}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              <span>{entry.correctAnswers} correct</span>
                              <span className="mx-1">•</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{Math.floor(entry.timeTaken / 60)}:{(entry.timeTaken % 60).toString().padStart(2, '0')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{entry.score}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          <div className="flex justify-center mt-8">
            <Button onClick={() => setLocation("/student")}>
              Return to Dashboard
            </Button>
          </div>
        </div>

        {showReview && questions && (
          <QuizReview 
            questions={questions} 
            userAnswers={answers} 
            onClose={() => setShowReview(false)} 
          />
        )}
      </div>
    );
  }

  if (!isLoading && quiz && questions && quiz.quizType === "live" && quiz.isActive) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <WebcamMonitor 
          enabled={enableWebcam && !quizCompleted} 
          onViolationDetected={handleWebcamViolation} 
        />
        
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{quiz.title}</h1>
              <p className="text-muted-foreground">{quiz.description}</p>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <LiveQuizController 
                questions={questions}
                duration={quiz.duration || 30}
                onAnswer={handleAnswer}
                onComplete={submitQuiz}
                userAnswers={answers}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Regular quiz rendering for non-live quizzes
  if (!isLoading && !quizCompleted && quiz) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        
        <WebcamMonitor 
          enabled={enableWebcam && !quizCompleted} 
          onViolationDetected={handleWebcamViolation} 
        />
        
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              <p className="text-muted-foreground mb-4">{quiz.description}</p>
              {warnings > 0 && (
                <p className="text-red-500 mb-2">
                  Warning: Tab switching detected! ({warnings}/3)
                </p>
              )}
              <Progress
                value={((currentQuestion + 1) / questions.length) * 100}
                className="h-2"
              />
            </div>

            {quiz.timeLimit > 0 && (
              <div className="flex justify-end mb-4">
                <CountdownTimer 
                  duration={quiz.timeLimit * 60} 
                  onTimeUp={() => {
                    toast({
                      title: "Time's up!",
                      description: "Your quiz has been automatically submitted.",
                    });
                    submitQuiz();
                  }}
                  className="mb-4"
                />
              </div>
            )}
            
            <QuizProgress 
              currentQuestion={currentQuestion + 1} 
              totalQuestions={questions.length}
              className="mb-6" 
            />
            
            <QuestionTransition 
              id={currentQuestion}
              direction={currentQuestion > 0 ? "right" : "left"}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    Question {currentQuestion + 1}
                  </CardTitle>
                  <CardDescription>
                    {quiz.name} - {quiz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Question
                    question={questions[currentQuestion]}
                    userAnswer={answers[currentQuestion] || ""}
                    onChange={handleAnswer}
                    showResult={false}
                  />
                </CardContent>
              </Card>
            </QuestionTransition>
            
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={previous}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion < questions.length - 1 ? (
                <Button onClick={next}>Next</Button>
              ) : (
                <Button 
                  onClick={() => {
                    if (answers.filter(Boolean).length < questions.length) {
                      const unanswered = questions.length - answers.filter(Boolean).length;
                      
                      if (window.confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`)) {
                        submitQuiz();
                      }
                    } else {
                      submitQuiz();
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <WebcamMonitor 
        enabled={enableWebcam && !quizCompleted} 
        onViolationDetected={handleWebcamViolation} 
      />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-muted-foreground mb-4">{quiz.description}</p>
            {warnings > 0 && (
              <p className="text-red-500 mb-2">
                Warning: Tab switching detected! ({warnings}/3)
              </p>
            )}
            <Progress
              value={((currentQuestion + 1) / questions.length) * 100}
              className="h-2"
            />
          </div>

          {quiz.timeLimit > 0 && (
            <div className="flex justify-end mb-4">
              <CountdownTimer 
                duration={quiz.timeLimit * 60} 
                onTimeUp={() => {
                  toast({
                    title: "Time's up!",
                    description: "Your quiz has been automatically submitted.",
                  });
                  submitQuiz();
                }}
                className="mb-4"
              />
            </div>
          )}
          
          <QuizProgress 
            currentQuestion={currentQuestion + 1} 
            totalQuestions={questions.length}
            className="mb-6" 
          />
          
          <QuestionTransition 
            id={currentQuestion}
            direction={currentQuestion > 0 ? "right" : "left"}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Question {currentQuestion + 1}
                </CardTitle>
                <CardDescription>
                  {quiz.name} - {quiz.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Question
                  question={questions[currentQuestion]}
                  userAnswer={answers[currentQuestion] || ""}
                  onChange={handleAnswer}
                  showResult={false}
                />
              </CardContent>
            </Card>
          </QuestionTransition>
          
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={previous}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            
            {currentQuestion < questions.length - 1 ? (
              <Button onClick={next}>Next</Button>
            ) : (
              <Button 
                onClick={() => {
                  if (answers.filter(Boolean).length < questions.length) {
                    const unanswered = questions.length - answers.filter(Boolean).length;
                    
                    if (window.confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`)) {
                      submitQuiz();
                    }
                  } else {
                    submitQuiz();
                  }
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}