import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ThreeCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-lg",
        "transform-gpu perspective-1000",
        className
      )}
      whileHover={{
        rotateX: 5,
        rotateY: 5,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
      {...props}
    />
  );
});
ThreeCard.displayName = "ThreeCard";

export { ThreeCard as Card };
