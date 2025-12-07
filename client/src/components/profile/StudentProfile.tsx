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
    // Fetch student-specific stats
    const { data: results = [] } = useQuery({
        queryKey: ["/api/results/user"],
    });

    // Calculate stats
    const quizzesCompleted = results.length;
    const totalPoints = profile.points || 0;
    const averageScore =
        results.length > 0
            ? Math.round(
                results.reduce((acc: number, r: any) => acc + r.score, 0) /
                results.length
            )
            : 0;

    // Mock data for demonstration (replace with real data)
    const currentStreak = 5;
    const rank = 12;
    const level = Math.floor(totalPoints / 100) + 1;
    const levelProgress = (totalPoints % 100);

    // Mock achievements (replace with real achievement data)
    const achievements = [
        {
            name: "First Steps",
            description: "Complete your first quiz",
            icon: "trophy",
            unlocked: quizzesCompleted > 0,
            progress: quizzesCompleted > 0 ? 100 : 0,
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
            unlocked: results.some((r: any) => r.score === 100),
            progress: results.some((r: any) => r.score === 100) ? 100 : 0,
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
            unlocked: rank <= 10,
            progress: rank <= 10 ? 100 : Math.max(100 - rank * 5, 0),
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Level Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <ProgressRing
                                progress={levelProgress}
                                size={140}
                                strokeWidth={12}
                                color="#3b82f6"
                                label={`Level ${level}`}
                            />
                            <p className="text-sm text-muted-foreground">
                                {100 - levelProgress} points to Level {level + 1}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Leaderboard Rank
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <div className="text-center">
                                <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    #{rank}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Quiz Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {results.length > 0 ? (
                                <div className="space-y-3">
                                    {results.slice(0, 5).map((result: any, index: number) => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium">Quiz #{result.quizId}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(result.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{result.score}%</p>
                                                <p className="text-xs text-muted-foreground">
                                                    +{result.pointsEarned || result.correctAnswers * 2} pts
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    No quiz results yet. Start taking quizzes to see your activity!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
