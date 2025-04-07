import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  color?: string;
  backgroundColor?: string;
  labelSize?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function ProgressCircle({
  value,
  size = 100,
  strokeWidth = 10,
  className,
  showValue = true,
  valuePrefix = "",
  valueSuffix = "%",
  color = "stroke-primary",
  backgroundColor = "stroke-primary/20",
  labelSize = "md",
  animated = true,
}: ProgressCircleProps) {
  // Normalize value between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  // Calculate circle properties
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * normalizedValue) / 100;
  
  // Define label size classes
  const labelSizeClasses = {
    sm: "text-lg font-medium",
    md: "text-2xl font-bold",
    lg: "text-3xl font-bold",
  };

  // Animation variants
  const circleVariants = {
    hidden: { strokeDashoffset: circumference },
    visible: { 
      strokeDashoffset: circumference - dash,
      transition: { 
        duration: 1.5, 
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          className={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={animated ? "hidden" : "visible"}
          animate="visible"
          variants={animated ? circleVariants : undefined}
          strokeLinecap="round"
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={labelSizeClasses[labelSize]}>
            {valuePrefix}
            {Math.round(normalizedValue)}
            {valueSuffix}
          </span>
        </div>
      )}
    </div>
  );
} 