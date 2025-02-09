import { motion } from "framer-motion";
import { Card } from "@/components/ui/three-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";

interface QuizCardProps {
  quiz: Quiz;
  actionLabel: string;
  actionPath: string;
}

export function QuizCard({ quiz, actionLabel, actionPath }: QuizCardProps) {
  const difficultyColors = {
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{quiz.title}</h3>
          <Badge className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty}
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">{quiz.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Created: {new Date(quiz.createdAt).toLocaleDateString()}
          </span>
          <Link href={actionPath}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
