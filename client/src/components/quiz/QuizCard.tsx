import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";
import { User, Play, Square, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface QuizCardProps {
  quiz: Quiz;
  actionLabel: string;
  actionPath: string;
  teacherName?: string;
  isTeacher?: boolean;
}

export function QuizCard({ 
  quiz, 
  actionLabel, 
  actionPath, 
  teacherName, 
  isTeacher = false 
}: QuizCardProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const difficultyColors = {
    easy: "bg-green-500",
    medium: "bg-yellow-500",
    hard: "bg-red-500",
  };

  const startQuizMutation = useMutation({
    mutationFn: async () => {
      setIsStarting(true);
      const res = await apiRequest("POST", `/api/quizzes/${quiz.id}/start`, {
        duration: quiz.duration || 30,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({
        title: "Quiz started",
        description: "Students can now take this quiz",
      });
      setIsStarting(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to start quiz",
        description: error.message,
        variant: "destructive",
      });
      setIsStarting(false);
    },
  });

  const stopQuizMutation = useMutation({
    mutationFn: async () => {
      setIsStopping(true);
      const res = await apiRequest("POST", `/api/quizzes/${quiz.id}/end`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({
        title: "Quiz ended",
        description: "The quiz is no longer active",
      });
      setIsStopping(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to end quiz",
        description: error.message,
        variant: "destructive",
      });
      setIsStopping(false);
    },
  });

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleStopQuiz = () => {
    stopQuizMutation.mutate();
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
          <div>
            <h3 className="text-xl font-bold">{quiz.title}</h3>
            <div className="flex gap-2 mt-1">
              <Badge className={difficultyColors[quiz.difficulty]}>
                {quiz.difficulty}
              </Badge>
              {quiz.quizType === "live" && (
                <Badge variant={quiz.isActive ? "default" : "outline"} className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {quiz.isActive ? "Live" : "Live Quiz"}
                </Badge>
              )}
            </div>
          </div>
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
          
          <div className="flex gap-2">
            {isTeacher && quiz.quizType === "live" && (
              <>
                {quiz.isActive ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleStopQuiz}
                    disabled={isStopping}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    {isStopping ? "Stopping..." : "Stop Quiz"}
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleStartQuiz}
                    disabled={isStarting}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {isStarting ? "Starting..." : "Start Quiz"}
                  </Button>
                )}
              </>
            )}
            
            <Link href={actionPath}>
              <Button size="sm">{actionLabel}</Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}