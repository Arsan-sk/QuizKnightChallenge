import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Crown, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
    id: number;
    username: string;
    points: number;
    quizzesTaken: number;
    badges: string[];
    rank?: number;
    rankChange?: number;
    role?: string;
}

interface LeaderboardWidgetProps {
    limit?: number;
    onlyStudents?: boolean;
    visualStyle?: "compact" | "podium" | "full";
    fullPage?: boolean;
}

export function LeaderboardWidget({
    limit = 10,
    onlyStudents = false,
    visualStyle = "full",
    fullPage = false
}: LeaderboardWidgetProps) {
    const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
        queryKey: ["/api/leaderboard", limit],
    });

    // Filter students only if requested
    const filteredLeaderboard = onlyStudents
        ? leaderboard.filter(entry => entry.role === "student")
        : leaderboard;

    // Sort by points descending
    const sortedLeaderboard = [...filteredLeaderboard].sort((a, b) => b.points - a.points);

    // Assign ranks
    const rankedLeaderboard = sortedLeaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
    }));

    const top3 = rankedLeaderboard.slice(0, 3);
    const rest = rankedLeaderboard.slice(3, limit);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return null;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "from-yellow-400 via-yellow-500 to-yellow-600";
            case 2:
                return "from-gray-300 via-gray-400 to-gray-500";
            case 3:
                return "from-amber-500 via-amber-600 to-amber-700";
            default:
                return "from-blue-400 via-blue-500 to-blue-600";
        }
    };

    const getPodiumHeight = (rank: number) => {
        switch (rank) {
            case 1:
                return "h-48";
            case 2:
                return "h-36";
            case 3:
                return "h-28";
            default:
                return "h-20";
        }
    };

    const getRankChangeIcon = (change?: number) => {
        if (!change || change === 0) return <Minus className="h-3 w-3 text-muted-foreground" />;
        if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
        return <TrendingDown className="h-3 w-3 text-red-500" />;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-24 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (visualStyle === "podium" || fullPage) {
        // Reorder for podium display: 2nd, 1st, 3rd
        const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

        return (
            <Card className={cn("overflow-hidden", fullPage && "border-0 shadow-none")}>
                <CardHeader className={cn(fullPage && "pb-8")}>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Top Students
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Podium Display */}
                    <div className="relative">
                        <div className="flex items-end justify-center gap-4 mb-8">
                            {podiumOrder.map((entry, displayIndex) => {
                                if (!entry) return null;
                                const actualRank = entry.rank!;
                                const isFirst = actualRank === 1;

                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: displayIndex * 0.2, type: "spring" }}
                                        className={cn(
                                            "relative flex flex-col items-center",
                                            isFirst ? "order-2" : displayIndex === 0 ? "order-1" : "order-3"
                                        )}
                                    >
                                        {/* Trophy/Medal Icon */}
                                        <motion.div
                                            animate={isFirst ? {
                                                rotate: [0, -10, 10, -10, 0],
                                                scale: [1, 1.1, 1],
                                            } : {}}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatDelay: 3,
                                            }}
                                            className="mb-2"
                                        >
                                            {getRankIcon(actualRank)}
                                        </motion.div>

                                        {/* Avatar */}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className={cn(
                                                "relative mb-4",
                                                isFirst && "ring-4 ring-yellow-400 ring-offset-2 rounded-full"
                                            )}
                                        >
                                            <Avatar className={cn(isFirst ? "h-24 w-24" : "h-20 w-20")}>
                                                <AvatarFallback className={cn(
                                                    "text-2xl font-bold text-white bg-gradient-to-br",
                                                    getRankColor(actualRank)
                                                )}>
                                                    {entry.username.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isFirst && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                    className="absolute -top-2 -right-2"
                                                >
                                                    <Sparkles className="h-6 w-6 text-yellow-500" />
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* User Info */}
                                        <div className="text-center mb-4 px-2">
                                            <p className={cn(
                                                "font-bold truncate max-w-[120px]",
                                                isFirst ? "text-lg" : "text-base"
                                            )}>
                                                {entry.username}
                                            </p>
                                            <p className="text-2xl font-bold text-primary">
                                                {entry.points}
                                            </p>
                                            <p className="text-xs text-muted-foreground">points</p>
                                        </div>

                                        {/* Podium */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            transition={{ delay: displayIndex * 0.2 + 0.3, type: "spring" }}
                                            className={cn(
                                                "w-32 rounded-t-lg bg-gradient-to-br flex items-center justify-center",
                                                getPodiumHeight(actualRank),
                                                getRankColor(actualRank)
                                            )}
                                        >
                                            <span className="text-4xl font-bold text-white opacity-30">
                                                {actualRank}
                                            </span>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rest of the list */}
                    {rest.length > 0 && (
                        <div className={cn(
                            "space-y-2",
                            fullPage ? "max-h-[400px] overflow-y-auto pr-2" : "max-h-[300px] overflow-y-auto pr-2"
                        )}>
                            <AnimatePresence>
                                {rest.map((entry, index) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.02)" }}
                                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all"
                                    >
                                        {/* Rank */}
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                                            {entry.rank}
                                        </div>

                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                                {entry.username.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{entry.username}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {entry.quizzesTaken} quizzes taken
                                            </p>
                                        </div>

                                        {/* Points */}
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-primary">{entry.points}</p>
                                            <p className="text-xs text-muted-foreground">points</p>
                                        </div>

                                        {/* Rank Change */}
                                        <div className="flex items-center gap-1">
                                            {getRankChangeIcon(entry.rankChange)}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Compact/Full list view
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <AnimatePresence>
                        {rankedLeaderboard.slice(0, limit).map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-lg transition-all",
                                    entry.rank! <= 3 ? "bg-gradient-to-r" : "bg-muted/50",
                                    entry.rank === 1 && "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900",
                                    entry.rank === 2 && "from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900",
                                    entry.rank === 3 && "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900"
                                )}
                            >
                                {/* Rank */}
                                <div className="flex items-center gap-2">
                                    {entry.rank! <= 3 ? (
                                        getRankIcon(entry.rank!)
                                    ) : (
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold text-sm">
                                            {entry.rank}
                                        </div>
                                    )}
                                </div>

                                {/* Avatar */}
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className={cn(
                                        "text-white bg-gradient-to-br",
                                        entry.rank! <= 3 ? getRankColor(entry.rank!) : "from-blue-400 to-blue-600"
                                    )}>
                                        {entry.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{entry.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.quizzesTaken} quizzes
                                    </p>
                                </div>

                                {/* Points */}
                                <div className="text-right">
                                    <p className="font-bold text-lg">{entry.points}</p>
                                    <p className="text-xs text-muted-foreground">pts</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}
