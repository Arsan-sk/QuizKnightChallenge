import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";
import { useToast } from "@/hooks/use-toast";

export default function QuizTake() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeStarted, setTimeStarted] = useState<Date>();
  const [warnings, setWarnings] = useState(0);

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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Quiz ID is required");

      const timeTaken = timeStarted
        ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
        : 0;
      const score = calculateScore();

      const res = await apiRequest("POST", `/api/quizzes/${id}/results`, {
        quizId: parseInt(id),
        score,
        timeTaken,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results/user"] });
      toast({
        title: "Quiz submitted",
        description: "Your results have been recorded!",
      });
      setLocation("/student");
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

  const calculateScore = () => {
    if (!questions) return 0;
    const correctAnswers = answers.filter(
      (answer, index) =>
        answer.toLowerCase() === questions[index].correctAnswer.toLowerCase()
    );
    return Math.round((correctAnswers.length / questions.length) * 100);
  };

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