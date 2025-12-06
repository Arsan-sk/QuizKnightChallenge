import { useState, useEffect, useCallback, ReactNode } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Quiz, Question as QuestionType, User } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizProgress } from "@/components/ui/quiz-progress";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { QuestionTransition } from "@/components/ui/question-transition";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Trophy, Clock, CheckCircle, XCircle, Search, FileQuestion, ArrowLeft, ArrowRight, Send, HelpCircle, Keyboard, Award, ClipboardCheck, ListChecks, Medal, Home, X, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { formatTimeTaken, cn } from "@/lib/utils";

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
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [warnings, setWarnings] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [enableWebcam, setEnableWebcam] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [rulesTimer, setRulesTimer] = useState(5);
  const [readyToStart, setReadyToStart] = useState(false);
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
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);

  const {
    data: quiz,
    isError: quizError,
    isLoading
  } = useQuery({
    queryKey: [`/api/quizzes/${id}`],
  });

  const {
    data: questions,
    isError: questionsError
  } = useQuery({
    queryKey: [`/api/quizzes/${id}/questions`],
  });

  const {
    data: leaderboard,
    refetch: refetchLeaderboard
  } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/quizzes/${id}/leaderboard`],
    enabled: quizCompleted,
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const typedUser = user as User;
  const typedQuiz = quiz as Quiz;
  const typedQuestions = questions as QuestionType[];

  useEffect(() => {
    if (user && 'id' in user && id) {
      const userId = (user as User).id;
      const attempted = hasAttemptedQuiz(parseInt(id), userId);
      setHasAttempted(attempted);

      if (attempted) {
        toast({
          title: "Quiz already attempted",
          description: "You have already completed this quiz. Multiple attempts are not allowed.",
          variant: "destructive",
        });
      } else {
        registerAttempt(parseInt(id), userId);
      }
    }
  }, [user, id, toast]);

  useEffect(() => {
    if (!timeStarted && questions && Array.isArray(questions) && questions.length > 0 && !showRules) {
      console.log('Quiz started at:', new Date());
      setTimeStarted(new Date());
    }
  }, [timeStarted, questions, showRules]);

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (showRules && rulesTimer > 0 && !readyToStart) {
      timerId = setTimeout(() => {
        setRulesTimer(prev => prev - 1);
      }, 1000);
    } else if (rulesTimer === 0 && !readyToStart) {
      setReadyToStart(true);
    }
    return () => clearTimeout(timerId);
  }, [showRules, rulesTimer, readyToStart]);

  // Enhance the refetchLeaderboard call to handle rejections
  const safeRefetchLeaderboard = useCallback(async () => {
    try {
      await refetchLeaderboard();
    } catch (error) {
      console.error('Error refetching leaderboard:', error);
      // Don't let this error block quiz completion
    }
  }, [refetchLeaderboard]);

  // Update submitQuiz to use the safe refetch
  const submitQuiz = useCallback(async () => {
    try {
      if (!questions || !Array.isArray(questions) || questions.length === 0 || !timeStarted || !user || !('id' in user)) {
        console.error("Missing required data for quiz submission", {
          hasQuestions: !!questions && Array.isArray(questions),
          questionsLength: questions?.length || 0,
          hasTimeStarted: !!timeStarted,
          timeStarted: timeStarted?.toISOString(),
          hasUser: !!user
        });
        return;
      }

      setSubmitting(true);

      let correctCount = 0;
      let wrongCount = 0;
      let pointsEarned = 0;

      const questionsArray = questions as QuestionType[];

      for (let i = 0; i < questionsArray.length; i++) {
        const question = questionsArray[i];
        if (answers[i] === question?.correctAnswer) {
          correctCount++;
          pointsEarned += (question.points || 2);
        } else if (answers[i]) {
          wrongCount++;
        }
      }

      const totalQuestions = questionsArray.length;
      const scorePercentage = (correctCount / totalQuestions) * 100;

      const endTime = new Date();
      const timeTaken = Math.max(1, Math.floor((endTime.getTime() - (timeStarted?.getTime() || 0)) / 1000));
      console.log('Quiz completed at:', endTime);
      console.log('Time taken (seconds):', timeTaken);

      try {
        await apiRequest(
          'POST',
          `/api/quizzes/${id}/results`,
          {
            quizId: parseInt(id as string),
            score: Math.round(scorePercentage),
            timeTaken: timeTaken,
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            totalQuestions: totalQuestions,
            pointsEarned: pointsEarned
          }
        );

        setQuizResult({
          score: Math.round(scorePercentage),
          timeTaken: timeTaken,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          totalQuestions: totalQuestions,
          pointsEarned: pointsEarned
        });

        if (id) {
          completeAttempt(parseInt(id), (user as User).id);
        }

        await safeRefetchLeaderboard();
        setQuizCompleted(true);
      } catch (error) {
        console.error('Error submitting quiz:', error);
        throw error; // Rethrow to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error submitting quiz",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [questions, timeStarted, user, answers, id, safeRefetchLeaderboard, toast]);

  const handleWebcamViolation = useCallback(() => {
    setWarnings(prev => {
      const newWarnings = prev + 1;

      if (newWarnings >= 3) {
        toast({
          title: "Quiz terminated",
          description: "Multiple people detected. Your quiz has been automatically submitted.",
          variant: "destructive",
        });
        submitQuiz();
      }

      return newWarnings;
    });
  }, [toast, submitQuiz]);

  // Memoize the handleVisibilityChange function to prevent re-renders
  const handleVisibilityChange = useCallback(() => {
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
          submitQuiz();
        }
        return newWarnings;
      });
    }
  }, [quizCompleted, toast, submitQuiz]);

  // Memoize the preventCopyPaste function
  const preventCopyPaste = useCallback((e: ClipboardEvent) => {
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
  }, [quizCompleted, toast]);

  // Memoize the preventHotkeys function
  const preventHotkeys = useCallback((e: KeyboardEvent) => {
    if (!quizCompleted && (e.ctrlKey || e.altKey || e.metaKey)) {
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
  }, [quizCompleted, toast]);

  // Memoize the enterFullScreen function
  const enterFullScreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen()
        .catch(err => {
          console.error('Error attempting to enable full-screen mode:', err);
          // Don't set isFullScreen to true if there was an error
          toast({
            title: "Full-screen mode failed",
            description: "Could not enter full-screen mode. You can continue with the quiz, but be aware that tab switching is still monitored.",
            variant: "destructive",
          });
        })
        .then(() => {
          // Only set isFullScreen after successful fullscreen request
          setIsFullScreen(true);
        });
    } else {
      setIsFullScreen(true); // Still set to true for browsers without fullscreen API
    }
  }, [toast]);

  // Memoize the exitHandler function
  const exitHandler = useCallback(() => {
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
          submitQuiz();
        }
        return newWarnings;
      });
    }
  }, [quizCompleted, toast, submitQuiz]);

  // Update the useEffect to use memoized functions
  useEffect(() => {
    if (!isFullScreen && !quizCompleted) {
      enterFullScreen();
    }

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
  }, [quizCompleted, isFullScreen, handleVisibilityChange, preventCopyPaste, preventHotkeys, enterFullScreen, exitHandler]);

  // Memoize all key functions that are used in useEffect dependencies
  const handleAnswer = useCallback((answer: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answer;
      return newAnswers;
    });
  }, [currentQuestion]);

  const next = useCallback(() => {
    if (!typedQuestions) return;

    if (currentQuestion < typedQuestions.length - 1) {
      setDirection("right");
      setCurrentQuestion(prev => prev + 1);
    }
  }, [currentQuestion, typedQuestions]);

  const previous = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection("left");
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion]);

  // Memoize the handleQuizSubmission function
  const handleQuizSubmission = useCallback(() => {
    if (!typedQuestions) return;

    const answeredCount = answers.filter(Boolean).length;
    const unansweredCount = typedQuestions.length - answeredCount;

    if (unansweredCount > 0) {
      const unansweredQuestions = typedQuestions
        .map((_, index) => !answers[index] ? index + 1 : null)
        .filter(Boolean as any)
        .join(', ');

      if (confirm(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}:\n\n` +
        `Question${unansweredCount > 1 ? 's' : ''} ${unansweredQuestions}\n\n` +
        `Would you like to submit anyway? You won't be able to change your answers later.`
      )) {
        submitQuiz();
      }
    } else {
      if (confirm('Are you ready to submit your quiz? You won\'t be able to change your answers after submission.')) {
        submitQuiz();
      }
    }
  }, [answers, typedQuestions, submitQuiz]);

  // Memoize the keydown handler to prevent unnecessary re-renders
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If we're within an input field or quiz is completed or showing rules, don't process keyboard shortcuts
    if (quizCompleted || showRules) return;

    const activeElement = document.activeElement;
    const isInputActive = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement;

    if (isInputActive) return;

    // Make sure typedQuestions is defined
    if (!typedQuestions) return;

    // Prevent handling of shortcuts that are already handled by the preventHotkeys function
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    let handled = true;

    switch (e.key) {
      case 'ArrowLeft':
        setCurrentQuestion(prev => {
          if (prev > 0) return prev - 1;
          return prev;
        });
        break;
      case 'ArrowRight':
        setCurrentQuestion(prev => {
          if (prev < typedQuestions.length - 1) return prev + 1;
          return prev;
        });
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        const numKey = parseInt(e.key);
        setCurrentQuestion(currentQ => {
          const currentOptions = typedQuestions[currentQ]?.options;
          if (currentOptions && numKey <= currentOptions.length) {
            setAnswers(prev => {
              const newAnswers = [...prev];
              newAnswers[currentQ] = currentOptions[numKey - 1];
              return newAnswers;
            });
          }
          return currentQ;
        });
        break;
      case 'Enter':
        setCurrentQuestion(currentQ => {
          if (currentQ === typedQuestions.length - 1) {
            // Use the memoized handleQuizSubmission
            handleQuizSubmission();
            return currentQ;
          } else {
            return currentQ + 1;
          }
        });
        break;
      default:
        handled = false;
        break;
    }

    // If we handled the key, prevent it from bubbling up to other handlers
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [quizCompleted, showRules, typedQuestions, handleQuizSubmission, setAnswers]);

  // Simplify the effect to use only the memoized function
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Add this before the return statement to track user progress
  const answeredQuestions = answers.filter(Boolean).length;
  const remainingQuestions = (typedQuestions?.length || 0) - answeredQuestions;
  const percentComplete = (typedQuestions?.length || 1) > 0
    ? Math.round((answeredQuestions / (typedQuestions?.length || 1)) * 100)
    : 0;

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
          <Button className="mt-4" onClick={() => setLocation(typedUser?.role === "teacher" ? "/teacher" : "/student")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz || !questions || !Array.isArray(questions) || questions.length === 0) {
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
          <Button onClick={() => setLocation(typedUser?.role === "teacher" ? "/teacher" : "/student")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (quizCompleted && quizResult) {
    const toggleQuestionDetails = () => {
      setShowQuestionDetails(!showQuestionDetails);
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
              className="mb-8 text-center"
            >
              <motion.div
                className="inline-flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
              >
                <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
              <p className="text-muted-foreground">
                Great job! You've completed the quiz. Here's your performance.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.03 }}
                className="h-full"
              >
                <Card className="overflow-hidden border-t-4 border-primary h-full flex flex-col shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Award className="mr-2 h-5 w-5 text-primary" />
                      Your Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center flex-grow flex flex-col justify-center pb-6">
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.5 }}
                      className="relative"
                    >
                      <div className="relative inline-flex mb-1">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold">{quizResult.score}%</span>
                        </div>
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            className="text-muted/20 stroke-current"
                            strokeWidth="10"
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                          />
                          <motion.circle
                            className="text-primary stroke-current"
                            strokeWidth="10"
                            strokeLinecap="round"
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            strokeDasharray="251.2"
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * quizResult.score) / 100 }}
                            transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                          />
                        </svg>
                        <motion.div
                          className="absolute w-3 h-3 bg-primary rounded-full"
                          style={{
                            top: "50%",
                            left: "50%",
                            x: "-50%",
                            y: "-50%",
                            rotate: -90 + ((quizResult.score / 100) * 360) + "deg",
                            transformOrigin: "40px 0px"
                          }}
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            delay: 2.2,
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        />
                      </div>
                    </motion.div>
                    <p className="text-muted-foreground text-sm mt-2">
                      {quizResult.correctAnswers} correct out of {quizResult.totalQuestions} questions
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="h-full"
              >
                <Card className="overflow-hidden border-t-4 border-amber-500 h-full flex flex-col shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Clock className="mr-2 h-5 w-5 text-amber-500" />
                      Time Taken
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center flex-grow flex flex-col justify-center pb-6">
                    <motion.div className="relative mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                      <motion.p
                        className="text-4xl font-bold mb-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        {formatTimeTaken(quizResult.timeTaken)}
                      </motion.p>
                      <motion.div
                        className="absolute -right-1 -top-1 w-2 h-2 bg-amber-400 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    </motion.div>
                    <p className="text-muted-foreground text-sm">
                      {quizResult.timeTaken < 60
                        ? "That was quick!"
                        : quizResult.timeTaken < 180
                          ? "Good timing!"
                          : "Take your time, accuracy matters!"
                      }
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className="h-full"
              >
                <Card
                  className="overflow-hidden border-t-4 border-blue-500 cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col shadow-md relative"
                  onClick={toggleQuestionDetails}
                >
                  <motion.div
                    className="absolute right-3 top-3 w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <ClipboardCheck className="mr-2 h-5 w-5 text-blue-500" />
                      Question Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center flex-grow flex flex-col justify-center pb-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="bg-green-50 px-3 py-1 rounded-full flex items-center relative">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-green-700 font-medium">{quizResult.correctAnswers}</span>
                          <motion.div
                            className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              duration: 1.8,
                              repeat: Infinity,
                              repeatType: "reverse",
                              delay: 0.5
                            }}
                          />
                        </div>
                        <div className="bg-red-50 px-3 py-1 rounded-full flex items-center relative">
                          <XCircle className="h-4 w-4 text-red-600 mr-1" />
                          <span className="text-red-700 font-medium">{quizResult.wrongAnswers}</span>
                          <motion.div
                            className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                              duration: 1.8,
                              repeat: Infinity,
                              repeatType: "reverse",
                              delay: 1
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        Click to {showQuestionDetails ? "hide" : "review"} answers
                      </p>
                    </motion.div>
                  </CardContent>
                  <motion.div
                    className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none opacity-0"
                    animate={{
                      opacity: [0, 0.2, 0],
                      scale: [0.95, 1, 0.95]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  />
                </Card>
              </motion.div>
            </div>

            {leaderboard && leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-8"
              >
                <Card className="bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                  <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-primary" />
                      Leaderboard
                    </CardTitle>
                    <CardDescription>
                      See how you compare with other participants
                    </CardDescription>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left px-4 py-3 font-medium">Rank</th>
                          <th className="text-left px-4 py-3 font-medium">Student</th>
                          <th className="text-center px-4 py-3 font-medium">Score</th>
                          <th className="text-center px-4 py-3 font-medium">Time</th>
                          <th className="text-center px-4 py-3 font-medium">Correct</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, index) => {
                          const isCurrentUser = entry.userId === typedUser?.id;

                          return (
                            <motion.tr
                              key={entry.id}
                              className={cn(
                                "border-b border-muted/40",
                                isCurrentUser ? "bg-primary/5 font-medium" : ""
                              )}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 + (index * 0.05) }}
                            >
                              <td className="px-4 py-3">
                                {index === 0 ? (
                                  <div className="inline-flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 h-7 w-7">
                                    <Trophy className="h-4 w-4 text-amber-600" />
                                  </div>
                                ) : index === 1 ? (
                                  <div className="inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 h-7 w-7">
                                    <Medal className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </div>
                                ) : index === 2 ? (
                                  <div className="inline-flex items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50 h-7 w-7">
                                    <Medal className="h-4 w-4 text-amber-800 dark:text-amber-600" />
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">{index + 1}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className={isCurrentUser ? "bg-primary text-white" : ""}>{entry.username[0].toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span>{entry.username}</span>
                                  {isCurrentUser && (
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">You</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center px-4 py-3">{entry.score}%</td>
                              <td className="text-center px-4 py-3">{formatTimeTaken(entry.timeTaken)}</td>
                              <td className="text-center px-4 py-3">{entry.correctAnswers}/{entry.totalQuestions}</td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {showQuestionDetails && (
              <motion.div
                className="space-y-4 mb-8"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Question Review</h2>
                  <Button variant="outline" size="sm" onClick={toggleQuestionDetails}>
                    <X className="h-4 w-4 mr-2" />
                    Close Review
                  </Button>
                </div>

                {questions.map((question, index) => {
                  const userAnswer = answers[index] || "";
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className={cn(
                        "overflow-hidden border-l-4",
                        isCorrect ? "border-l-green-500" : "border-l-red-500"
                      )}>
                        <CardContent className="p-4 relative">
                          <div className="absolute top-2 right-2">
                            {isCorrect ? (
                              <span className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full text-xs flex items-center">
                                +2
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 font-medium px-3 py-1 rounded-full text-xs flex items-center">
                                0
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-medium mt-1 mb-3 pr-12">
                            Question {index + 1}: {question.questionText}
                          </h3>

                          <div className="space-y-2">
                            {question.options.map(option => {
                              const isUserChoice = option === userAnswer;
                              const isCorrectOption = option === question.correctAnswer;

                              return (
                                <div
                                  key={option}
                                  className={cn(
                                    "p-2 rounded-md flex items-center",
                                    isCorrectOption ? "bg-green-50 border border-green-200" : "",
                                    isUserChoice && !isCorrectOption ? "bg-red-50 border border-red-200" : "",
                                    !isUserChoice && !isCorrectOption ? "bg-muted/30 border border-muted" : ""
                                  )}
                                >
                                  {isCorrectOption && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                                  {isUserChoice && !isCorrectOption && <XCircle className="h-4 w-4 mr-2 text-red-600" />}
                                  {!isUserChoice && !isCorrectOption && <Circle className="h-4 w-4 mr-2 text-muted-foreground" />}

                                  <span className={isCorrectOption ? "font-medium" : ""}>{option}</span>

                                  {isUserChoice && (
                                    <span className="ml-auto text-xs font-medium">Your choice</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href={typedUser?.role === "teacher" ? "/teacher" : "/student"}>
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (typedQuiz.quizType === "live" && typedQuiz.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <NavBar />

        <WebcamMonitor
          enabled={enableWebcam && !quizCompleted}
          onViolationDetected={handleWebcamViolation}
        />

        <div className="container max-w-5xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{typedQuiz.title}</h1>
              <p className="text-muted-foreground">{typedQuiz.description}</p>
            </div>

            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <LiveQuizController
                questions={typedQuestions}
                duration={typedQuiz.duration || 30}
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

  if (!quizCompleted) {
    if (showRules) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
          <NavBar />
          <div className="container mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="mb-6 border-2 border-primary/20 overflow-hidden">
                <CardHeader className="border-b bg-muted/50 relative">
                  <motion.div
                    className="absolute top-0 left-0 h-1 bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: readyToStart ? "100%" : `${(5 - rulesTimer) * 20}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  <CardTitle className="text-2xl text-center">
                    Quiz Rules & Instructions
                  </CardTitle>
                  <CardDescription className="text-center">
                    Please read carefully before starting the quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3 className="text-lg font-semibold">{typedQuiz.title}</h3>
                      <p className="text-muted-foreground">{typedQuiz.description}</p>
                    </motion.div>

                    <motion.div
                      className="my-6"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" x2="12" y1="8" y2="12"></line>
                          <line x1="12" x2="12.01" y1="16" y2="16"></line>
                        </svg>
                        Important Rules:
                      </h4>
                      <ul className="space-y-3 pl-5">
                        {[
                          `You will have ${typedQuiz.duration ? `${typedQuiz.duration} minutes` : "unlimited time"} to complete this quiz.`,
                          `There are ${typedQuestions.length} questions in total.`,
                          "You must remain in full-screen mode throughout the quiz.",
                          "Switching tabs or windows will result in warnings.",
                          "After 3 violations, your quiz will be automatically submitted.",
                          "You may navigate between questions using the Next and Previous buttons.",
                          "Click anywhere on an answer to select it - not just the radio button.",
                          "Your answers are saved as you navigate between questions.",
                          "Use keyboard shortcuts: Left/Right arrows to navigate, number keys (1-4) to select options, Enter to continue"
                        ].map((rule, index) => (
                          <motion.li
                            key={index}
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (index * 0.05) }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                              <polyline points="9 11 12 14 22 4"></polyline>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            {rule}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>

                    <motion.div
                      className="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <h4 className="font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mr-2">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                          <path d="M12 9v4"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                        Academic Integrity Notice
                      </h4>
                      <p className="mt-2 text-sm">
                        This quiz uses advanced proctoring technology. Attempts to cheat, copy content, or seek outside help may result in disciplinary action.
                      </p>
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter className="border-t py-4 bg-muted/30 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <motion.span
                      className="text-sm font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {readyToStart ? "Ready to begin" : `Please wait: ${rulesTimer} seconds remaining`}
                    </motion.span>
                  </div>
                  <motion.div
                    whileHover={readyToStart ? { scale: 1.05 } : {}}
                    whileTap={readyToStart ? { scale: 0.95 } : {}}
                  >
                    <Button
                      onClick={() => setShowRules(false)}
                      disabled={!readyToStart}
                      className="w-32 relative overflow-hidden group"
                    >
                      {readyToStart && (
                        <motion.div
                          className="absolute inset-0 bg-primary/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                      )}
                      {readyToStart ? "Start Quiz" : "Please Wait..."}
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>

              <motion.div
                className="mt-8 text-center text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <p>By starting this quiz, you agree to the academic integrity guidelines of your institution.</p>
                <p className="mt-2">Need help? Contact your instructor for assistance.</p>

                <div className="mt-6 flex justify-center gap-4">
                  <div className="p-3 rounded-full bg-muted/30 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3c.53 0 1.04.21 1.41.59L21 11a2 2 0 0 1 0 2.82L13.4 21.41a2 2 0 0 1-2.82 0L3 13.82a2 2 0 0 1 0-2.82L10.6 3.59a1.99 1.99 0 0 1 1.4-.59Z"></path>
                      <path d="m8 12 2 2 6-6"></path>
                    </svg>
                  </div>
                  <div className="p-3 rounded-full bg-muted/30 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m8 12 2 2 6-6"></path>
                    </svg>
                  </div>
                  <div className="p-3 rounded-full bg-muted/30 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <NavBar />

        <WebcamMonitor
          enabled={enableWebcam && !quizCompleted}
          onViolationDetected={handleWebcamViolation}
        />

        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Quiz Header */}
            <motion.div
              className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <h1 className="text-3xl font-bold mb-1">{typedQuiz?.title}</h1>
                <p className="text-muted-foreground">{typedQuiz?.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {typedQuiz?.duration && typedQuiz.duration > 0 && (
                  <div className="bg-white dark:bg-slate-950 shadow-sm rounded-lg p-2 px-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <CountdownTimer
                      duration={typedQuiz.duration * 60}
                      onTimeUp={() => {
                        toast({
                          title: "Time's up!",
                          description: "Your quiz has been automatically submitted.",
                        });
                        submitQuiz();
                      }}
                    />
                  </div>
                )}

                <div className="bg-white dark:bg-slate-950 shadow-sm rounded-lg p-2 px-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="12" y1="16" x2="12" y2="16.01" />
                  </svg>
                  <span className="text-sm font-medium">
                    {typedQuestions?.length || 0} Questions
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-950 shadow-sm rounded-lg p-2 px-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-medium">
                    {percentComplete}% Complete
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div
              className="bg-white dark:bg-slate-950 rounded-xl shadow-sm mb-6 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex items-center justify-center bg-primary/10 text-primary w-10 h-10 rounded-full"
                    animate={{
                      scale: [1, 1.05, 1],
                      backgroundColor: percentComplete === 100 ? ["rgba(22, 163, 74, 0.1)", "rgba(22, 163, 74, 0.2)", "rgba(22, 163, 74, 0.1)"] : undefined
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <span className="font-medium">{currentQuestion + 1}</span>
                  </motion.div>

                  <div>
                    <h2 className="font-medium text-sm">
                      Question {currentQuestion + 1} of {typedQuestions?.length || 0}
                    </h2>
                    <div className="text-xs text-muted-foreground">
                      {remainingQuestions === 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">All questions answered</span>
                      ) : (
                        <span>{remainingQuestions} question{remainingQuestions !== 1 ? 's' : ''} remaining</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2.5 mb-6">
                  <motion.div
                    className="bg-primary h-2.5 rounded-full"
                    initial={{ width: `${(currentQuestion / (typedQuestions?.length || 1)) * 100}%` }}
                    animate={{ width: `${((currentQuestion + 1) / (typedQuestions?.length || 1)) * 100}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  ></motion.div>
                </div>

                {/* Question Navigation Dots */}
                <div className="flex flex-wrap gap-2">
                  {typedQuestions?.map((_, index) => (
                    <motion.button
                      key={`nav-${index}`}
                      onClick={() => {
                        setDirection(index > currentQuestion ? "right" : "left");
                        setCurrentQuestion(index);
                      }}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full text-xs transition-all",
                        currentQuestion === index
                          ? "bg-primary text-white"
                          : answers[index]
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={currentQuestion === index ? {
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.5, repeat: 3, repeatType: "mirror" }
                      } : {}}
                    >
                      {index + 1}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Main Question Content */}
            <AnimatePresence mode="wait">
              <QuestionTransition
                key={currentQuestion}
                id={currentQuestion}
                direction={direction}
              >
                <motion.div
                  className="bg-white dark:bg-slate-950 rounded-xl shadow-sm p-6 md:p-8 mb-6 relative"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {typedQuestions && typedQuestions[currentQuestion] ? (
                    <Question
                      question={typedQuestions[currentQuestion]}
                      mode="take"
                      onChange={handleAnswer}
                      userAnswer={answers[currentQuestion] || ""}
                    />
                  ) : (
                    <div className="py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p>Loading question...</p>
                    </div>
                  )}
                </motion.div>
              </QuestionTransition>
            </AnimatePresence>

            {/* Navigation Controls */}
            <motion.div
              className="flex items-center justify-between mt-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={previous}
                  disabled={currentQuestion === 0}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              </motion.div>

              <div className="text-sm text-muted-foreground hidden md:block">
                {currentQuestion < (typedQuestions?.length || 0) - 1 ? (
                  <span>Press <kbd className="px-2 py-1 bg-muted rounded border text-xs">→</kbd> for next question</span>
                ) : (
                  <span>Last question! Ready to submit?</span>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {currentQuestion < (typedQuestions?.length || 0) - 1 ? (
                  <Button
                    onClick={next}
                    size="lg"
                    className="gap-2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleQuizSubmission}
                    disabled={submitting}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Quiz
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            </motion.div>

            {/* Keyboard Shortcuts Guide */}
            <motion.div
              className="bg-muted/40 border rounded-lg p-4 mt-4 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
                  <path d="M6 8h.001" />
                  <path d="M10 8h.001" />
                  <path d="M14 8h.001" />
                  <path d="M18 8h.001" />
                  <path d="M8 12h.001" />
                  <path d="M12 12h.001" />
                  <path d="M16 12h.001" />
                  <path d="M7 16h10" />
                </svg>
                <span className="font-medium">Keyboard Shortcuts:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border shadow-sm text-[10px] mr-1.5">←</kbd>
                  <span>Previous</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border shadow-sm text-[10px] mr-1.5">→</kbd>
                  <span>Next</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border shadow-sm text-[10px] mr-1.5">1-4</kbd>
                  <span>Select option</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-background rounded border shadow-sm text-[10px] mr-1.5">Enter</kbd>
                  <span>Next/Submit</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <NavBar />
      <div className="container mx-auto p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Loading Quiz</h1>
        <p className="text-muted-foreground">
          Please wait while we load your quiz...
        </p>
      </div>
    </div>
  );

}