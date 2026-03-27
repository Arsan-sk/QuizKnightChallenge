import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  BarChart2, Plus, Users, Shield, Loader2, BookOpen,
  Tv, LayoutGrid, ChevronRight, TrendingUp, Zap, Award
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { QuizCard } from "@/components/quiz/QuizCard";
import { useState } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes/teacher"],
  });

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });

  const activeQuizzes = quizzes?.filter((q) => q.isActive) || [];
  const totalQuizzes = quizzes?.length || 0;
  const liveNow = activeQuizzes.length;
  const isLoading = loadingQuizzes || loadingStats;

  const stats = [
    {
      label: "Total Quizzes",
      value: statsData?.totalQuizzes || totalQuizzes,
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
      value: statsData?.studentsReached || 0,
      icon: Users,
      color: "hsl(145 63% 48%)",
      bg: "hsl(145 63% 42% / 0.12)",
    },
    {
      label: "Avg Quality",
      value: `${statsData?.averageScore || 0}%`,
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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Hero Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden px-6 md:px-8 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
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
                className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--foreground))]"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="clay-card p-5 flex flex-col gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center self-start"
                  style={{ background: stat.bg }}
                >
                  {stat.pulse ? (
                    <div className="relative">
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2} />
                      <span className="absolute -top-1 -right-1 live-dot w-2 h-2" />
                    </div>
                  ) : (
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} strokeWidth={2} />
                  )}
                </div>
                <div>
                  <div
                    className="text-2xl font-extrabold stat-number text-[hsl(var(--foreground))]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] font-medium mt-0.5">
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
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.label}
                variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
              >
                <Link href={action.route}>
                  <div
                    className="clay-card p-6 cursor-pointer relative overflow-hidden group"
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

        {/* Quizzes list */}
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
            <div
              className="clay-card p-12 text-center"
            >
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
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
        </motion.div>

      </div>
    </div>
  );
}