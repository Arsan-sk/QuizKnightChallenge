import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trophy, Star, Award, Target, Zap, Crown, Medal, Shield } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
    name: string;
    description?: string;
    icon?: string;
    unlocked?: boolean;
    progress?: number;
    earnedAt?: Date;
    index?: number;
}

const iconMap: Record<string, LucideIcon> = {
    trophy: Trophy,
    star: Star,
    award: Award,
    target: Target,
    zap: Zap,
    crown: Crown,
    medal: Medal,
    shield: Shield,
};

export function AchievementBadge({
    name,
    description,
    icon = "trophy",
    unlocked = false,
    progress = 0,
    earnedAt,
    index = 0,
}: AchievementBadgeProps) {
    const Icon = iconMap[icon.toLowerCase()] || Trophy;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, type: "spring" }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        className="relative"
                    >
                        <Card
                            className={`p-6 flex flex-col items-center justify-center space-y-3 transition-all duration-300 ${unlocked
                                    ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-400 shadow-lg"
                                    : "bg-muted/50 border-dashed opacity-60"
                                }`}
                        >
                            {/* Icon */}
                            <div
                                className={`relative p-4 rounded-full ${unlocked
                                        ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                                        : "bg-muted"
                                    }`}
                            >
                                <Icon
                                    className={`h-8 w-8 ${unlocked ? "text-white" : "text-muted-foreground"
                                        }`}
                                />

                                {/* Shimmer effect for unlocked badges */}
                                {unlocked && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                        animate={{
                                            x: ["-100%", "100%"],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 3,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Name */}
                            <p
                                className={`text-sm font-semibold text-center ${unlocked ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                {name}
                            </p>

                            {/* Progress bar for locked badges */}
                            {!unlocked && progress > 0 && (
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, delay: index * 0.05 }}
                                    />
                                </div>
                            )}

                            {/* Sparkle effect for newly unlocked */}
                            {unlocked && earnedAt && (
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", delay: index * 0.05 + 0.3 }}
                                >
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-semibold">{name}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                        {unlocked && earnedAt && (
                            <p className="text-xs text-muted-foreground">
                                Earned on {new Date(earnedAt).toLocaleDateString()}
                            </p>
                        )}
                        {!unlocked && progress > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Progress: {progress}%
                            </p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
