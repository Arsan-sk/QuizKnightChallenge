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
} from "lucide-react";
import { User } from "@shared/schema";

interface StudentProfileProps {
    profile: User;
}

export function StudentProfile({ profile }: StudentProfileProps) {
    // Fetch dynamic stats from server
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: [`/api/users/${profile.id}/stats`],
        enabled: !!profile.id, // Only fetch if we have a valid profile ID
    });

    // Fallback values while loading
    const quizzesCompleted = stats?.quizzesCompleted ?? 0;
    const totalPoints = stats?.totalPoints ?? profile.points ?? 0;
    const averageScore = stats?.averageScore ?? 0;
    const currentStreak = stats?.currentStreak ?? 0;
    const rank = stats?.rank ?? 0;
    const level = stats?.level ?? Math.floor(totalPoints / 100) + 1;
    const levelProgress = stats?.levelProgress ?? (totalPoints % 100);

    const recentResults = stats?.recentResults ?? [];

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
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                Level Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-6 pb-8">
                            <ProgressRing
                                progress={levelProgress}
                                size={140}
                                strokeWidth={12}
                                color="#3b82f6"
                                label={`Level ${level}`}
                            />
                            <p className="text-sm text-muted-foreground font-medium">
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{100 - levelProgress}</span> points to Level {level + 1}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                                Leaderboard Rank
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-6 pb-8">
                            <div className="text-center">
                                <div className="text-7xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                                    #{rank || "--"}
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 font-medium">
                                    {profile.branch && `${profile.branch} - `}
                                    {profile.year && `${profile.year} Year`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Tabs for Achievements and Activity */}
            <Tabs defaultValue="achievements" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-slate-100 dark:bg-slate-800">
                    <TabsTrigger value="achievements" className="text-base font-semibold">Achievements</TabsTrigger>
                    <TabsTrigger value="activity" className="text-base font-semibold">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="achievements" className="mt-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
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

                <TabsContent value="activity" className="mt-8">
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900">
                        <CardHeader className="border-b pb-4">
                            <CardTitle className="text-xl">Recent Quiz Results</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {recentResults.length > 0 ? (
                                <div className="space-y-4">
                                    {(recentResults || []).slice(0, 5).map((result: any, index: number) => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 transition-all cursor-pointer group"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-semibold text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Quiz #{result.quizId}</p>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {new Date(result.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="font-black text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{result.score}%</p>
                                                <p className="text-xs text-muted-foreground font-semibold">
                                                    <span className="text-green-600 dark:text-green-400">+{result.pointsEarned ?? (result.correctAnswers ? result.correctAnswers * 2 : 0)}</span> pts
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                        <BookOpen className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No quiz results yet.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Start taking quizzes to see your activity!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
