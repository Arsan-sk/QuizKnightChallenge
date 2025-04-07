import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Result, Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Trophy, 
  BookOpen, 
  Target, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  LineChart, 
  BookText, 
  Award,
  Lightbulb,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/layout/nav-bar";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizCard } from "@/components/quiz/QuizCard";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";
import { useEffect, useState } from "react";
import { ParticleBackground } from "@/components/ui/particle-background";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { FlipCard } from "@/components/ui/flip-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ConfettiOverlay } from "@/components/ui/confetti-overlay";

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
    refetchInterval: 30000, // Refetch every 30 seconds to check for new live quizzes
  });

  // Set time of day for greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay('morning');
    } else if (hour >= 12 && hour < 18) {
      setTimeOfDay('afternoon');
    } else {
      setTimeOfDay('evening');
    }
  }, []);

  // Trigger confetti after dashboard loads if user has high points
  useEffect(() => {
    if (user && user.points && user.points > 100 && !hasAnimated) {
      const timer = setTimeout(() => {
        setShowConfetti(true);
        setHasAnimated(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasAnimated]);

  // Calculate the correct average score based on the stored score values
  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / results.length);
  };

  // Calculate total points earned from quizzes
  const calculateTotalPoints = () => {
    if (!user) return 0;
    return user.points || 0;
  };

  // Get the number of completed quizzes
  const getCompletedQuizCount = () => {
    if (!results) return 0;
    return results.length;
  };

  // Calculate completion percentage for visual display
  const calculateCompletionPercentage = () => {
    // This is just a placeholder - in a real app you'd calculate this based
    // on total available quizzes vs completed quizzes
    const completedQuizzes = getCompletedQuizCount();
    // Assume there are 20 total quizzes (or adjust as needed)
    return Math.min(100, (completedQuizzes / 20) * 100);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    switch (timeOfDay) {
      case 'morning': return 'Good morning';
      case 'afternoon': return 'Good afternoon';
      case 'evening': return 'Good evening';
      default: return 'Welcome';
    }
  };

  if (loadingResults || loadingLiveQuizzes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 0, 0, 0, 0, 0, 0, 0, 0, 180, 180, 180, 180, 180, 180, 180, 180, 360],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Loader2 className="h-12 w-12 text-primary" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-muted-foreground"
        >
          Loading your personalized dashboard...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Subtle background particles for visual enhancement */}
      <ParticleBackground variant="subtle" />
      
      {/* Confetti overlay for achievements */}
      <ConfettiOverlay 
        active={showConfetti} 
        duration={4000} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      <NavBar />
      
      <div className="container mx-auto p-8">
        {/* Welcome header section */}
        <AnimatePresence mode="wait">
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex items-center mb-2"
              >
                <Sparkles className="h-6 w-6 mr-2 text-primary" />
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {user?.username}!
                </h1>
              </motion.div>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Ready to test your knowledge and climb the leaderboard?
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-4 md:mt-0"
            >
              <ProgressCircle 
                value={calculateCompletionPercentage()} 
                size={80} 
                color="stroke-primary" 
                strokeWidth={8}
                className="mx-auto md:mx-0"
                labelSize="sm"
              />
              <p className="text-xs text-center md:text-right text-muted-foreground mt-2">
                Course Progress
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Leaderboard Widget - Untouched as requested */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <LeaderboardWidget 
            limit={8} 
            autoRefresh={true}
            visualStyle="comparative"
            className="w-full shadow-md border-2 border-accent/40"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Live Quizzes Section */}
            {liveQuizzes && liveQuizzes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-lg opacity-70"
                  animate={{ 
                    opacity: [0.5, 0.8, 0.5], 
                    scale: [1, 1.02, 1] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 5,
                    repeatType: "reverse" 
                  }}
                />
                
                <div className="relative bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    <span className="relative">
                      Live Quizzes
                      <motion.span 
                        className="absolute -right-6 top-0 h-2 w-2 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {liveQuizzes.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        actionLabel="Take Quiz"
                        actionPath={`/student/quiz/${quiz.id}`}
                        teacherName={quiz.teacherName}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats Section - Enhanced with Flip Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Your Stats
                </h2>
                <Link href="/leaderboard">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 group">
                    <span>Global Leaderboard</span> 
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Points Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-[160px]"
                >
                  <FlipCard
                    front={
                      <Card className="h-full border-2 border-primary/10 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 space-y-0">
                          <CardTitle className="text-sm flex items-center">
                            <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                            Your Points
                          </CardTitle>
                          <CardDescription className="text-xs">2 points per correct answer</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[80px]">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
                          >
                            <AnimatedCounter
                              end={calculateTotalPoints()}
                              duration={1.5}
                              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500"
                            />
                          </motion.div>
                        </CardContent>
                      </Card>
                    }
                    back={
                      <Card className="h-full border-2 border-primary/20 shadow-md bg-gradient-to-br from-card to-card/80">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-sm">Points Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 pt-2">
                          <div className="flex justify-between items-center">
                            <span>Quiz Completions:</span>
                            <span className="font-medium">{getCompletedQuizCount() * 2} pts</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Correct Answers:</span>
                            <span className="font-medium">
                              {calculateTotalPoints() - (getCompletedQuizCount() * 2)} pts
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            <Lightbulb className="h-3 w-3 inline mr-1" />
                            <span>Earn more by taking quizzes and giving correct answers!</span>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                </motion.div>

                {/* Quizzes Completed Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-[160px]"
                >
                  <FlipCard
                    front={
                      <Card className="h-full border-2 border-primary/10 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 space-y-0">
                          <CardTitle className="text-sm flex items-center">
                            <BookText className="mr-2 h-4 w-4 text-blue-500" />
                            Quizzes Completed
                          </CardTitle>
                          <CardDescription className="text-xs">Total attempts submitted</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[80px]">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.7 }}
                          >
                            <AnimatedCounter
                              end={getCompletedQuizCount()}
                              duration={1.5}
                              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500"
                            />
                          </motion.div>
                        </CardContent>
                      </Card>
                    }
                    back={
                      <Card className="h-full border-2 border-primary/20 shadow-md bg-gradient-to-br from-card to-card/80">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-sm">Recent Quizzes</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2 pt-2 overflow-hidden">
                          {results && results.length > 0 ? (
                            <div className="space-y-1 max-h-[80px] overflow-y-auto">
                              {results.slice(0, 3).map((result, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                  <span className="truncate mr-2 max-w-[120px]">
                                    {result.quizTitle || `Quiz #${result.quizId}`}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    {result.score}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground pt-2">
                              <GraduationCap className="h-3 w-3 inline mr-1" />
                              <span>Complete quizzes to see your history here!</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    }
                  />
                </motion.div>

                {/* Average Score Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="h-[160px]"
                >
                  <FlipCard
                    front={
                      <Card className="h-full border-2 border-primary/10 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2 space-y-0">
                          <CardTitle className="text-sm flex items-center">
                            <LineChart className="mr-2 h-4 w-4 text-green-500" />
                            Average Score
                          </CardTitle>
                          <CardDescription className="text-xs">Across all quizzes</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[80px]">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
                          >
                            <AnimatedCounter
                              end={calculateAverageScore()}
                              duration={1.5}
                              suffix="%"
                              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500"
                            />
                          </motion.div>
                        </CardContent>
                      </Card>
                    }
                    back={
                      <Card className="h-full border-2 border-primary/20 shadow-md bg-gradient-to-br from-card to-card/80">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-sm">Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center justify-center h-[80px]">
                            {calculateAverageScore() >= 80 ? (
                              <div className="text-center">
                                <Award className="h-8 w-8 text-yellow-500 mx-auto mb-1" />
                                <span className="text-sm font-medium">Excellent!</span>
                                <p className="text-xs text-muted-foreground">Keep it up!</p>
                              </div>
                            ) : calculateAverageScore() >= 60 ? (
                              <div className="text-center">
                                <Target className="h-8 w-8 text-blue-500 mx-auto mb-1" />
                                <span className="text-sm font-medium">Good job!</span>
                                <p className="text-xs text-muted-foreground">You're making progress!</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <BookOpen className="h-8 w-8 text-primary mx-auto mb-1" />
                                <span className="text-sm font-medium">Keep learning!</span>
                                <p className="text-xs text-muted-foreground">You'll improve with practice.</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Browse Quizzes Button - Enhanced with animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <Link href="/student/quizzes">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" className="gap-2 relative overflow-hidden group">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                      animate={{ 
                        x: ["0%", "100%"],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "linear",
                      }}
                    />
                    <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    <span className="relative">Browse Available Quizzes</span>
                  </Button>
                </motion.div>
              </Link>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xs text-muted-foreground mt-3"
              >
                <Lightbulb className="h-3 w-3 inline mr-1" />
                Discover new quizzes and challenge yourself!
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}