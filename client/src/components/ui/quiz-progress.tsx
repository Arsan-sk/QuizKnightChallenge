import { Progress } from "./progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  className?: string;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  className,
}: QuizProgressProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <motion.span
          key={currentQuestion}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium"
        >
          Question {currentQuestion} of {totalQuestions}
        </motion.span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <Progress
        value={progress}
        className="h-2"
        aria-label={`${Math.round(progress)}% complete`}
      />
    </div>
  );
} 