import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  flipOnHover?: boolean;
  flipOnClick?: boolean;
  autoFlip?: boolean;
  autoFlipDuration?: number;
  flippedInitially?: boolean;
}

export function FlipCard({
  front,
  back,
  className,
  flipOnHover = true,
  flipOnClick = true,
  autoFlip = false,
  autoFlipDuration = 5000,
  flippedInitially = false,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(flippedInitially);

  // Handle auto flip if enabled
  React.useEffect(() => {
    if (!autoFlip) return;
    
    const interval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, autoFlipDuration);
    
    return () => clearInterval(interval);
  }, [autoFlip, autoFlipDuration]);

  const handleClick = () => {
    if (flipOnClick) {
      setIsFlipped((prev) => !prev);
    }
  };

  const handleHover = () => {
    if (flipOnHover) {
      setIsFlipped(true);
    }
  };

  const handleHoverEnd = () => {
    if (flipOnHover) {
      setIsFlipped(false);
    }
  };

  return (
    <div
      className={cn(
        "perspective-1000 relative h-full w-full cursor-pointer transition-all duration-500",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverEnd}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative h-full w-full transform-style-3d transition-all duration-500"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-lg",
            isFlipped ? "pointer-events-none" : "pointer-events-auto"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-lg",
            isFlipped ? "pointer-events-auto" : "pointer-events-none"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
} 