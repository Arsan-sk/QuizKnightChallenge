import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  BarChart2, Plus, Users, Shield, Loader2, BookOpen,
  Tv, LayoutGrid, ChevronRight, TrendingUp, Zap, Award,
  FileCheck, FileText, List, Copy, Eye, Play, Square
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { QuizCard } from "@/components/quiz/QuizCard";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const renderQuizListTable = (quizList: Quiz[]) => (
    <div className="bg-[#1c1c21] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-[#131316]">
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quiz Title</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Access Code</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Attempts</th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Visibility</th>
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {quizList.map((quiz) => (
              <tr key={quiz.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="font-bold text-white text-sm">{quiz.title}</div>
                  <div className="text-xs text-zinc-400 line-clamp-1 max-w-xs">{quiz.description}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold border capitalize bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                    {quiz.quizType}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {quiz.accessCode ? (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(quiz.accessCode!);
                        toast({
                          title: "Access Code Copied!",
                          description: `Code "${quiz.accessCode}" copied to clipboard.`,
                          variant: "info",
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-indigo-400" />
                      {quiz.accessCode}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-bold text-white">
                    {(quiz as any).attemptCount || 0}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full font-semibold border",
                    quiz.isPublic
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                  )}>
                    {quiz.isPublic ? "Public" : "Private"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {quiz.isDraft && (
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(quiz.id)}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        Publish
                      </Button>
                    )}
                    <Link href={`/teacher/quiz/create?id=${quiz.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/quiz-analytics/${quiz.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-transparent border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20">
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/teacher"],
  });

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });

  const publishMutation = useMutation({
    mutationFn: async (quizId: number) => {
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/publish`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({ title: "Quiz Published", description: "Your quiz is now visible to students." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to publish quiz", variant: "destructive" });
    },
  });

  const publishedQuizzes = quizzes?.filter((q) => !q.isDraft) || [];
  const draftQuizzes = quizzes?.filter((q) => q.isDraft) || [];
  const activeQuizzes = quizzes?.filter((q) => q.isActive) || [];
  const totalQuizzes = quizzes?.length || 0;
  const liveNow = activeQuizzes.length;
  const isLoading = loadingQuizzes || loadingStats;

  const stats = [
    {
      label: "Total Quizzes",
      value: (statsData as any)?.totalQuizzes || totalQuizzes,
      icon: LayoutGrid,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary) / 0.12)",
    },
    {
      label: "Live Now",
      value: liveNow,
      icon: Zap,
      color: "hsl(0 72% 60%)",
      bg: "hsl(0 72% 51% / 0.12)",
      pulse: liveNow > 0,
    },
    {
      label: "Active Students",
      value: (statsData as any)?.studentsReached || 0,
      icon: Users,
      color: "hsl(145 63% 48%)",
      bg: "hsl(145 63% 42% / 0.12)",
    },
    {
      label: "Avg Quality",
      value: `${(statsData as any)?.averageScore || 0}%`,
      icon: Award,
      color: "hsl(38 95% 58%)",
      bg: "hsl(38 95% 58% / 0.12)",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: "Create Quiz",
      desc: "Build a new quiz with questions, images & settings",
      route: "/teacher/quiz/create",
      gradient: "linear-gradient(135deg, hsl(var(--primary) / 0.8), hsl(270 80% 55% / 0.8))",
      featured: true,
    },
    {
      icon: Tv,
      label: "Monitor Live",
      desc: "Watch students take quizzes in real time",
      route: activeQuizzes[0] ? `/teacher/monitor/${activeQuizzes[0].id}` : "/teacher",
      gradient: "linear-gradient(135deg, hsl(0 72% 51% / 0.6), hsl(20 90% 50% / 0.5))",
    },
    {
      icon: BarChart2,
      label: "Analytics",
      desc: "View detailed performance & participation data",
      route: "/quiz-analytics",
      gradient: "linear-gradient(135deg, hsl(145 63% 42% / 0.6), hsl(180 70% 40% / 0.5))",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))]"
        />
        <p className="mt-4 text-[hsl(var(--muted-foreground))] text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden px-5 sm:px-6 md:px-8 py-6 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(270 80% 60% / 0.12) 100%)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background: "radial-gradient(ellipse at 100% 0%, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Shield
                className="w-5 h-5"
                style={{ color: "hsl(var(--accent-h) var(--accent-s) var(--accent-l))" }}
              />
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[hsl(var(--foreground))]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Welcome, {user?.username}! 🎓
              </h1>
            </div>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Manage quizzes, monitor live sessions, and track student performance.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <Link href="/teacher/quiz/create">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="sm"
                  className="gap-2 font-semibold"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.5)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Quiz
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial="initial" animate="animate" variants={stagger}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="clay-card p-4 sm:p-5 flex flex-col gap-3"
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center self-start"
                  style={{ background: stat.bg }}
                >
                  {stat.pulse ? (
                    <div className="relative">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} strokeWidth={2} />
                      <span className="absolute -top-1 -right-1 live-dot w-2 h-2" />
                    </div>
                  ) : (
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} strokeWidth={2} />
                  )}
                </div>
                <div>
                  <div
                    className="text-xl sm:text-2xl font-extrabold stat-number text-[hsl(var(--foreground))]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[hsl(var(--muted-foreground))] font-medium mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial="initial" animate="animate" variants={stagger}>
          <h2
            className="text-lg font-bold text-[hsl(var(--foreground))] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Quick Commands
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.label}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
              >
                <Link href={action.route}>
                  <div
                    className="clay-card p-5 sm:p-6 cursor-pointer relative overflow-hidden group"
                    style={{
                      border: action.featured ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: action.gradient }}
                    />
                    <div className="relative z-10">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: "hsl(var(--muted) / 0.5)" }}
                      >
                        <action.icon className="w-5 h-5 text-[hsl(var(--foreground))]" strokeWidth={2} />
                      </div>
                      <div
                        className="font-bold text-[hsl(var(--foreground))] mb-1"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {action.label}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                        {action.desc}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quizzes list with Published / Drafts tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold text-[hsl(var(--foreground))]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Your Quizzes
            </h2>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {totalQuizzes} quiz{totalQuizzes !== 1 ? "zes" : ""}
            </span>
          </div>

          {!quizzes || quizzes.length === 0 ? (
            <div className="clay-card p-12 text-center">
              <BookOpen
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <h3
                className="font-bold text-[hsl(var(--foreground))] mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                No quizzes yet
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Create your first quiz to get started.
              </p>
              <Link href="/teacher/quiz/create">
                <Button
                  className="gap-2 font-semibold"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create First Quiz
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue="published">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <TabsList
                  className="rounded-xl p-1"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  <TabsTrigger value="published" className="rounded-lg text-xs sm:text-sm font-medium gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    Published ({publishedQuizzes.length})
                  </TabsTrigger>
                  <TabsTrigger value="drafts" className="rounded-lg text-xs sm:text-sm font-medium gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Drafts ({draftQuizzes.length})
                  </TabsTrigger>
                </TabsList>

                {/* View Mode Switcher (Card vs List) */}
                <div className="flex items-center gap-1 bg-[#1c1c21] border border-white/5 p-1 rounded-xl w-fit">
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
                </div>
              </div>

              <TabsContent value="published">
                {publishedQuizzes.length === 0 ? (
                  <div className="clay-card p-10 text-center">
                    <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      No published quizzes yet. Create a quiz and publish it.
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  renderQuizListTable(publishedQuizzes)
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {publishedQuizzes.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        actionLabel="Edit"
                        actionPath={`/teacher/quiz/create?id=${quiz.id}`}
                        isTeacher={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="drafts">
                {draftQuizzes.length === 0 ? (
                  <div className="clay-card p-10 text-center">
                    <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      No drafts. Saved drafts will appear here.
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  renderQuizListTable(draftQuizzes)
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {draftQuizzes.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        actionLabel="Edit"
                        actionPath={`/teacher/quiz/create?id=${quiz.id}`}
                        isTeacher={true}
                        onPublish={() => publishMutation.mutate(quiz.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>

      </div>
    </div>
  );
}