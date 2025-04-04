import { useState, useEffect, useCallback, ReactNode } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Quiz, Question as QuestionType, User } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizProgress } from "@/components/ui/quiz-progress";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { QuestionTransition } from "@/components/ui/question-transition";
import { apiRequest } from "@/lib/queryClient";
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
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
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

  // Initialize time tracking when the component loads
  useEffect(() => {
    // Only set the start time if it hasn't been set yet
    if (!timeStarted) {
      setTimeStarted(new Date());
      console.log("Quiz start time set:", new Date().toISOString());
    }
  }, [timeStarted]);

  const submitQuiz = async () => {
    try {
      if (!questions || !Array.isArray(questions) || questions.length === 0 || !user || !('id' in user)) {
        console.error("Missing required data for quiz submission");
        return;
      }
      
      setSubmitting(true);
      
      // Check if timeStarted is valid
      if (!timeStarted) {
        console.error("Time started is null, using current time");
        setTimeStarted(new Date());
      }
      
      let correctCount = 0;
      let wrongCount = 0;
      
      const questionsArray = questions as QuestionType[];
      
      for (let i = 0; i < questionsArray.length; i++) {
        if (answers[i] === questionsArray[i].correctAnswer) {
          correctCount++;
        } else if (answers[i]) {
          wrongCount++;
        }
      }
      
      const totalQuestions = questionsArray.length;
      const scorePercentage = (correctCount / totalQuestions) * 100;
      
      // Calculate time taken, ensuring we have a valid start time
      const startTime = timeStarted || new Date();
      const endTime = new Date();
      const timeTakenMs = endTime.getTime() - startTime.getTime();
      const timeTaken = Math.max(1, Math.floor(timeTakenMs / 1000)); // Convert to seconds, minimum 1 second
      
      console.log("Quiz submission - Time calculation:", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        timeTakenMs,
        timeTakenSeconds: timeTaken
      });
      
      const pointsEarned = correctCount * 2;
      
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
            totalQuestions: totalQuestions
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
        
        await refetchLeaderboard();
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
  };

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
  }, [submitQuiz, toast]);

  useEffect(() => {
    // Don't set the time here, we handle this in a separate effect
    
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
            submitQuiz();
          }
          return newWarnings;
        });
      }
    };

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

    const preventHotkeys = (e: KeyboardEvent) => {
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
    };

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
            submitQuiz();
          }
          return newWarnings;
        });
      }
    };

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
  }, [quizCompleted, isFullScreen, toast, submitQuiz]);

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

  if (!quiz || !questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const typedQuiz = quiz as Quiz;
  const typedQuestions = questions as QuestionType[];

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
    if (currentQuestion < typedQuestions.length - 1) {
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-xl text-muted-foreground">
              Your score: {quizResult.score}% ({quizResult.correctAnswers} of {quizResult.totalQuestions} correct)
            </p>
          </motion.div>

          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-green-100/50"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Points Earned
                </CardTitle>
                <CardDescription>2 points per correct answer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{quizResult.pointsEarned}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Added to your total score
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-blue-100/50"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  Time Taken
                </CardTitle>
                <CardDescription>Total completion time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {Math.floor(quizResult.timeTaken / 60)}:{(quizResult.timeTaken % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {quizResult.timeTaken < 120 ? 'Great speed!' : quizResult.timeTaken < 300 ? 'Good pace!' : 'Take your time!'}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Raw seconds: {quizResult.timeTaken}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setShowReview(true)}>
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-purple-100/50"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Search className="mr-2 h-5 w-5 text-purple-500" />
                  Review Answers
                </CardTitle>
                <CardDescription>See what you got right and wrong</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-4xl font-bold text-green-500">{quizResult.correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-4xl font-bold">|</div>
                  <div>
                    <p className="text-4xl font-bold text-red-500">{quizResult.wrongAnswers}</p>
                    <p className="text-sm text-muted-foreground">Wrong</p>
                  </div>
                </div>
                <Button className="w-full mt-4">Review Questions</Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Leaderboard Section */}
          {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 && (
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
                        className={`