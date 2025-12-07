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
    // Fetch teacher-specific stats
    const { data: quizzes = [] } = useQuery({
        queryKey: ["/api/quizzes/teacher"],
    });

    // Calculate stats
    const totalQuizzes = quizzes.length;
    const activeQuizzes = quizzes.filter((q: any) => q.isActive).length;
    const totalQuestions = quizzes.reduce(
        (acc: number, q: any) => acc + (q.questionCount || 0),
        0
    );

    // Mock data (replace with real data from analytics)
    const studentsReached = 156;
    const averageRating = 4.7;
    const totalAttempts = 423;

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
                    title="Active Quizzes"
                    value={activeQuizzes}
                    icon={Activity}
                    description="Currently live"
                    gradient="from-green-500 to-emerald-500"
                    delay={0.1}
                />
                <ProfileStats
                    title="Students Reached"
                    value={studentsReached}
                    icon={Users}
                    description="Unique participants"
                    gradient="from-purple-500 to-pink-500"
                    delay={0.2}
                />
                <ProfileStats
                    title="Total Questions"
                    value={totalQuestions}
                    icon={FileText}
                    description="Questions created"
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Engagement Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Total Attempts
                                </span>
                                <span className="text-2xl font-bold">{totalAttempts}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Avg. Attempts/Quiz
                                </span>
                                <span className="text-2xl font-bold">
                                    {totalQuizzes > 0
                                        ? Math.round(totalAttempts / totalQuizzes)
                                        : 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Average Rating
                                </span>
                                <span className="text-2xl font-bold flex items-center gap-1">
                                    {averageRating}
                                    <span className="text-yellow-500">★</span>
                                </span>
                            </div>
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
                                <BarChart3 className="h-5 w-5" />
                                Class Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Average Score</span>
                                    <span className="font-semibold">73%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "73%" }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Completion Rate</span>
                                    <span className="font-semibold">89%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "89%" }}
                                        transition={{ duration: 1, delay: 0.7 }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Tabs for Quizzes and Analytics */}
            <Tabs defaultValue="quizzes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quizzes">Recent Quizzes</TabsTrigger>
                    <TabsTrigger value="popular">Popular Topics</TabsTrigger>
                </TabsList>

                <TabsContent value="quizzes" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recently Created Quizzes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {quizzes.length > 0 ? (
                                <div className="space-y-3">
                                    {quizzes.slice(0, 5).map((quiz: any, index: number) => (
                                        <motion.div
                                            key={quiz.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{quiz.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(quiz.createdAt).toLocaleDateString()} •{" "}
                                                    {quiz.difficulty}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">
                                                    {quiz.isActive ? (
                                                        <span className="text-green-600">Active</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Draft</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {quiz.questionCount || 0} questions
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">
                                    No quizzes created yet. Create your first quiz to get started!
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="popular" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Popular Quiz Topics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
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
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{item.topic}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {item.attempts} attempts
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-muted rounded-full h-2">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.avgScore}%` }}
                                                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold w-12 text-right">
                                                {item.avgScore}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
