import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  } | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!id || !questions) throw new Error("Quiz ID is required");

      const timeTaken = timeStarted
        ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
        : 0;
      
      const correctAnswers = answers.filter(
        (answer, index) =>
          answer.toLowerCase() === questions[index].correctAnswer.toLowerCase()
      ).length;
      
      const totalQuestions = questions.length;
      const wrongAnswers = totalQuestions - correctAnswers;
      const score = Math.round((correctAnswers / totalQuestions) * 100);

      const result = {
        quizId: parseInt(id),
        score,
        timeTaken,
        totalQuestions,
        correctAnswers,
        wrongAnswers
      };

      setQuizResult(result);

      // Mark the attempt as completed
      if (user) {
        completeAttempt(parseInt(id), user.id);
      }

      const res = await apiRequest("POST", `/api/quizzes/${id}/results`, result);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results/user"] });
      refetchLeaderboard();
      setQuizCompleted(true);
      toast({
        title: "Quiz submitted",
        description: "Your results have been recorded!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWebcamViolation = useCallback(() => {
    setWarnings(prev => {
      const newWarnings = prev + 1;
      
      if (newWarnings >= 3) {
        toast({
          title: "Quiz terminated",
          description: "Multiple people detected. Your quiz has been automatically submitted.",
          variant: "destructive",
        });
        submitMutation.mutate();
      }
      
      return newWarnings;
    });
  }, [submitMutation, toast]);

  useEffect(() => {
    setTimeStarted(new Date());

    // Tab switching detection
    const handleVisibilityChange = () => {
      if (document.hidden && !quizCompleted) {
        setWarnings((w) => {
          const newWarnings = w + 1;
          toast({
            title: `Warning ${newWarnings}/3`,
            description: `Tab switching detected. ${3 - newWarnings} warnings left before automatic submission.`,
            variant: "destructive",
          });
          
          if (newWarnings >= 3) {
            toast({
              title: "Quiz terminated",
              description: "Too many tab switches detected. Your quiz has been automatically submitted.",
              variant: "destructive",
            });
            submitMutation.mutate();
          }
          return newWarnings;
        });
      }
    };

    // Copy-paste prevention
    const preventCopyPaste = (e: ClipboardEvent) => {
      if (!quizCompleted) {
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
      }
    };

    // Hotkey blocking
    const preventHotkeys = (e: KeyboardEvent) => {
      if (!quizCompleted && (e.ctrlKey || e.altKey || e.metaKey)) {
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

    // Full screen handling
    const enterFullScreen = () => {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
      setIsFullScreen(true);
    };

    const exitHandler = () => {
      if (!document.fullscreenElement && !quizCompleted) {
        setIsFullScreen(false);
        setWarnings(prev => {
          const newWarnings = prev + 1;
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
            submitMutation.mutate();
          }
          return newWarnings;
        });
      }
    };

    // Enter full screen when starting quiz
    if (!isFullScreen && !quizCompleted) {
      enterFullScreen();
    }

    // Event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("keydown", preventHotkeys);
    document.addEventListener("fullscreenchange", exitHandler);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("keydown", preventHotkeys);
      document.removeEventListener("fullscreenchange", exitHandler);
    };
  }, [quizCompleted, isFullScreen]);

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
        <div className="container mx-auto p-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-8 text-center">Quiz Results</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                    Your Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{quizResult.score}%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    Time Taken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">
                    {Math.floor(quizResult.timeTaken / 60)}:{(quizResult.timeTaken % 60).toString().padStart(2, '0')}
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setShowReview(true)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Correct Answers
                    <Search className="ml-auto h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <p className="text-4xl font-bold">{quizResult.correctAnswers}</p>
                  <p className="text-lg text-muted-foreground">of {quizResult.totalQuestions}</p>
                </CardContent>
              </Card>
            </div>
            
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
          </motion.div>
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
                onComplete={() => submitMutation.mutate()}
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

            {questions[currentQuestion] && (
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Question
                  question={questions[currentQuestion]}
                  onChange={(value: string) => handleAnswer(value)}
                  answer={answers[currentQuestion]}
                  mode="take"
                />
              </motion.div>
            )}

            <div className="flex justify-between mt-8">
              <Button onClick={previous} disabled={currentQuestion === 0}>
                Previous
              </Button>
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button
                  onClick={next}
                  disabled={!answers[currentQuestion]}
                >
                  Next
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

          {questions[currentQuestion] && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Question
                question={questions[currentQuestion]}
                onChange={(value: string) => handleAnswer(value)}
                answer={answers[currentQuestion]}
                mode="take"
              />
            </motion.div>
          )}

          <div className="flex justify-between mt-8">
            <Button onClick={previous} disabled={currentQuestion === 0}>
              Previous
            </Button>
            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={next}
                disabled={!answers[currentQuestion]}
              >
                Next
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}