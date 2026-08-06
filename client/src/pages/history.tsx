import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Clock, Eye, FileEdit, ListChecks, BarChart3, BookOpen, AlertCircle, List, LayoutGrid, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { QuizCard } from "@/components/quiz/QuizCard";

interface QuizAttempt {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number;
  maxScore: number;
  completedAt: string;
  timeTaken: number;
  correctAnswers?: number;
  totalQuestions?: number;
}

interface QuizCreation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  questionCount: number;
  attempts: number;
  accessCode?: string;
}

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  const { data: quizAttempts, isLoading: attemptsLoading, error: attemptsError, refetch: refetchAttempts } = useQuery({
    queryKey: ["quizAttempts"],
    queryFn: async () => {
      const response = await fetch("/api/results/user");
      if (!response.ok) throw new Error("Failed to fetch quiz attempts");
      return response.json() as Promise<QuizAttempt[]>;
    },
    enabled: user?.role === "student",
  });

  const { data: createdQuizzes, isLoading: quizzesLoading, error: quizzesError, refetch: refetchQuizzes } = useQuery({
    queryKey: ["createdQuizzes"],
    queryFn: async () => {
      const response = await fetch("/api/quizzes/teacher");
      if (!response.ok) throw new Error("Failed to fetch created quizzes");
      return response.json() as Promise<QuizCreation[]>;
    },
    enabled: user?.role === "teacher",
  });

  const getScoreStyle = (pct: number) => {
    if (pct >= 80) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 font-extrabold";
    if (pct >= 60) return "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 font-extrabold";
    if (pct >= 40) return "text-amber-400 bg-amber-500/15 border-amber-500/30 font-extrabold";
    return "text-rose-400 bg-rose-500/15 border-rose-500/30 font-extrabold";
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="clay-card p-10 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Please log in to view your history.</p>
          <Button onClick={() => navigate("/auth")} style={{ background: "hsl(var(--primary))" }}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (user.role === "student") {
    if (attemptsLoading) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      );
    }

    if (attemptsError) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center min-h-[40vh]">
          <div className="clay-card p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-[hsl(var(--danger-h) var(--danger-s) 60%)]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              {attemptsError instanceof Error ? attemptsError.message : "Error loading attempts"}
            </p>
            <Button onClick={() => refetchAttempts()} variant="outline">Try Again</Button>
          </div>
        </div>
      );
    }

    if (!quizAttempts?.length) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
          <div className="clay-card p-12 text-center">
            <ListChecks className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="font-bold text-[hsl(var(--foreground))] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No quiz attempts yet</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
              Start taking quizzes to track your progress!
            </p>
            <Button onClick={() => navigate("/student/quizzes")} style={{ background: "hsl(var(--primary))" }}>
              Browse Quizzes
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-extrabold text-[hsl(var(--foreground))]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Quiz History
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {quizAttempts.length} attempt{quizAttempts.length !== 1 ? "s" : ""} completed
          </p>
        </motion.div>

        <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-3">
          {quizAttempts.map((attempt) => {
            const totalQ = attempt.totalQuestions;
            const correct = attempt.correctAnswers;
            const score = attempt.score || 0;
            const maxS = attempt.maxScore || (totalQ ? totalQ * 10 : 100);

            let pct = 0;
            if (totalQ && totalQ > 0 && typeof correct === "number") {
              pct = Math.round((correct / totalQ) * 100);
            } else if (maxS > 0) {
              pct = Math.round((score / maxS) * 100);
            } else {
              pct = Math.min(100, Math.round(score));
            }

            return (
              <motion.div
                key={attempt.id}
                variants={fadeUp}
                whileHover={{ x: 2, transition: { duration: 0.15 } }}
                className="clay-card px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-lg border shrink-0 text-center min-w-[52px]",
                      getScoreStyle(pct)
                    )}
                  >
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {attempt.quizTitle}
                    </div>
                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-3 mt-1">
                      <span>{attempt.completedAt ? format(new Date(attempt.completedAt), "PPP") : "Recently"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        {Math.floor((attempt.timeTaken || 0) / 60)}m {(attempt.timeTaken || 0) % 60}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <div className="text-xs font-mono font-bold text-zinc-300">
                    {typeof correct === "number" && totalQ ? `${correct}/${totalQ} Correct` : `${score} pts`}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg"
                    onClick={() => navigate(`/student/quiz/${attempt.quizId}?view=results`)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Review
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    );
  }

  if (user.role === "teacher") {
    if (quizzesLoading) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      );
    }

    const publishedQuizzes = createdQuizzes?.filter(q => !(q as any).isDraft) || [];
    const draftQuizzes = createdQuizzes?.filter(q => (q as any).isDraft) || [];

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[hsl(var(--foreground))]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quiz Management
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {createdQuizzes?.length || 0} quizzes created
            </p>
          </div>
          <Button
            onClick={() => navigate("/teacher/quiz/create")}
            style={{ background: "hsl(var(--primary))" }}
            className="text-sm font-semibold"
          >
            Create New Quiz
          </Button>
        </motion.div>

        <Tabs defaultValue="published">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TabsList
              className="rounded-xl p-1 bg-[#1c1c21] border border-white/5 w-fit"
            >
              <TabsTrigger value="published" className="rounded-lg text-xs sm:text-sm font-medium">
                Published ({publishedQuizzes.length})
              </TabsTrigger>
              <TabsTrigger value="drafts" className="rounded-lg text-xs sm:text-sm font-medium">
                Drafts ({draftQuizzes.length})
              </TabsTrigger>
            </TabsList>

            {/* View Mode Switcher (List vs Card) */}
            <div className="flex items-center gap-1 bg-[#1c1c21] border border-white/5 p-1 rounded-xl w-fit">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5",
                  viewMode === "list"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("card")}
                className={cn(
                  "h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5",
                  viewMode === "card"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Card View
              </Button>
            </div>
          </div>

          {[
            { value: "published", data: publishedQuizzes },
            { value: "drafts", data: draftQuizzes },
          ].map(({ value, data }) => (
            <TabsContent key={value} value={value}>
              {data.length === 0 ? (
                <div className="clay-card p-10 text-center">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No {value} quizzes.</p>
                </div>
              ) : viewMode === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {data.map((quiz: any) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      actionLabel="Edit"
                      actionPath={`/teacher/quiz/create?id=${quiz.id}`}
                      isTeacher={true}
                    />
                  ))}
                </div>
              ) : (
                <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-3">
                  {data.map((quiz: any) => (
                    <motion.div
                      key={quiz.id}
                      variants={fadeUp}
                      className="clay-card px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "hsl(var(--primary) / 0.12)" }}
                        >
                          <BookOpen className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[hsl(var(--foreground))] truncate"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {quiz.title}
                          </div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                            <span>Created {quiz.createdAt ? format(new Date(quiz.createdAt), "PP") : "Recently"}</span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {(quiz as any).attemptCount || quiz.attempts || 0} attempts
                            </span>
                            {quiz.accessCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(quiz.accessCode);
                                  toast({
                                    title: "Access Code Copied!",
                                    description: `Code "${quiz.accessCode}" copied to clipboard.`,
                                    variant: "info",
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/20 cursor-pointer"
                              >
                                <Copy className="w-3 h-3 text-indigo-400" />
                                Code: {quiz.accessCode}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => navigate(`/teacher/quiz/create?id=${quiz.id}`)}
                        >
                          <FileEdit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => navigate(`/quiz-analytics/${quiz.id}`)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  return <></>;
}