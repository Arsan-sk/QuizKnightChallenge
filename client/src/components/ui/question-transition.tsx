import { motion } from "framer-motion";
import { ReactNode } from "react";

type QuestionTransitionProps = {
  children: ReactNode;
  id: number | string;
  direction: "left" | "right";
};

export function QuestionTransition({
  children,
  id,
  direction,
}: QuestionTransitionProps) {
  return (
    <>
      <motion.div
        key={id}
        initial={{
          opacity: 0,
          x: direction === "right" ? 50 : -50,
          scale: 0.98
        }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1
        }}
        exit={{
          opacity: 0,
          x: direction === "right" ? -50 : 50,
          scale: 0.98
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          opacity: { duration: 0.2 },
          scale: { duration: 0.3 }
        }}
        className="w-full origin-center"
      >
        {children}
      </motion.div>
    </>
  );
} 