import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface ProfileStatsProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    suffix?: string;
    gradient?: string;
    delay?: number;
}

export function ProfileStats({
    title,
    value,
    icon: Icon,
    description,
    trend,
    suffix = "",
    gradient = "from-blue-500 to-purple-500",
    delay = 0
}: ProfileStatsProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof value === "number" ? value : 0;

    // Count-up animation for numeric values
    useEffect(() => {
        if (typeof value === "number") {
            const duration = 1000; // 1 second
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="h-full"
        >
            <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                        <Icon className="h-4 w-4 text-white" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        <motion.div
                            className="text-3xl font-bold"
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: delay + 0.2, type: "spring" }}
                        >
                            {typeof value === "number" ? displayValue : value}
                            {suffix && <span className="text-xl ml-1">{suffix}</span>}
                        </motion.div>

                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}

                        {trend && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: delay + 0.4 }}
                                className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                <span>{trend.isPositive ? "↑" : "↓"}</span>
                                <span>{Math.abs(trend.value)}%</span>
                                <span className="text-muted-foreground">vs last week</span>
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
