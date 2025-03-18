import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionTransitionProps {
  children: ReactNode;
  id: string | number;
  direction?: "left" | "right"; // Direction of travel
}

export function QuestionTransition({
  children,
  id,
  direction = "right",
}: QuestionTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ 
          opacity: 0, 
          x: direction === "right" ? 50 : -50 
        }}
        animate={{ 
          opacity: 1, 
          x: 0 
        }}
        exit={{ 
          opacity: 0, 
          x: direction === "right" ? -50 : 50 
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 