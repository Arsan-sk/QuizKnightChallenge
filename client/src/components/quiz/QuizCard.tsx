import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";
import { User, Play, Square, Clock, Eye, BarChart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  const difficultyConfig = {
    easy: {
      border: "border-l-[hsl(145,63%,42%)]",
      badge: "bg-[hsl(145,63%,42%,0.15)] text-[hsl(145,63%,60%)] border-[hsl(145,63%,42%,0.3)]",
      dot: "bg-[hsl(145,63%,42%)]",
    },
    medium: {
      border: "border-l-[hsl(38,95%,58%)]",
      badge: "bg-[hsl(38,95%,58%,0.15)] text-[hsl(38,95%,65%)] border-[hsl(38,95%,58%,0.3)]",
      dot: "bg-[hsl(38,95%,58%)]",
    },
    hard: {
      border: "border-l-[hsl(0,72%,51%)]",
      badge: "bg-[hsl(0,72%,51%,0.15)] text-[hsl(0,72%,65%)] border-[hsl(0,72%,51%,0.3)]",
      dot: "bg-[hsl(0,72%,51%)]",
    },
  };

  const diffConf = difficultyConfig[quiz.difficulty] || difficultyConfig.medium;

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
      toast({ title: "Quiz started", description: "Students can now take this quiz" });
      setIsStarting(false);
    },
    onError: (error) => {
      toast({ title: "Failed to start quiz", description: error.message, variant: "destructive" });
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
      toast({ title: "Quiz ended", description: "The quiz is no longer active" });
      setIsStopping(false);
    },
    onError: (error) => {
      toast({ title: "Failed to end quiz", description: error.message, variant: "destructive" });
      setIsStopping(false);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.03,
        rotateX: 3,
        rotateY: 4,
        transition: { duration: 0.2 }
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={cn(
          "rounded-xl overflow-hidden border-l-4 relative",
          "border border-[hsl(var(--border))]",
          diffConf.border,
          "bg-[hsl(var(--card))]",
        )}
        style={{
          boxShadow: "0 4px 16px -4px hsl(0 0% 0% / 0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {quiz.isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-[10px] font-bold text-red-400">LIVE</span>
          </div>
        )}

        <div className="p-5">
          <div className="mb-3">
            <h3
              className="font-bold text-[hsl(var(--foreground))] text-base leading-tight mb-2 pr-12"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {quiz.title}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-semibold border capitalize",
                  diffConf.badge
                )}
              >
                {quiz.difficulty}
              </span>
              {quiz.quizType === "live" && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border badge-primary">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Live Quiz
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2 leading-relaxed">
            {quiz.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              {teacherName && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{teacherName}</span>
                </div>
              )}
              <span>·</span>
              <span>
                {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>

            <div className="flex gap-1.5">
              {isTeacher && (
                <Link href={`/quiz-analytics/${quiz.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    <BarChart className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}

              {isTeacher && quiz.quizType === "live" && (
                <>
                  {quiz.isActive ? (
                    <>
                      <Link href={`/teacher/monitor/${quiz.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        style={{ background: "hsl(var(--danger-h) var(--danger-s) var(--danger-l))", color: "white" }}
                        onClick={() => stopQuizMutation.mutate()}
                        disabled={isStopping}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        {isStopping ? "..." : "Stop"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs"
                      style={{
                        background: "hsl(var(--primary))",
                        boxShadow: "0 2px 8px -2px hsl(var(--primary) / 0.4)",
                      }}
                      onClick={() => startQuizMutation.mutate()}
                      disabled={isStarting}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {isStarting ? "..." : "Start"}
                    </Button>
                  )}
                </>
              )}

              <Link href={actionPath}>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs font-medium"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 2px 8px -2px hsl(var(--primary) / 0.4)",
                  }}
                >
                  {actionLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}