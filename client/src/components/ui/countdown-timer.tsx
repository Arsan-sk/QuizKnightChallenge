import { useEffect, useState } from "react";
import { cn, formatTimeTaken } from "@/lib/utils";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  className?: string;
}

export function CountdownTimer({
  duration,
  onTimeUp,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  // Determine color based on time left
  const getColorClass = () => {
    const percentLeft = (timeLeft / duration) * 100;
    if (percentLeft > 50) return "text-green-600 dark:text-green-400";
    if (percentLeft > 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeUp]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        key={timeLeft}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "font-mono text-xl font-bold",
          getColorClass()
        )}
      >
        {formatTimeTaken(timeLeft)}
      </motion.div>
      
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <motion.path
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
          initial={{ pathLength: 1 }}
          animate={{ pathLength: timeLeft / duration }}
          transition={{ duration: 0.5, ease: "linear" }}
          className={getColorClass()}
        />
      </svg>
    </div>
  );
} 