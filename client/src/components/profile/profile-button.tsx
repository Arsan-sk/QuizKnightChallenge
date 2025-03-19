import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface ProfileButtonProps {
  onClick: () => void;
}

export function ProfileButton({ onClick }: ProfileButtonProps) {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get first letters of first and last name, or username if name is not available
  const getInitials = () => {
    if (!user.username) return "U";
    return user.username.charAt(0).toUpperCase();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        variant="ghost" 
        className="flex items-center gap-2 px-2 hover:bg-accent" 
        onClick={onClick}
      >
        <Avatar className="h-8 w-8 border border-primary/10">
          <AvatarImage src={user.profilePicture} alt={user.username || "User"} />
          <AvatarFallback className="text-xs bg-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium hidden md:inline-block">
          {user.username}
        </span>
      </Button>
    </motion.div>
  );
} 