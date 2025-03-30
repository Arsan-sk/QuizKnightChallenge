import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Result, Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, BookOpen, Target, Clock, ChevronRight } from "lucide-react";
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
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";

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

        {/* Leaderboard Widget - Positioned at the top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <LeaderboardWidget 
            limit={8} 
            autoRefresh={true}
            visualStyle="comparative"
            className="w-full shadow-md border-2 border-accent/40"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-3 space-y-8">
            {liveQuizzes && liveQuizzes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  Live Quizzes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Your Stats
                </h2>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    Global Leaderboard <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                        Your Points
                      </CardTitle>
                      <CardDescription className="text-xs">2 points per correct answer</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{calculateTotalPoints()}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quizzes Completed</CardTitle>
                      <CardDescription className="text-xs">Total attempts submitted</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{getCompletedQuizCount()}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Score</CardTitle>
                      <CardDescription className="text-xs">Across all quizzes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {calculateAverageScore()}%
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
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
      </div>
    </div>
  );
}