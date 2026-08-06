import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quiz } from "@shared/schema";
import { Link } from "wouter";
import { User, Play, Square, Clock, Eye, BarChart, Globe, Lock, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface QuizCardProps {
  quiz: Quiz;
  actionLabel: string;
  actionPath: string;
  teacherName?: string;
  isTeacher?: boolean;
  onPublish?: () => void;
}

export function QuizCard({
  quiz,
  actionLabel,
  actionPath,
  teacherName,
  isTeacher = false,
  onPublish,
}: QuizCardProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState("");
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

  const startSessionMutation = useMutation({
    mutationFn: async (sessionName: string) => {
      setIsStarting(true);
      const res = await apiRequest("POST", `/api/quizzes/${quiz.id}/sessions/start`, {
        sessionName: sessionName.trim(),
        duration: quiz.duration || 30,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({ title: "Live Session Launched", description: `Session "${sessionNameInput}" is now active and accepting students.` });
      setIsStarting(false);
      setShowSessionDialog(false);
      setSessionNameInput("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to launch session", description: error.message, variant: "destructive" });
      setIsStarting(false);
    },
  });

  const stopQuizMutation = useMutation({
    mutationFn: async () => {
      setIsStopping(true);
      const res = await apiRequest("POST", `/api/quizzes/${quiz.id}/sessions/stop`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({ title: "Live Session Ended", description: "The live session has been closed." });
      setIsStopping(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to end session", description: error.message, variant: "destructive" });
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
        {/* Status indicators */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
          {quiz.isActive && (
            <div className="flex items-center gap-1">
              <span className="live-dot" />
              <span className="text-[10px] font-bold text-red-400">LIVE</span>
            </div>
          )}
          {isTeacher && quiz.isDraft && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              DRAFT
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3">
            <h3
              className="font-bold text-[hsl(var(--foreground))] text-sm sm:text-base leading-tight mb-2 pr-16"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {quiz.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
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
              {/* Visibility badge for teachers */}
              {isTeacher && !quiz.isDraft && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1",
                  quiz.isPublic
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                )}>
                  {quiz.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {quiz.isPublic ? "Public" : "Private"}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2 leading-relaxed">
            {quiz.description}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] min-w-0">
              {teacherName && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{teacherName}</span>
                </div>
              )}
              <span className="shrink-0">·</span>
              <span className="shrink-0">
                {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Recently'}
              </span>
            </div>

            <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
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
                      onClick={() => setShowSessionDialog(true)}
                      disabled={isStarting}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {isStarting ? "..." : "Start"}
                    </Button>
                  )}
                </>
              )}

              {/* Publish button for draft quizzes */}
              {isTeacher && quiz.isDraft && onPublish && (
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs font-medium"
                  style={{
                    background: "hsl(145 63% 42%)",
                    color: "white",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onPublish();
                  }}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Publish
                </Button>
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

      {/* Start Live Session Dialog Modal */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-md bg-[#1c1c21] border-indigo-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" />
              Launch Live Session
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Enter a Session / Batch Name for this Live Quiz event. Students joining now will be assigned to this batch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Session Name (Batch Name)
              </label>
              <Input
                value={sessionNameInput}
                onChange={(e) => setSessionNameInput(e.target.value)}
                placeholder="e.g. CE Batch A, Division B, Placement Round 1"
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && sessionNameInput.trim()) {
                    startSessionMutation.mutate(sessionNameInput);
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSessionDialog(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!sessionNameInput.trim() || isStarting}
              onClick={() => startSessionMutation.mutate(sessionNameInput)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
            >
              {isStarting ? "Launching..." : "Launch Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}