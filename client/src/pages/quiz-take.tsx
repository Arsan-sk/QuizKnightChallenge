import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { Question } from "@/components/quiz/Question";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function QuizTake() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeStarted, setTimeStarted] = useState<Date>();
  const [warnings, setWarnings] = useState(0);

  const { data: quiz, isLoading: loadingQuiz } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${id}`],
  });

  const { data: questions, isLoading: loadingQuestions } = useQuery<
    QuestionType[]
  >({
    queryKey: [`/api/quizzes/${id}/questions`],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeTaken = timeStarted
        ? Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000)
        : 0;
      const score = calculateScore();
      
      const res = await apiRequest("POST", `/api/quizzes/${id}/results`, {
        score,
        timeTaken,
      });
      return res.json();
    },
    onSuccess: () => {
      setLocation("/student");
    },
  });

  useEffect(() => {
    setTimeStarted(new Date());

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((w) => {
          if (w + 1 >= 2) submitMutation.mutate();
          return w + 1;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (loadingQuiz || loadingQuestions) {
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
    if (questions && currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previous = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{quiz?.title}</h1>
          <p className="text-muted-foreground mb-4">{quiz?.description}</p>
          {warnings > 0 && (
            <p className="text-red-500 mb-2">
              Warning: Tab switching detected! ({warnings}/2)
            </p>
          )}
          <Progress
            value={
              questions
                ? ((currentQuestion + 1) / questions.length) * 100
                : 0
            }
            className="h-2"
          />
        </div>

        {questions && questions[currentQuestion] && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Question
              question={questions[currentQuestion]}
              answer={answers[currentQuestion]}
              onChange={handleAnswer}
              mode="take"
            />
          </motion.div>
        )}

        <div className="flex justify-between mt-8">
          <Button onClick={previous} disabled={currentQuestion === 0}>
            Previous
          </Button>
          {questions && currentQuestion === questions.length - 1 ? (
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
  );
}
