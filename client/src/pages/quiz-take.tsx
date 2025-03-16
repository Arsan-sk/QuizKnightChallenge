import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Trophy, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const [quizResult, setQuizResult] = useState<{
    score: number;
    timeTaken: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
  } | null>(null);

  const { data: quiz, isError: quizError } = useQuery<Quiz>({
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

  useEffect(() => {
    setTimeStarted(new Date());

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((w) => {
          const newWarnings = w + 1;
          if (newWarnings >= 2) {
            toast({
              title: "Quiz terminated",
              description: "Too many tab switches detected.",
              variant: "destructive",
            });
            submitMutation.mutate();
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Correct Answers
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
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-8 max-w-3xl">
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
                Warning: Tab switching detected! ({warnings}/2)
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