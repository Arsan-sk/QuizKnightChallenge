import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileStats } from "./ProfileStats";
import { AchievementBadge } from "./AchievementBadge";
import { ProgressRing } from "./ProgressRing";
import {
    Trophy,
    Target,
    TrendingUp,
    Award,
    Flame,
    BookOpen,
    Calendar,
} from "lucide-react";
import { User } from "@shared/schema";

interface StudentProfileProps {
    profile: {
        id: number;
        username: string;
        points?: number | null;
        branch?: string;
        year?: string;
    };
}

export function StudentProfile({ profile }: StudentProfileProps) {
    // Fetch dynamic stats from server
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: [`/api/users/${profile.id}/stats`],
        enabled: !!profile.id, // Only fetch if we have a valid profile ID
    });

    // Fallback values while loading
    const quizzesCompleted = (stats as any)?.quizzesCompleted ?? 0;
    const totalPoints = (stats as any)?.totalPoints ?? profile.points ?? 0;
    const averageScore = (stats as any)?.averageScore ?? 0;
    const currentStreak = (stats as any)?.currentStreak ?? 0;
    const rank = (stats as any)?.rank ?? 0;
    const level = (stats as any)?.level ?? Math.floor(totalPoints / 100) + 1;
    const levelProgress = (stats as any)?.levelProgress ?? (totalPoints % 100);

    const recentResults = (stats as any)?.recentResults ?? [];

    // Compute achievements heuristically from stats/recent results
    const achievements = [
        {
            name: "First Steps",
            description: "Complete your first quiz",
            icon: "trophy",
            unlocked: quizzesCompleted > 0,
            progress: quizzesCompleted > 0 ? 100 : Math.min(quizzesCompleted * 20, 100),
        },
        {
            name: "Quiz Master",
            description: "Complete 10 quizzes",
            icon: "crown",
            unlocked: quizzesCompleted >= 10,
            progress: Math.min((quizzesCompleted / 10) * 100, 100),
        },
        {
            name: "Perfect Score",
            description: "Get 100% on a quiz",
            icon: "star",
            unlocked: recentResults.some((r: any) => r.score === 100),
            progress: recentResults.some((r: any) => r.score === 100) ? 100 : 0,
        },
        {
            name: "Dedicated Learner",
            description: "Maintain a 7-day streak",
            icon: "flame",
            unlocked: currentStreak >= 7,
            progress: Math.min((currentStreak / 7) * 100, 100),
        },
        {
            name: "Point Collector",
            description: "Earn 500 points",
            icon: "zap",
            unlocked: totalPoints >= 500,
            progress: Math.min((totalPoints / 500) * 100, 100),
        },
        {
            name: "Top Performer",
            description: "Reach top 10 on leaderboard",
            icon: "medal",
            unlocked: rank > 0 && rank <= 10,
            progress: rank > 0 ? Math.max(100 - rank * 5, 0) : 0,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfileStats
                    title="Total Points"
                    value={totalPoints}
                    icon={Trophy}
                    description="XP earned"
                    gradient="from-yellow-500 to-amber-500"
                    delay={0}
                />
                <ProfileStats
                    title="Quizzes Completed"
                    value={quizzesCompleted}
                    icon={BookOpen}
                    description="Total attempts"
                    gradient="from-blue-500 to-cyan-500"
                    delay={0.1}
                />
                <ProfileStats
                    title="Average Score"
                    value={averageScore}
                    icon={Target}
                    suffix="%"
                    description="Overall performance"
                    gradient="from-green-500 to-emerald-500"
                    delay={0.2}
                />
                <ProfileStats
                    title="Current Streak"
                    value={currentStreak}
                    icon={Flame}
                    description="Days in a row"
                    gradient="from-orange-500 to-red-500"
                    delay={0.3}
                />
            </div>

            {/* Level and Rank */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="clay-card p-6 h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--foreground))]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                                Level Progress
                            </h3>
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                            <ProgressRing
                                progress={levelProgress}
                                size={140}
                                strokeWidth={12}
                                color="#3b82f6"
                                label={`Level ${level}`}
                            />
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted)/0.2)] px-4 py-1.5 rounded-full">
                                {100 - levelProgress} points to Level {level + 1}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="clay-card p-6 h-full flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-[hsl(var(--foreground))]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <Award className="h-5 w-5 text-purple-500" />
                                Leaderboard Rank
                            </h3>
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 space-y-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
                            <div className="text-center relative z-10 w-full">
                                <div className="text-6xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform drop-shadow-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    {rank > 0 ? `#${rank}` : 'Unranked'}
                                </div>
                                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mt-4 bg-[hsl(var(--muted)/0.15)] inline-block px-4 py-1.5 rounded-full">
                                    {profile.branch ? `${profile.branch} ` : 'Global '}
                                    {profile.year ? `· ${profile.year} Year` : 'Rank'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs for Achievements and Activity */}
            <Tabs defaultValue="achievements" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="achievements" className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {achievements.map((achievement, index) => (
                            <AchievementBadge
                                key={achievement.name}
                                name={achievement.name}
                                description={achievement.description}
                                icon={achievement.icon}
                                unlocked={achievement.unlocked}
                                progress={achievement.progress}
                                index={index}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                    <div className="clay-card p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent Quiz Results</h3>
                        </div>
                        <div>
                            {recentResults.length > 0 ? (
                                <div className="space-y-3">
                                    {(recentResults || []).slice(0, 5).map((result: any, index: number) => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group cursor-default shadow-sm hover:shadow"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold group-hover:scale-110 transition-transform">
                                                    #{result.quizId}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[hsl(var(--foreground))]">Quiz Completion</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-1.5 mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(result.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wider">Score</p>
                                                    <p className={`font-bold text-lg ${result.score >= 80 ? 'text-[#10b981]' : result.score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>
                                                        {result.score}%
                                                    </p>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-right min-w-[70px]">
                                                    <p className="text-[10px] uppercase font-bold text-[#f59e0b] tracking-wider text-center">Points</p>
                                                    <p className="text-sm font-black text-[#f59e0b] text-center">
                                                        +{result.pointsEarned ?? (result.correctAnswers ? result.correctAnswers * 2 : 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-[hsl(var(--muted)/0.1)] rounded-xl border border-dashed border-[hsl(var(--border))]">
                                    <div className="w-16 h-16 rounded-full bg-[hsl(var(--muted)/0.2)] flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
                                    </div>
                                    <p className="text-[hsl(var(--muted-foreground))] font-medium mb-1">
                                        No quiz results yet
                                    </p>
                                    <p className="text-sm text-[hsl(var(--text-2))]">
                                        Start taking quizzes to see your activity!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
