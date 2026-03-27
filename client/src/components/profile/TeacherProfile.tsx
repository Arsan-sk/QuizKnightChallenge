import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileStats } from "./ProfileStats";
import {
    BookOpen,
    Users,
    TrendingUp,
    Activity,
    FileText,
    BarChart3,
} from "lucide-react";
import { User } from "@shared/schema";

interface TeacherProfileProps {
    profile: User;
}

export function TeacherProfile({ profile }: TeacherProfileProps) {
    // Fetch teacher-specific stats from server
    const { data: stats, isLoading } = useQuery({
        queryKey: [`/api/users/${profile.id}/stats`],
        enabled: !!profile.id,
    });

    const totalQuizzes = stats?.totalQuizzes ?? 0;
    const studentsReached = stats?.studentsReached ?? 0;
    const totalAttempts = stats?.totalAttempts ?? 0;
    const averageScore = stats?.averageScore ?? 0;
    const completionRate = stats?.completionRate ?? 0;
    const recentQuizzes = stats?.recentQuizzes ?? [];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfileStats
                    title="Quizzes Created"
                    value={totalQuizzes}
                    icon={BookOpen}
                    description="Total published"
                    gradient="from-blue-500 to-cyan-500"
                    delay={0}
                />
                <ProfileStats
                    title="Students Reached"
                    value={studentsReached}
                    icon={Users}
                    description="Unique participants"
                    gradient="from-purple-500 to-pink-500"
                    delay={0.1}
                />
                <ProfileStats
                    title="Total Attempts"
                    value={totalAttempts}
                    icon={Activity}
                    description="All quiz attempts"
                    gradient="from-green-500 to-emerald-500"
                    delay={0.2}
                />
                <ProfileStats
                    title="Avg. Student Score"
                    value={averageScore}
                    suffix="%"
                    icon={TrendingUp}
                    description="Average across students"
                    gradient="from-orange-500 to-red-500"
                    delay={0.3}
                />
            </div>

            {/* Performance Overview */}
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
                                Engagement Metrics
                            </h3>
                        </div>
                        <div className="flex flex-col space-y-4 flex-1 justify-center">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Attempts</span>
                                <span className="text-xl font-bold font-mono text-[hsl(var(--foreground))]">{totalAttempts}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Avg. Attempts / Quiz</span>
                                <span className="text-xl font-bold font-mono text-blue-500">{totalQuizzes > 0 ? Math.round(totalAttempts / totalQuizzes) : 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Average Student Score</span>
                                <span className="text-xl font-bold font-mono text-green-500">{averageScore}%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
                                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Completion Rate</span>
                                <span className="text-xl font-bold font-mono text-purple-500">{completionRate}%</span>
                            </div>
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
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                                Class Performance
                            </h3>
                        </div>
                        <div className="flex flex-col space-y-6 flex-1 justify-center">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-[hsl(var(--muted-foreground))]">Average Score</span>
                                    <span className="font-bold text-lg text-[hsl(var(--foreground))] block bg-[hsl(var(--muted)/0.15)] px-3 py-1 rounded-md">73%</span>
                                </div>
                                <div className="w-full bg-[hsl(var(--muted)/0.2)] rounded-full h-3 overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "73%" }}
                                        transition={{ duration: 1, delay: 0.6, type: "spring" }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-[hsl(var(--muted-foreground))]">Completion Rate</span>
                                    <span className="font-bold text-lg text-[hsl(var(--foreground))] block bg-[hsl(var(--muted)/0.15)] px-3 py-1 rounded-md">89%</span>
                                </div>
                                <div className="w-full bg-[hsl(var(--muted)/0.2)] rounded-full h-3 overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "89%" }}
                                        transition={{ duration: 1, delay: 0.7, type: "spring" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs for Quizzes and Analytics */}
            <Tabs defaultValue="quizzes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quizzes">Recent Quizzes</TabsTrigger>
                    <TabsTrigger value="popular">Popular Topics</TabsTrigger>
                </TabsList>

                <TabsContent value="quizzes" className="mt-6">
                    <div className="clay-card p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recently Created Quizzes</h3>
                        </div>
                        <div>
                            {(recentQuizzes || []).length > 0 ? (
                                <div className="space-y-3">
                                    {(recentQuizzes || []).slice(0, 5).map((quiz: any, index: number) => (
                                        <motion.div
                                            key={quiz.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group cursor-default shadow-sm hover:shadow"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-bold group-hover:scale-110 transition-transform">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[hsl(var(--foreground))]">{quiz.title}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium flex items-center gap-1.5 mt-0.5">
                                                        {new Date(quiz.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} •{" "}
                                                        <span className={`capitalize ${quiz.difficulty === 'Easy' ? 'text-green-500' : quiz.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>{quiz.difficulty}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wider">Status</p>
                                                    <p className="text-sm font-black">
                                                        {quiz.isActive ? (
                                                            <span className="text-[#10b981] flex items-center gap-1 justify-end"><span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"/> Active</span>
                                                        ) : (
                                                            <span className="text-[hsl(var(--muted-foreground))]">Draft</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-[hsl(var(--muted)/0.1)] border border-[hsl(var(--border))] text-right min-w-[70px]">
                                                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wider text-center">Questions</p>
                                                    <p className="text-sm font-black text-[hsl(var(--foreground))] text-center">
                                                        {quiz.questionCount || 0}
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
                                        No quizzes created yet
                                    </p>
                                    <p className="text-sm text-[hsl(var(--text-2))]">
                                        Create your first quiz to see your activity!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="popular" className="mt-6">
                    <div className="clay-card p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Most Popular Quiz Topics</h3>
                        </div>
                        <div>
                            <div className="space-y-6">
                                {[
                                    { topic: "Data Structures", attempts: 87, avgScore: 76 },
                                    { topic: "Algorithms", attempts: 65, avgScore: 71 },
                                    { topic: "Web Development", attempts: 54, avgScore: 82 },
                                    { topic: "Database Systems", attempts: 43, avgScore: 68 },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.topic}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-[hsl(var(--foreground))]">{item.topic}</span>
                                            <span className="text-xs uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wider">
                                                {item.attempts} attempts
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-[hsl(var(--muted)/0.2)] rounded-full h-3 overflow-hidden shadow-inner">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[#ec4899] rounded-full relative"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.avgScore}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 + 0.3, type: "spring" }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full" style={{ maskImage: "linear-gradient(90deg, transparent, white)" }} />
                                                </motion.div>
                                            </div>
                                            <span className="text-sm font-bold w-12 text-right">
                                                {item.avgScore}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
