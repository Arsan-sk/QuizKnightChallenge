import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Quiz, Result } from "@shared/schema";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Loader2, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: quizzes, isLoading: loadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/public"],
  });

  const { data: results, isLoading: loadingResults } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
  });

  if (loadingQuizzes || loadingResults) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
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
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user?.points || 0}</p>
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
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{results?.length || 0}</p>
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
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {results && results.length > 0
                  ? Math.round(
                      results.reduce((acc, r) => acc + r.score, 0) /
                        results.length
                    )
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Available Quizzes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes?.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            actionLabel="Take Quiz"
            actionPath={`/student/quiz/${quiz.id}`}
          />
        ))}
      </div>

      {quizzes?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">
            No quizzes are available right now. Check back later!
          </p>
        </motion.div>
      )}
    </div>
  );
}
