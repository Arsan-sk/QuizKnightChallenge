import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";
import { User } from "lucide-react";

interface QuizCardProps {
  quiz: Quiz;
  actionLabel: string;
  actionPath: string;
  teacherName?: string;
}

export function QuizCard({ quiz, actionLabel, actionPath, teacherName }: QuizCardProps) {
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
      whileHover={{ 
        scale: 1.05,
        rotateX: 5,
        rotateY: 5,
        transition: { duration: 0.2 }
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <Card className="p-6 relative bg-card/50 backdrop-blur-sm border border-primary/10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{quiz.title}</h3>
          <Badge className={difficultyColors[quiz.difficulty]}>
            {quiz.difficulty}
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">{quiz.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {teacherName && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{teacherName}</span>
              </div>
            )}
            <span>·</span>
            <span>
              {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
          <Link href={actionPath}>
            <Button>{actionLabel}</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}