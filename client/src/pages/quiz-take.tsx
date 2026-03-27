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
import { Loader2, Trophy, Clock, CheckCircle, XCircle, Search, FileQuestion, ArrowLeft, ArrowRight, Send, HelpCircle, Keyboard, Award, ClipboardCheck, ListChecks, Medal, Home, X, Circle, Sun, Moon, AlertTriangle, Sword } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// NavBar removed per request
import { useToast } from "@/hooks/use-toast";
import { useTheme } from '@/hooks/use-theme';
import { CameraIntegrityCheck } from '@/components/proctoring/CameraIntegrityCheck';
import { QuizReview } from "@/components/quiz/QuizReview";
// import { WebcamMonitor } from "@/components/quiz/WebcamMonitor"; // Deprecated
import { ProctoringWarningOverlay } from "@/components/proctoring/ProctoringWarningOverlay";
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
  const [enableWebcam, setEnableWebcam] = useState(true); // Enable by default for security
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
  // Use `showReview` to present the question review overlay/modal.
  // Proctoring lifecycle flags (explicit control)
  const [cameraCheckComplete, setCameraCheckComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  // `proctoringActive` MUST follow `quizStarted` (activation rule)
  const [proctoringActive, setProctoringActive] = useState(false);

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
      // mark quizStarted once the rules are dismissed and questions are ready
      setQuizStarted(true);
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
    // stop proctoring immediately when submission starts
    setProctoringActive(false);

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

      const questionsArray = questions as QuestionType[];

      // Local counts for quick feedback — server will compute authoritative scoring.
      for (let i = 0; i < questionsArray.length; i++) {
        const question = questionsArray[i];
        if (answers[i] === question?.correctAnswer) {
          correctCount++;
        } else if (answers[i]) {
          wrongCount++;
        }
      }

      const totalQuestions = questionsArray.length;

      const endTime = new Date();
      const timeTaken = Math.max(1, Math.floor((endTime.getTime() - (timeStarted?.getTime() || 0)) / 1000));
      console.log('Quiz completed at:', endTime);
      console.log('Time taken (seconds):', timeTaken);


      try {
        const res = await apiRequest(
          'POST',
          `/api/quizzes/${id}/results`,
          {
            quizId: parseInt(id as string),
            userAnswers: answers,
            timeTaken: timeTaken,
          }
        );

        const created = await res.json();

        setQuizResult({
          score: created.score,
          timeTaken: created.timeTaken,
          correctAnswers: created.correctAnswers,
          wrongAnswers: created.wrongAnswers,
          totalQuestions: created.totalQuestions,
          pointsEarned: created.pointsEarned
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
    // Ignore webcam violations once proctoring has been disabled
    if (!proctoringActive) return;

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
    if (!proctoringActive) return;

    if (document.hidden) {
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
  }, [proctoringActive, toast, submitQuiz]);

  // Memoize the preventCopyPaste function
  const preventCopyPaste = useCallback((e: ClipboardEvent) => {
    if (!proctoringActive) return;
    if (!quizCompleted) {
      e.preventDefault();
      setWarnings(prev => {
        const newWarnings = prev + 1;
        toast({
          title: `Warning ${newWarnings}/3`,
          description: `Copy/Paste detected. ${3 - newWarnings} warnings left before automatic submission.`,
          variant: "destructive",
        });

        if (newWarnings >= 3) {
          toast({
            title: "Quiz terminated",
            description: "Persistent copy/paste attempts detected. Your quiz has been automatically submitted.",
            variant: "destructive",
          });
          submitQuiz();
        }
        return newWarnings;
      });
    }
  }, [proctoringActive, quizCompleted, toast, submitQuiz]);

  // Memoize the preventHotkeys function
  const preventHotkeys = useCallback((e: KeyboardEvent) => {
    if (!proctoringActive) return;

    if (!quizCompleted && (e.ctrlKey || e.altKey || e.metaKey)) {
      const allowedCombinations = ['Home', 'End'];
      if (!allowedCombinations.includes(e.key)) {
        e.preventDefault();

        setWarnings(prev => {
          const newWarnings = prev + 1;
          toast({
            title: `Warning ${newWarnings}/3`,
            description: `Restricted hotkey detected. ${3 - newWarnings} warnings left before automatic submission.`,
            variant: "destructive",
          });

          if (newWarnings >= 3) {
            toast({
              title: "Quiz terminated",
              description: "Persistent violation of restrictions. Your quiz has been automatically submitted.",
              variant: "destructive",
            });
            submitQuiz();
          }
          return newWarnings;
        });
      }
    }
  }, [proctoringActive, quizCompleted, toast]);

  // Memoize the enterFullScreen function
  const enterFullScreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen()
        .then(() => {
          // Only set isFullScreen after successful fullscreen request
          setIsFullScreen(true);
        })
        .catch(err => {
          console.error('Error attempting to enable full-screen mode:', err);
          // Don't set isFullScreen to true if there was an error
          toast({
            title: "Full-screen mode failed",
            description: "Could not enter full-screen mode. You can continue with the quiz, but be aware that tab switching is still monitored.",
            variant: "destructive",
          });
        });
    } else {
      setIsFullScreen(true); // Still set to true for browsers without fullscreen API
    }
  }, [toast]);

  // Memoize the exitHandler function
  const exitHandler = useCallback(() => {
    if (!proctoringActive) return;

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
  }, [proctoringActive, quizCompleted, toast, submitQuiz]);

  // Ensure proctoringActive strictly follows quizStarted (activation rule)
  useEffect(() => {
    setProctoringActive(quizStarted === true);
  }, [quizStarted]);

  // Update the useEffect to use memoized functions
  useEffect(() => {
    // Attach proctoring listeners only while proctoringActive.
    if (!proctoringActive) return;

    // Do not attempt fullscreen automatically here (must be user gesture).

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
  }, [proctoringActive, isFullScreen, handleVisibilityChange, preventCopyPaste, preventHotkeys, enterFullScreen, exitHandler]);

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
    // Open the modal-based question review
    const openQuestionReview = () => setShowReview(true);

    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500/30">
        {/* Glow Effects */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

        <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10 flex flex-col items-center min-h-screen justify-center">
          
          {/* Main Results Gamified Card */}
          <motion.div
            className="w-full max-w-2xl bg-[#1c1c21] rounded-[2rem] p-8 md:p-12 border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 25 }}
          >
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative"
            >
               <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
               <Trophy className="w-12 h-12 text-emerald-400 relative z-10" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Congratulations!
            </h1>
            
            <motion.div 
               className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold px-5 py-2 rounded-full mb-10"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
            >
               <Award className="w-4 h-4" />
               +{quizResult.pointsEarned || (quizResult.score * 10)} Points
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
               {/* Score */}
               <div className="bg-[#131316] rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Total Score</span>
                  <div className="text-4xl font-black text-white">{quizResult.score}%</div>
               </div>
               
               {/* Accuracy */}
               <div className="bg-[#131316] rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Accuracy</span>
                  <div className="text-3xl font-bold text-emerald-400"><span className="text-white">{quizResult.correctAnswers}</span> <span className="text-zinc-600 text-lg">/ {quizResult.totalQuestions}</span></div>
               </div>

               {/* Time */}
               <div className="bg-[#131316] rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Time Taken</span>
                  <div className="text-2xl font-bold text-indigo-300">{formatTimeTaken(quizResult.timeTaken)}</div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Button 
                  onClick={() => setLocation(typedUser?.role === "teacher" ? "/teacher" : "/student")}
                  className="w-full sm:w-auto bg-[#131316] hover:bg-[#27272a] text-white border border-white/10 h-14 px-8 rounded-xl font-bold text-sm"
               >
                  <Home className="w-4 h-4 mr-2" /> Back to Dashboard
               </Button>
               
               <Button 
                  onClick={openQuestionReview}
                  className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] h-14 px-8 rounded-xl font-bold text-sm"
               >
                  <ClipboardCheck className="w-4 h-4 mr-2" /> Review Answers
               </Button>
            </div>
          </motion.div>

          {/* Leaderboard Section matches dark theme */}
          {leaderboard && leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-4xl mt-12"
            >
              <div className="bg-[#1c1c21] rounded-[2rem] border border-white/5 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                     <ListChecks className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Leaderboard</h2>
                    <p className="text-zinc-400 text-sm">See how you compare with other participants</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/20 text-zinc-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="text-left px-8 py-4">Rank</th>
                        <th className="text-left px-4 py-4">Student</th>
                        <th className="text-center px-4 py-4">Score</th>
                        <th className="text-center px-4 py-4">Time</th>
                        <th className="text-center px-8 py-4">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {leaderboard.map((entry, index) => {
                        const isCurrentUser = entry.userId === typedUser?.id;
                        return (
                          <motion.tr
                            key={entry.id}
                            className={cn(
                              "hover:bg-white/[0.02] transition-colors",
                              isCurrentUser ? "bg-indigo-500/5" : ""
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 + (index * 0.05) }}
                          >
                            <td className="px-8 py-4">
                              {index === 0 ? (
                                <div className="inline-flex items-center justify-center rounded-full bg-amber-500/20 h-8 w-8 border border-amber-500/30">
                                  <Trophy className="h-4 w-4 text-amber-400" />
                                </div>
                              ) : index === 1 ? (
                                <div className="inline-flex items-center justify-center rounded-full bg-zinc-300/20 h-8 w-8 border border-zinc-300/30">
                                  <Medal className="h-4 w-4 text-zinc-300" />
                                </div>
                              ) : index === 2 ? (
                                <div className="inline-flex items-center justify-center rounded-full bg-amber-700/20 h-8 w-8 border border-amber-700/30">
                                  <Medal className="h-4 w-4 text-amber-600" />
                                </div>
                              ) : (
                                <span className="text-zinc-500 font-mono font-medium">#{index + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-white/10">
                                  <AvatarFallback className={cn("text-xs font-bold", isCurrentUser ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-300")}>
                                    {entry.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={isCurrentUser ? "text-indigo-300 font-bold" : "text-zinc-300"}>{entry.username}</span>
                                {isCurrentUser && (
                                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-500/30">You</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center px-4 py-4 font-mono font-bold text-white">{entry.score}%</td>
                            <td className="text-center px-4 py-4 text-zinc-400 font-mono">{formatTimeTaken(entry.timeTaken)}</td>
                            <td className="text-center px-8 py-4 text-emerald-400 font-mono font-medium">{entry.correctAnswers}/{entry.totalQuestions}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {showReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
               <QuizReview
                 questions={questions as QuestionType[]}
                 userAnswers={answers}
                 onClose={() => setShowReview(false)}
               />
            </div>
          )}

        </div>
      </div>
    );
  }

  if (typedQuiz.quizType === "live" && typedQuiz.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">

        <WebcamMonitor
          enabled={enableWebcam && proctoringActive}
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

                    {/* Camera test - isolated from other proctoring listeners */}
                    <motion.div
                      className="my-6 p-4 bg-muted rounded-lg border border-border"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <h4 className="font-medium mb-3">Camera Test</h4>
                      <p className="text-sm text-muted-foreground mb-3">Run a quick camera check before you begin. This test is isolated and will not enable proctoring listeners.</p>

                      <CameraIntegrityCheck onVerified={() => setCameraCheckComplete(true)} />

                      <div className="mt-3 text-sm">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full ${cameraCheckComplete ? 'bg-green-100 text-green-800' : 'bg-muted/20 text-muted-foreground'}`}>
                          {cameraCheckComplete ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" /> Camera verified
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-yellow-600" /> Camera not verified
                            </>
                          )}
                        </span>
                        {!cameraCheckComplete && (
                          <span className="ml-2 text-xs text-red-500 animate-pulse">Required to start</span>
                        )}
                      </div>
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
                      onClick={() => {
                        // Request fullscreen on user gesture, then hide rules to start quiz
                        if (readyToStart) {
                          enterFullScreen();
                        }
                        setShowRules(false);
                      }}

                      disabled={!readyToStart || !cameraCheckComplete}
                      className="w-32 relative overflow-hidden group"
                    >
                      {readyToStart && cameraCheckComplete && (
                        <motion.div
                          className="absolute inset-0 bg-primary/20"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                      )}
                      {!readyToStart ? "Please Wait..." : !cameraCheckComplete ? "Verify Camera" : "Start Quiz"}
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
        </div >
      );
    }

    return (
      <div className="min-h-screen bg-[#131316] text-white flex flex-col font-sans relative overflow-x-hidden">
        <ProctoringWarningOverlay
          enabled={enableWebcam && proctoringActive}
          onViolation={handleWebcamViolation}
          onAutoSubmit={() => {
            toast({
              title: "Major Violation",
              description: "Quiz terminated due to persistent proctoring violations.",
              variant: "destructive"
            });
            submitQuiz();
          }}
          warningCount={warnings}
        />

        {/* Dynamic Glow Effects */}
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Top Header */}
        <header className="flex justify-between items-center p-5 md:p-6 lg:px-12 relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
              <Sword className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="font-extrabold text-lg md:text-2xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quiz Knight <span className="text-zinc-500 font-medium hidden sm:inline">| The Challenge</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {typedQuiz?.duration && typedQuiz.duration > 0 && (
              <div className="bg-[#1c1c21] border border-white/5 rounded-full px-4 py-2 md:px-5 md:py-2.5 flex items-center gap-2 md:gap-3 shadow-lg">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[10px] md:text-[11px] font-bold text-zinc-500 tracking-widest uppercase hidden lg:block">Time Remaining</span>
                <span className="font-mono font-bold text-white text-sm md:text-base whitespace-nowrap">
                  <CountdownTimer
                    duration={typedQuiz.duration * 60}
                    onTimeUp={() => {
                      toast({ title: "Time's up!", description: "Your quiz has been automatically submitted." });
                      submitQuiz();
                    }}
                  />
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex items-center justify-center p-4 md:p-6 relative z-10 w-full">
          {/* Floating Webcam inside Proctoring Overlay logic */}
          {enableWebcam && proctoringActive && (
            <div className="hidden xl:block absolute left-8 top-1/4 w-72 bg-[#1c1c21] rounded-[2rem] p-3 border border-indigo-500/20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] z-30 transform transition-transform hover:scale-105">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-white/5">
                <CameraIntegrityCheck onViolation={handleWebcamViolation} isProctoringActive={proctoringActive} />
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse box-content border border-emerald-900" />
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Recording</span>
                </div>
              </div>
              <p className="text-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-4 mb-2 flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3 h-3" /> Identity Verified
              </p>
            </div>
          )}

          {/* Central Question Card */}
          <div className="w-full max-w-4xl mx-auto my-auto pb-12 z-20">
            <div className="bg-[#1c1c21] rounded-[2rem] p-5 sm:p-8 md:p-12 border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] relative w-full pt-16">
              
              {/* Question pill header */}
              <div className="absolute -top-5 w-full left-0 flex justify-center">
                 <div className="bg-[#1c1c21] md:bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/30 text-indigo-300 font-bold text-[10px] md:text-[11px] tracking-widest uppercase px-5 py-2 md:px-6 md:py-2.5 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.2)] flex items-center gap-2">
                   <FileQuestion className="w-3.5 h-3.5" /> 
                   Question {currentQuestion + 1} / {typedQuestions?.length || 0}
                 </div>
              </div>

              {/* The Question Component */}
              <AnimatePresence mode="wait">
                <QuestionTransition key={currentQuestion} id={currentQuestion} direction={direction}>
                  <div className="w-full">
                    {typedQuestions && typedQuestions[currentQuestion] ? (
                      <Question
                        question={typedQuestions[currentQuestion]}
                        mode="take"
                        onChange={handleAnswer}
                        userAnswer={answers[currentQuestion] || ""}
                      />
                    ) : (
                      <div className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                        <p className="text-zinc-400">Rendering digital challenge...</p>
                      </div>
                    )}
                  </div>
                </QuestionTransition>
              </AnimatePresence>

            </div>
          </div>
        </main>

        {/* Bottom Action Bar */}
        <footer className="bg-[#09090b]/90 backdrop-blur-2xl border-t border-white/5 py-4 px-4 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-30">
          <div className="flex items-center gap-4 sm:gap-10 w-full sm:w-auto">
            <div className="hidden sm:block shrink-0">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Attempt Progress</span>
              <span className="font-mono font-bold text-emerald-400 text-xl">{answeredQuestions} <span className="text-zinc-600 text-sm">/ {typedQuestions?.length || 0}</span></span>
            </div>
            
            {/* Unified Progress Bar matching layout */}
            <div className="flex gap-1 overflow-x-auto max-w-full sm:max-w-xs md:max-w-md pb-1 scrollbar-hide flex-1 sm:flex-initial justify-center sm:justify-start">
              {typedQuestions?.map((_, index) => (
                <button
                  key={`nav-${index}`}
                  onClick={() => {
                    setDirection(index > currentQuestion ? "right" : "left");
                    setCurrentQuestion(index);
                  }}
                  className={cn(
                    "flex-shrink-0 h-2 rounded-full transition-all duration-300",
                    currentQuestion === index ? "bg-indigo-400 w-12"
                    : answers[index] ? "bg-emerald-500 w-6 sm:w-8" 
                    : "bg-zinc-800 hover:bg-zinc-700 w-6 sm:w-8"
                  )}
                  title={`Question ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto justify-between sm:justify-end">
            <Button 
              type="button"
              variant="ghost" 
              className="text-zinc-400 hover:text-white hover:bg-white/5 text-xs sm:text-sm font-bold min-h-12"
              onClick={handleQuizSubmission}
              disabled={submitting}
            >
              Submit Early
            </Button>
            
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                onClick={previous}
                disabled={currentQuestion === 0}
                variant="outline"
                className="bg-[#1c1c21] border-white/5 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              {currentQuestion < (typedQuestions?.length || 0) - 1 ? (
                <Button 
                  type="button"
                  className="bg-indigo-300 hover:bg-indigo-400 text-indigo-950 font-bold px-4 sm:px-8 h-12 rounded-xl text-xs sm:text-sm shadow-[0_0_20px_rgba(165,180,252,0.3)] whitespace-nowrap shrink-0"
                  onClick={next}
                >
                  Next <span className="hidden sm:inline">Question</span> <ArrowRight className="w-4 h-4 ml-1 sm:ml-2 shrink-0" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleQuizSubmission}
                  disabled={submitting}
                  className="bg-emerald-400 hover:bg-emerald-500 text-emerald-950 font-bold px-4 sm:px-8 h-12 rounded-xl text-xs sm:text-sm shadow-[0_0_20px_rgba(52,211,153,0.3)] whitespace-nowrap shrink-0"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1 sm:mr-2 shrink-0" /> Processing</> : <><Send className="w-4 h-4 mr-1 sm:mr-2 shrink-0" /> Finish <span className="hidden sm:inline">Quiz</span></>}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
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