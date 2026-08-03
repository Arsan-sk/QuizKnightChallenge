import { useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Quiz, Question as QuestionType, User } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
// import { DraggableWebcam } from "@/components/DraggableWebcam"; // DISABLED
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
import { useQuizSession } from "@/hooks/use-quiz-session";
import { SharedQuizReview } from "@/components/shared/SharedQuizReview";
import { useFaceProctoring } from "@/hooks/useFaceProctoring";
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

// Helper to safely parse Postgres/JSON array formats returned from the DB.
const parseAnswersSafe = (val: any): string[] => {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '' || s === '[]') return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {
      if (s.startsWith('{') && s.endsWith('}')) {
        const inner = s.slice(1, -1);
        if (inner.trim() === '') return [];
        return inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g).map(p => {
          let clean = p.trim();
          if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
            clean = clean.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
          }
          return clean === 'NULL' ? "" : String(clean);
        });
      }
    }
  }
  return [];
};

export default function QuizTake() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if this is a results-only view (for already-attempted quizzes)
  const isResultsOnly = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'results';
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [warnings, setWarnings] = useState(0); // Total violations for threshold (keep for backwards compat)
  const [tabSwitchCount, setTabSwitchCount] = useState(0); // Track tab switches separately
  const [otherViolations, setOtherViolations] = useState(0); // Fullscreen, hotkeys, webcam violations
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [enableWebcam, setEnableWebcam] = useState(true); // Enable by default for security
  const [showRules, setShowRules] = useState(!isResultsOnly);
  const [rulesTimer, setRulesTimer] = useState(5);
  const [readyToStart, setReadyToStart] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    timeTaken: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    pointsEarned: number;
    tabSwitchCount?: number;
    copyPasteAttempts?: number;
    proctoringFlags?: number;
  } | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [previousResult, setPreviousResult] = useState<any>(null);
  const [loadingPreviousResult, setLoadingPreviousResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [waitingForStart, setWaitingForStart] = useState(false);
  // Use `showReview` to present the question review overlay/modal.
  // Proctoring lifecycle flags (explicit control)
  const [cameraCheckComplete, setCameraCheckComplete] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  // `proctoringActive` MUST follow `quizStarted` (activation rule)
  const [proctoringActive, setProctoringActive] = useState(false);
  
  // Quiz session context for preventing navigation during active quiz
  const { setQuizActive, setCurrentQuizId } = useQuizSession();
  
  // Submission confirmation dialog state
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [submitConfirmationMessage, setSubmitConfirmationMessage] = useState<string>('');
  
  // Camera verification state for rules section
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [checkingCamera, setCheckingCamera] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  
  // Floating webcam refs for active quiz proctoring
  const floatingWebcamRef = useRef<HTMLVideoElement>(null);
  const floatingWebcamStreamRef = useRef<MediaStream | null>(null);
  
  // Use face proctoring hook for camera test
  const { isInitialized: cameraIsInitialized, currentConfidence } = useFaceProctoring(cameraVideoRef, {
    enabled: checkingCamera,
    onViolation: () => { }, // No violations during check phase
    onAutoSubmit: () => { },
    confidenceThreshold: 70
  });

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

  const { data: userResults } = useQuery<any[]>({
    queryKey: ["/api/results/user"],
  });

  useEffect(() => {
    if (userResults && !quizCompleted) {
      const pastResult = userResults.find((r) => r.quizId === Number(id));
      if (pastResult) {
        setQuizResult({
          score: pastResult.score,
          timeTaken: pastResult.timeTaken,
          totalQuestions: pastResult.totalQuestions,
          correctAnswers: pastResult.correctAnswers || 0,
          wrongAnswers: pastResult.wrongAnswers || 0,
          pointsEarned: pastResult.pointsEarned || 0,
          tabSwitchCount: pastResult.tabSwitchCount || 0,
          copyPasteAttempts: pastResult.copyPasteAttempts || 0,
          proctoringFlags: pastResult.proctoringFlags || 0
        });

        let parsedAnswers = parseAnswersSafe(pastResult.answers);
        setAnswers(parsedAnswers);
        setTabSwitchCount(pastResult.tabSwitchCount || 0);
        setCopyPasteAttempts(pastResult.copyPasteAttempts || 0);
        setOtherViolations(pastResult.proctoringFlags || 0);

        setQuizCompleted(true);
        setShowRules(false);
      }
    }
  }, [userResults, id, quizCompleted]);

  const typedUser = user as User;
  const typedQuiz = quiz as Quiz;
  const typedQuestions = questions as QuestionType[];

  useEffect(() => {
    if (user && 'id' in user && id) {
      const userId = (user as User).id;
      const attempted = hasAttemptedQuiz(parseInt(id), userId);
      setHasAttempted(attempted);

      if (attempted) {
        // Fetch previous result to display
        setLoadingPreviousResult(true);
        apiRequest('GET', `/api/quizzes/${id}/results/${userId}`)
          .then(res => res.json())
          .then(data => {
            setPreviousResult(data);
              setQuizResult({
                score: data.score,
                timeTaken: data.timeTaken,
                totalQuestions: data.totalQuestions || (data.answers ? data.answers.length : 0),
                correctAnswers: data.correctAnswers || 0,
                wrongAnswers: data.wrongAnswers || 0,
                pointsEarned: data.pointsEarned || 0,
                tabSwitchCount: data.tabSwitchCount || 0,
                copyPasteAttempts: data.copyPasteAttempts || 0,
                proctoringFlags: data.proctoringFlags || 0
              });
              let parsedAnswers = [];
              try {
                parsedAnswers = Array.isArray(data.answers) ? data.answers : (typeof data.answers === "string" ? JSON.parse(data.answers) : []);
              } catch(e) {}
              setAnswers(parsedAnswers);
              setTabSwitchCount(data.tabSwitchCount || 0);
              setCopyPasteAttempts(data.copyPasteAttempts || 0);
              setOtherViolations(data.proctoringFlags || 0);
              setQuizCompleted(true);
              setShowRules(false);
              setLoadingPreviousResult(false);
          })
          .catch(err => {
            console.error('Failed to fetch previous result:', err);
            setLoadingPreviousResult(false);
          });

        toast({
          title: "Quiz already attempted",
          description: "Viewing your previous attempt. Click 'View Details' to see the full results.",
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

  // Sync proctoring active state to context to prevent navigation during quiz
  useEffect(() => {
    setQuizActive(proctoringActive);
    if (proctoringActive && id) {
      setCurrentQuizId(id);
    }
    return () => {
      setQuizActive(false);
    };
  }, [proctoringActive, id, setQuizActive, setCurrentQuizId]);

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
          questionsLength: (questions as any[])?.length || 0,
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
            tabSwitchCount: tabSwitchCount,
            copyPasteAttempts: copyPasteAttempts,
            proctoringFlags: otherViolations
          }
        );

        const created = await res.json();

        setQuizResult({
          score: created.score,
          timeTaken: created.timeTaken,
          correctAnswers: created.correctAnswers,
          wrongAnswers: created.wrongAnswers,
          totalQuestions: created.totalQuestions,
          pointsEarned: created.pointsEarned,
          tabSwitchCount: created.tabSwitchCount || 0,
          copyPasteAttempts: created.copyPasteAttempts || 0,
          proctoringFlags: created.proctoringFlags || 0
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
  }, [questions, timeStarted, user, answers, id, safeRefetchLeaderboard, toast, tabSwitchCount, copyPasteAttempts, otherViolations]);

  const handleWebcamViolation = useCallback(() => {
    // Ignore webcam violations once proctoring has been disabled
    if (!proctoringActive) return;

    setOtherViolations((prev) => {
      const newViolations = prev + 1;
      setWarnings((w) => w + 1); // Also increment total warnings for threshold
      
      if ((warnings + 1) >= 3) {
        toast({
          title: "Quiz terminated",
          description: "Multiple people detected. Your quiz has been automatically submitted.",
          variant: "destructive",
        });
        submitQuiz();
      }

      return newViolations;
    });
  }, [proctoringActive, toast, submitQuiz, warnings]);

  // Use face proctoring hook for floating webcam during active quiz (defined after handleWebcamViolation)
  const { 
    currentConfidence: floatingConfidence, 
    isViolating, 
    countdown, 
    warningCount 
  } = useFaceProctoring(floatingWebcamRef, {
    enabled: enableWebcam && proctoringActive,
    onViolation: handleWebcamViolation,
    onAutoSubmit: () => {
      // Auto-submit silently without toast confirmation
      submitQuiz();
    },
    confidenceThreshold: 70
  });

  // Memoize the handleVisibilityChange function to prevent re-renders
  const handleVisibilityChange = useCallback(() => {
    if (!proctoringActive) return;

    if (document.hidden) {
      setTabSwitchCount((prev) => {
        const newTabSwitches = prev + 1;
        setWarnings((w) => w + 1); // Also increment total warnings for threshold
        
        toast({
          title: `Warning ${warnings + 1}/3`,
          description: `Tab switching detected. ${3 - (warnings + 1)} warnings left before automatic submission.`,
          variant: "destructive",
        });

        if ((warnings + 1) >= 3) {
          toast({
            title: "Quiz terminated",
            description: "Too many tab switches detected. Your quiz has been automatically submitted.",
            variant: "destructive",
          });
          submitQuiz();
        }
        return newTabSwitches;
      });
    }
  }, [proctoringActive, toast, submitQuiz, warnings]);

  // Memoize the preventCopyPaste function
  const preventCopyPaste = useCallback((e: ClipboardEvent) => {
    if (!proctoringActive) return;
    if (!quizCompleted) {
      e.preventDefault();
      setCopyPasteAttempts((prev) => {
        const newAttempts = prev + 1;
        setWarnings((w) => w + 1); // Also increment total warnings for threshold
        
        toast({
          title: `Warning ${warnings + 1}/3`,
          description: `Copy/Paste detected. ${3 - (warnings + 1)} warnings left before automatic submission.`,
          variant: "destructive",
        });

        if ((warnings + 1) >= 3) {
          toast({
            title: "Quiz terminated",
            description: "Persistent copy/paste attempts detected. Your quiz has been automatically submitted.",
            variant: "destructive",
          });
          submitQuiz();
        }
        return newAttempts;
      });
    }
  }, [proctoringActive, quizCompleted, toast, submitQuiz, warnings]);

  // Memoize the preventHotkeys function
  const preventHotkeys = useCallback((e: KeyboardEvent) => {
    if (!proctoringActive) return;

    if (!quizCompleted && (e.ctrlKey || e.altKey || e.metaKey)) {
      const allowedCombinations = ['Home', 'End'];
      if (!allowedCombinations.includes(e.key)) {
        e.preventDefault();

        setCopyPasteAttempts((prev) => {
          const newAttempts = prev + 1;
          setWarnings((w) => w + 1); // Also increment total warnings for threshold
          
          toast({
            title: `Warning ${warnings + 1}/3`,
            description: `Restricted hotkey detected. ${3 - (warnings + 1)} warnings left before automatic submission.`,
            variant: "destructive",
          });

          if ((warnings + 1) >= 3) {
            toast({
              title: "Quiz terminated",
              description: "Persistent violation of restrictions. Your quiz has been automatically submitted.",
              variant: "destructive",
            });
            submitQuiz();
          }
          return newAttempts;
        });
      }
    }
  }, [proctoringActive, quizCompleted, toast, submitQuiz, warnings]);

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
      setOtherViolations((prev) => {
        const newViolations = prev + 1;
        setWarnings((w) => w + 1); // Also increment total warnings for threshold
        
        toast({
          title: `Warning ${warnings + 1}/3`,
          description: `Full-screen mode exited. ${3 - (warnings + 1)} warnings left before automatic submission.`,
          variant: "destructive",
        });

        if ((warnings + 1) >= 3) {
          toast({
            title: "Quiz terminated",
            description: "Too many full-screen exits detected. Your quiz has been automatically submitted.",
            variant: "destructive",
          });
          submitQuiz();
        }
        return newViolations;
      });
    }
  }, [proctoringActive, quizCompleted, toast, submitQuiz, warnings]);

  // Ensure proctoringActive strictly follows quizStarted AND isn't completed
  useEffect(() => {
    setProctoringActive(quizStarted === true && quizCompleted === false);
  }, [quizStarted, quizCompleted]);

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
  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      cameraStreamRef.current = stream;
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      
      setCameraPermissionGranted(true);
      setCameraError(null);
      setCameraCheckComplete(true);
    } catch (err: any) {
      setCameraPermissionGranted(false);
      
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access to continue.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera to continue.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to access camera'}`);
      }
    }
  }, []);

  const testCamera = useCallback(async () => {
    setCheckingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      
      cameraStreamRef.current = stream;
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      
      setCameraPermissionGranted(true);
      setCameraError(null);
    } catch (err: any) {
      setCameraPermissionGranted(false);
      setCheckingCamera(false);
      
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Stop camera when test is complete
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCheckingCamera(false);
  }, []);

  // Request camera permission on mount for rules section
  useEffect(() => {
    if (showRules) {
      requestCameraPermission();
    }
    
    return () => {
      stopCamera();
    };
  }, [showRules, requestCameraPermission, stopCamera]);

  // Update camera check completion status based on confidence
  useEffect(() => {
    if (checkingCamera && currentConfidence >= 70) {
      setCameraCheckComplete(true);
    } else if (!checkingCamera) {
      // Keep the verification status when not testing
    }
  }, [checkingCamera, currentConfidence]);

  // Set up floating webcam stream for active quiz proctoring
  useEffect(() => {
    if (!proctoringActive || !enableWebcam) {
      if (floatingWebcamStreamRef.current) {
        floatingWebcamStreamRef.current.getTracks().forEach(track => track.stop());
        floatingWebcamStreamRef.current = null;
      }
      if (floatingWebcamRef.current) {
        floatingWebcamRef.current.srcObject = null;
      }
      return;
    }

    const setupFloatingWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        
        floatingWebcamStreamRef.current = stream;
        
        if (floatingWebcamRef.current) {
          floatingWebcamRef.current.srcObject = stream;
          await floatingWebcamRef.current.play();
        }
      } catch (err) {
        console.error('Failed to access webcam for proctoring:', err);
      }
    };

    setupFloatingWebcam();

    return () => {
      if (floatingWebcamStreamRef.current) {
        floatingWebcamStreamRef.current.getTracks().forEach(track => track.stop());
        floatingWebcamStreamRef.current = null;
      }
    };
  }, [proctoringActive, enableWebcam]);

  // Track low accuracy warnings during active quiz
  const lowAccuracyWarningRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!proctoringActive || !enableWebcam || floatingConfidence >= 50) {
      lowAccuracyWarningRef.current = null;
      return;
    }

    // Only warn if accuracy drops below 50% AND it hasn't been warned recently
    if (floatingConfidence > 0 && floatingConfidence < 50 && !lowAccuracyWarningRef.current) {
      lowAccuracyWarningRef.current = Date.now();
      
      toast({
        title: "Low Accuracy",
        description: `Face accuracy is ${Math.round(floatingConfidence)}%. Look directly at the screen to maintain verification.`,
        variant: "default",
      });

      // Reset warning timeout after 10 seconds so it can warn again if accuracy stays low
      setTimeout(() => {
        lowAccuracyWarningRef.current = null;
      }, 10000);
    }
  }, [proctoringActive, enableWebcam, floatingConfidence, toast]);

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

      setSubmitConfirmationMessage(
        `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}:\n\nQuestion${unansweredCount > 1 ? 's' : ''} ${unansweredQuestions}\n\nWould you like to submit anyway?`
      );
      setShowSubmitConfirmation(true);
    } else {
      setSubmitConfirmationMessage('Are you ready to submit your quiz? You won\'t be able to change your answers after submission.');
      setShowSubmitConfirmation(true);
    }
  }, [answers, typedQuestions]);

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

  // Waiting room: poll quiz status for live quizzes that haven't started
  useEffect(() => {
    if (!typedQuiz || typedQuiz.quizType !== 'live') return;
    if (quizCompleted || hasAttempted) return;
    
    // If quiz is live and not started, show waiting room
    if (!typedQuiz.isStarted && !typedQuiz.isActive) {
      setWaitingForStart(true);
    } else {
      setWaitingForStart(false);
    }
  }, [typedQuiz, quizCompleted, hasAttempted]);

  // Poll for quiz status when in waiting room
  useEffect(() => {
    if (!waitingForStart || !id) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await apiRequest('GET', `/api/quizzes/${id}/status`);
        const status = await res.json();
        if (status.isStarted && status.isActive) {
          setWaitingForStart(false);
          // Force refetch quiz and questions data
          window.location.reload();
        }
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [waitingForStart, id]);

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

  // Waiting room for live quizzes that haven't started
  if (waitingForStart && typedQuiz) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-sans relative overflow-x-hidden">
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg mx-auto text-center px-6"
        >
          {/* Animated waiting indicator */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-400"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              className="absolute inset-2 rounded-full border-2 border-purple-500/20 border-b-purple-400"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-8 h-8 text-indigo-300" />
            </div>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Waiting Room
          </h1>
          
          <div className="bg-[#1c1c21] rounded-2xl p-6 border border-white/5 mb-6">
            <h2 className="text-lg font-bold text-white mb-2">{typedQuiz.title}</h2>
            <p className="text-sm text-zinc-400 mb-4">{typedQuiz.description}</p>
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {typedQuiz.duration || 30} min
              </span>
              <span className="capitalize">{typedQuiz.difficulty}</span>
            </div>
          </div>

          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-indigo-300 text-sm font-medium mb-2"
          >
            Waiting for teacher to start the quiz...
          </motion.p>
          <p className="text-zinc-500 text-xs">This page will automatically update when the quiz begins.</p>

          <Button
            variant="ghost"
            className="mt-8 text-zinc-400 hover:text-white"
            onClick={() => setLocation(typedUser?.role === 'teacher' ? '/teacher' : '/student')}
          >
            ← Back to Dashboard
          </Button>
        </motion.div>
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

  if (hasAttempted && !quizCompleted) {
    if (loadingPreviousResult) {
      return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-sans relative overflow-x-hidden">
          <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
            <p className="text-lg font-semibold">Loading your previous attempt...</p>
          </div>
        </div>
      );
    }

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
               <SharedQuizReview
                 report={{
                   username: user ? (user.username || 'You') : 'You',
                   score: quizResult.score,
                   correctAnswers: quizResult.correctAnswers,
                   timeTaken: quizResult.timeTaken,
                   answers: answers,
                     tabSwitchCount: quizResult.tabSwitchCount ?? tabSwitchCount,
                     copyPasteAttempts: quizResult.copyPasteAttempts ?? copyPasteAttempts,
                     proctoringFlags: quizResult.proctoringFlags ?? otherViolations
                 }}
                 questions={questions as QuestionType[]}
                 onClose={() => setShowReview(false)}
               />
            </div>
          )}



        </div>
      </div>
    );
  }

  if (typedQuiz.quizType === "live" && typedQuiz.isActive) {
    const userAnswersRecord: Record<number, string> = {};
    if (typedQuestions) {
      typedQuestions.forEach((q, idx) => {
        if (answers[idx]) userAnswersRecord[q.id] = answers[idx];
      });
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
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
                onAnswer={(_qId, ans) => handleAnswer(ans)}
                onComplete={submitQuiz}
                userAnswers={userAnswersRecord}
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
        <div className="min-h-screen bg-[#131316] text-white overflow-x-hidden relative">
          {/* Background ambient glow */}
          <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
          <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 py-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header */}
              <motion.div
                className="mb-12"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl font-black mb-2 tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Quiz Rules & Instructions
                </h1>
                <p className="text-zinc-400 text-lg">Please read carefully before starting the quiz</p>
              </motion.div>

              {/* Main Container */}
              <div className="space-y-6">
                {/* Quiz Details */}
                <motion.div
                  className="bg-[#1c1c21] border border-indigo-500/10 rounded-2xl p-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-2">{typedQuiz.title}</h2>
                  <p className="text-zinc-400">{typedQuiz.description}</p>
                </motion.div>

                {/* Important Rules */}
                <motion.div
                  className="bg-[#1c1c21] border border-indigo-500/10 rounded-2xl p-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xl font-bold text-indigo-300 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-indigo-400" />
                    </div>
                    Important Rules
                  </h3>
                  <ul className="space-y-4 pl-0">
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
                        className="flex items-start gap-4 text-zinc-300"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + (index * 0.03) }}
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-indigo-400 text-xs font-bold">{index + 1}</span>
                        </div>
                        <span>{rule}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Camera Test */}
                <motion.div
                  className="bg-[#1c1c21] border border-emerald-500/10 rounded-2xl p-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-xl font-bold text-emerald-300 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    Camera Test & Verification
                  </h3>

                  {/* Camera Preview Area */}
                  <div className="mb-6">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-emerald-500/20 flex items-center justify-center group">
                      {!checkingCamera && !cameraPermissionGranted && (
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <p className="text-sm text-zinc-400">Camera ready to test</p>
                        </div>
                      )}

                      {checkingCamera && (
                        <>
                          <video
                            ref={cameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          
                          {/* Camera Status Indicator */}
                          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-2 rounded-full border border-emerald-500/30">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-emerald-300 font-bold uppercase">LIVE</span>
                          </div>

                          {/* Confidence Display */}
                          <motion.div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {currentConfidence >= 70 ? (
                              <div className="bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-400/50">
                                <div className="flex items-center gap-2 text-white">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm font-bold">Verified - {Math.round(currentConfidence)}%</span>
                                </div>
                              </div>
                            ) : currentConfidence > 0 ? (
                              <div className="bg-yellow-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-yellow-400/50">
                                <div className="flex items-center gap-2 text-white">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm font-bold">Look at screen - {Math.round(currentConfidence)}%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-red-400/50">
                                <div className="flex items-center gap-2 text-white">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm font-bold">Detecting face...</span>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </>
                      )}

                      {cameraPermissionGranted === false && (
                        <div className="text-center space-y-3 px-6">
                          <XCircle className="w-12 h-12 mx-auto text-red-500" />
                          <p className="text-sm text-red-400">Camera access required</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera Error Alert */}
                  {cameraError && (
                    <motion.div
                      className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">{cameraError}</p>
                    </motion.div>
                  )}

                  {/* Confidence Progress Bar (shown while testing) */}
                  {checkingCamera && (
                    <motion.div
                      className="mb-6 space-y-2"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Accuracy</span>
                        <span className={`font-bold ${currentConfidence >= 70 ? 'text-emerald-400' : currentConfidence >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Math.round(currentConfidence)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${currentConfidence >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : currentConfidence >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${currentConfidence}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Camera Test Buttons */}
                  <div className="flex gap-3 mb-6">
                    {!checkingCamera ? (
                      <motion.button
                        onClick={testCamera}
                        disabled={!cameraPermissionGranted}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Test Camera
                        </span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={stopCamera}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-700 hover:to-zinc-800 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Stop Test
                      </motion.button>
                    )}
                  </div>

                  {/* Before You Begin Instructions */}
                  <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Before you begin:
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      <li className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                        </div>
                        <span>Position yourself in a well-lit area</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                        </div>
                        <span>Ensure your entire face is visible in the camera</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                        </div>
                        <span>Look directly at the screen and stay focused</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">✓</span>
                        </div>
                        <span>Ensure good lighting on your face</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        </div>
                        <span>No other person should be visible in the frame</span>
                      </li>
                    </ul>
                  </div>

                  {/* Verification Status */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <span className={`inline-flex items-center gap-2 font-medium text-sm ${currentConfidence >= 70 ? 'text-emerald-300' : 'text-yellow-300'}`}>
                      {currentConfidence >= 70 ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Camera Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Camera Not Verified
                        </>
                      )}
                    </span>
                    {currentConfidence < 70 && (
                      <p className="text-xs text-yellow-400/80 font-medium">Required: {Math.round(currentConfidence)}% / 70%</p>
                    )}
                  </div>
                </motion.div>

                {/* Proctoring Notice */}
                <motion.div
                  className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h3 className="text-xl font-bold text-indigo-300 mb-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-500/50 flex items-center justify-center">
                      <Sword className="w-5 h-5 text-indigo-300" />
                    </div>
                    Proctoring Notice
                  </h3>
                  <p className="text-indigo-200">
                    This quiz uses advanced proctoring technology to maintain academic integrity. Attempts to cheat, copy content, or seek outside help during the quiz may result in disciplinary action.
                  </p>
                </motion.div>
              </div>

              {/* Footer */}
              <motion.div
                className="mt-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-[#1c1c21] border border-indigo-500/10 rounded-2xl p-8">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <span className="text-zinc-300 font-medium">
                      {readyToStart ? (
                        <span className="text-emerald-400">✓ Ready to begin</span>
                      ) : (
                        <span>Please wait: <span className="text-indigo-300 font-bold">{rulesTimer}</span> seconds remaining</span>
                      )}
                    </span>
                  </div>

                  <motion.button
                    onClick={() => {
                      if (readyToStart && currentConfidence >= 70) {
                        enterFullScreen();
                      }
                      setShowRules(false);
                    }}
                    disabled={!readyToStart || currentConfidence < 70}
                    whileHover={readyToStart && currentConfidence >= 70 ? { scale: 1.05 } : {}}
                    whileTap={readyToStart && currentConfidence >= 70 ? { scale: 0.95 } : {}}
                    className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all relative overflow-hidden group ${
                      readyToStart && currentConfidence >= 70
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60'
                        : 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-70'
                    }`}
                  >
                    {readyToStart && currentConfidence >= 70 && (
                      <motion.div
                        className="absolute inset-0 bg-white/10"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                    <span className="relative">
                      {!readyToStart ? "Please Wait..." : currentConfidence < 70 ? `Verify Camera (${Math.round(currentConfidence)}% / 70%)` : "Start Quiz"}
                    </span>
                  </motion.button>
                </div>

                <motion.div
                  className="mt-6 text-center text-sm text-zinc-500 space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                >
                  <p>By starting this quiz, you agree to the academic integrity guidelines of your institution.</p>
                  <p>Need help? Contact your instructor for assistance.</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
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
          warningCount={warningCount}
          isViolating={isViolating}
          countdown={countdown}
          currentConfidence={floatingConfidence}
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
            {/* Hidden video required for face tracking to process frames */}
            {enableWebcam && proctoringActive && (
              <video
                ref={floatingWebcamRef}
                autoPlay
                playsInline
                muted
                style={{ opacity: 0, position: 'absolute', width: '320px', height: '240px', pointerEvents: 'none', zIndex: -1 }}
              />
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
                  {/* Submission Confirmation Modal */}
          {showSubmitConfirmation && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-[#1c1c21] border border-indigo-500/20 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-500/20 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-indigo-400" />
                    </div>
                    Confirm Submission
                  </h2>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-6">
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {submitConfirmationMessage}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      onClick={() => setShowSubmitConfirmation(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3 rounded-lg font-bold text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-600/10 transition-all"
                    >
                      Continue Quiz
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowSubmitConfirmation(false);
                        submitQuiz();
                      }}
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.02 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Quiz
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

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
