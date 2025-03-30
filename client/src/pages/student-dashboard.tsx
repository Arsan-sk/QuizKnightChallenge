import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Result, Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, BookOpen, Target, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizCard } from "@/components/quiz/QuizCard";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: results, isLoading: loadingResults } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
  });

  const { data: liveQuizzes, isLoading: loadingLiveQuizzes } = useQuery<(Quiz & { teacherName: string })[]>({
    queryKey: ["/api/quizzes/live"],
    refetchInterval: 30000, // Refetch every 30 seconds to check for new live quizzes
  });

  // Calculate the correct average score based on the stored score values
  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / results.length);
  };

  // Calculate total points earned from quizzes
  const calculateTotalPoints = () => {
    if (!user) return 0;
    return user.points || 0;
  };

  // Get the number of completed quizzes
  const getCompletedQuizCount = () => {
    if (!results) return 0;
    return results.length;
  };

  if (loadingResults || loadingLiveQuizzes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.username}!</h1>
          <p className="text-muted-foreground">Ready to test your knowledge?</p>
        </motion.div>

        {liveQuizzes && liveQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-500" />
              Live Quizzes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  actionLabel="Take Quiz"
                  actionPath={`/student/quiz/${quiz.id}`}
                  teacherName={quiz.teacherName}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Your Points
                </CardTitle>
                <CardDescription>2 points per correct answer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{calculateTotalPoints()}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quizzes Completed</CardTitle>
                <CardDescription>Total attempts submitted</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{getCompletedQuizCount()}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Average Score</CardTitle>
                <CardDescription>Across all quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {calculateAverageScore()}%
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link href="/student/quizzes">
            <Button size="lg" className="gap-2">
              <BookOpen className="h-5 w-5" />
              Browse Available Quizzes
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}