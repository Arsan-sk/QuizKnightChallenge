import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Result, Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Trophy, BookOpen, Target, Clock, ChevronRight, Sparkles,
  LineChart, BookText, Award, Lightbulb, GraduationCap, Loader2, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { QuizCard } from "@/components/quiz/QuizCard";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";
import { useEffect, useState } from "react";
import { ParticleBackground } from "@/components/ui/particle-background";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { FlipCard } from "@/components/ui/flip-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ConfettiOverlay } from "@/components/ui/confetti-overlay";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [hasAnimated, setHasAnimated] = useState(false);

  const { data: results, isLoading: loadingResults } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
  });

  const { data: liveQuizzes, isLoading: loadingLiveQuizzes } = useQuery<(Quiz & { teacherName: string })[]>({
    queryKey: ["/api/quizzes/live"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  useEffect(() => {
    if (user && user.points && user.points > 100 && !hasAnimated) {
      const timer = setTimeout(() => { setShowConfetti(true); setHasAnimated(true); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasAnimated]);

  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  };

  const getCompletedQuizCount = () => results?.length || 0;
  const calculateTotalPoints = () => user?.points || 0;
  const calculateCompletionPercentage = () => Math.min(100, (getCompletedQuizCount() / 20) * 100);

  const getGreeting = () => {
    const emoji = timeOfDay === 'morning' ? '☀️' : timeOfDay === 'afternoon' ? '⚡' : '🌙';
    return `Good ${timeOfDay}, ${user?.username}! ${emoji}`;
  };

  if (loadingResults || loadingLiveQuizzes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 rounded-full border-2 border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))]"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-[hsl(var(--muted-foreground))] text-sm"
        >
          Loading your personalized dashboard...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-mesh-primary">
      <ParticleBackground variant="subtle" />
      <ConfettiOverlay active={showConfetti} duration={4000} onComplete={() => setShowConfetti(false)} />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Hero Greeting */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative rounded-2xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.25) 0%, hsl(270 80% 60% / 0.15) 100%)",
            border: "1px solid hsl(var(--primary) / 0.2)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse at 0% 100%, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
            }}
          />

          <motion.div variants={fadeUp} className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--accent-h) var(--accent-s) var(--accent-l))]" />
              <h1
                className="text-2xl md:text-3xl font-extrabold text-[hsl(var(--foreground))]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {getGreeting()}
              </h1>
            </div>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Ready to challenge yourself and climb the leaderboard?
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="relative z-10 flex flex-col items-center">
            <ProgressCircle
              value={calculateCompletionPercentage()}
              size={80}
              color="stroke-[hsl(var(--primary))]"
              strokeWidth={8}
              labelSize="sm"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Daily Goal</p>
          </motion.div>
        </motion.div>

        {/* Stat cards — Flip Cards (PRESERVED) */}
        <motion.div initial="initial" animate="animate" variants={stagger}>
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Trophy className="h-5 w-5 text-[hsl(var(--accent-h) var(--accent-s) var(--accent-l))]" />
              Your Stats
            </h2>
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="text-xs gap-1 group text-[hsl(var(--muted-foreground))]">
                <span>Global Leaderboard</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Points */}
            <motion.div variants={fadeUp} className="h-[160px]">
              <FlipCard
                front={
                  <div
                    className="h-full rounded-2xl border p-5 flex flex-col"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 20px -4px hsl(0 0% 0% / 0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4" style={{ color: "hsl(var(--accent-h) var(--accent-s) var(--accent-l))" }} />
                      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Your Points</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <AnimatedCounter
                        end={calculateTotalPoints()}
                        duration={1.5}
                        className="text-4xl font-bold stat-number gradient-text-gold"
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">2 pts per correct answer</p>
                  </div>
                }
                back={
                  <div
                    className="h-full rounded-2xl border p-4"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  >
                    <p className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Points Breakdown</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Quiz Completions:</span>
                        <span className="font-medium">{getCompletedQuizCount() * 2} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--muted-foreground))]">Correct Answers:</span>
                        <span className="font-medium">{calculateTotalPoints() - (getCompletedQuizCount() * 2)} pts</span>
                      </div>
                      <div className="mt-3 p-2 rounded-lg text-[hsl(var(--muted-foreground))]"
                        style={{ background: "hsl(var(--muted) / 0.5)" }}>
                        <Lightbulb className="h-3 w-3 inline mr-1" />
                        Take more quizzes to earn more!
                      </div>
                    </div>
                  </div>
                }
              />
            </motion.div>

            {/* Quizzes Completed */}
            <motion.div variants={fadeUp} className="h-[160px]">
              <FlipCard
                front={
                  <div
                    className="h-full rounded-2xl border p-5 flex flex-col"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 20px -4px hsl(0 0% 0% / 0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BookText className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Quizzes Completed</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <AnimatedCounter
                        end={getCompletedQuizCount()}
                        duration={1.5}
                        className="text-4xl font-bold stat-number"
                        style={{ background: "linear-gradient(135deg, #60a5fa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Total attempts submitted</p>
                  </div>
                }
                back={
                  <div
                    className="h-full rounded-2xl border p-4"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  >
                    <p className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Recent Quizzes</p>
                    {results && results.length > 0 ? (
                      <div className="space-y-1.5">
                        {results.slice(0, 3).map((result, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="truncate max-w-[120px] text-[hsl(var(--muted-foreground))]">
                              {result.quizTitle || `Quiz #${result.quizId}`}
                            </span>
                            <span
                              className="font-semibold rounded px-1.5 py-0.5"
                              style={{
                                background: result.score >= 80 ? "hsl(145 63% 42% / 0.2)" : result.score >= 60 ? "hsl(38 95% 58% / 0.2)" : "hsl(0 72% 51% / 0.2)",
                                color: result.score >= 80 ? "hsl(145 63% 60%)" : result.score >= 60 ? "hsl(38 95% 65%)" : "hsl(0 72% 60%)",
                              }}
                            >
                              {result.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        <GraduationCap className="h-3 w-3 inline mr-1" />
                        Complete quizzes to see history!
                      </div>
                    )}
                  </div>
                }
              />
            </motion.div>

            {/* Average Score */}
            <motion.div variants={fadeUp} className="h-[160px]">
              <FlipCard
                front={
                  <div
                    className="h-full rounded-2xl border p-5 flex flex-col"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 20px -4px hsl(0 0% 0% / 0.3)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <LineChart className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Average Score</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <AnimatedCounter
                        end={calculateAverageScore()}
                        duration={1.5}
                        suffix="%"
                        className="text-4xl font-bold stat-number score-excellent"
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Across all quizzes</p>
                  </div>
                }
                back={
                  <div
                    className="h-full rounded-2xl border p-4 flex items-center justify-center"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  >
                    {calculateAverageScore() >= 80 ? (
                      <div className="text-center">
                        <Award className="h-10 w-10 mx-auto mb-2" style={{ color: "hsl(38 95% 58%)" }} />
                        <p className="font-bold text-sm">Excellent!</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Top 5% of students</p>
                      </div>
                    ) : calculateAverageScore() >= 60 ? (
                      <div className="text-center">
                        <Target className="h-10 w-10 text-blue-400 mx-auto mb-2" />
                        <p className="font-bold text-sm">Good job!</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">You're making progress!</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <BookOpen className="h-10 w-10 text-[hsl(var(--primary))] mx-auto mb-2" />
                        <p className="font-bold text-sm">Keep learning!</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Practice makes perfect.</p>
                      </div>
                    )}
                  </div>
                }
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Live Quizzes */}
        <AnimatePresence>
          {liveQuizzes && liveQuizzes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative"
            >
              <motion.div
                className="absolute -inset-1 rounded-2xl blur-lg opacity-50"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ repeat: Infinity, duration: 4 }}
                style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(270 80% 60% / 0.2))" }}
              />
              <div
                className="relative rounded-2xl p-6"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="live-dot" />
                  <h2
                    className="text-lg font-bold text-[hsl(var(--foreground))]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Live Quizzes
                  </h2>
                  <span className="badge-danger text-[10px] px-2 py-0.5">LIVE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {liveQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      actionLabel="Join Now"
                      actionPath={`/student/quiz/${quiz.id}`}
                      teacherName={quiz.teacherName}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <LeaderboardWidget
            limit={8}
            autoRefresh={true}
            visualStyle="comparative"
            className="w-full"
          />
        </motion.div>

        {/* Browse CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <Link href="/student/quizzes">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Button
                size="lg"
                className="gap-2 px-10 font-semibold"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 6px 20px -4px hsl(var(--primary) / 0.5)",
                }}
              >
                <BookOpen className="h-5 w-5" />
                Browse Available Quizzes
              </Button>
            </motion.div>
          </Link>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
            <Lightbulb className="h-3 w-3 inline mr-1" />
            Discover new quizzes and challenge yourself!
          </p>
        </motion.div>

      </div>
    </div>
  );
}