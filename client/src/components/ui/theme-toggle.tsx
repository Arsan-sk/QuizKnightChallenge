import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-full h-9 w-9"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={{ opacity: 0, rotate: -45 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: 45 }}
        transition={{ duration: 0.2 }}
        key={theme}
        className="absolute inset-0 flex items-center justify-center"
      >
        {theme === 'light' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </motion.div>
    </Button>
  );
} 