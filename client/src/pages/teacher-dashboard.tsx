import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Link } from "wouter";
import { Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: quizzes, isLoading, error } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/teacher"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("Error loading quizzes:", error);
  }

  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.username}!</h1>
            <p className="text-muted-foreground">
              Create and manage your quizzes here
            </p>
          </div>
          <Link href="/teacher/quiz/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Quiz
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes?.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              actionLabel="Edit Quiz"
              actionPath={`/teacher/quiz/${quiz.id}`}
              isTeacher={true}
            />
          ))}
        </div>

        {(!quizzes || quizzes.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              You haven't created any quizzes yet. Get started by creating your first
              quiz!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}