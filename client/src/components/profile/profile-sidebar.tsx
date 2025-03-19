import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  User, 
  Settings, 
  History, 
  Trophy, 
  Medal, 
  LogOut,
  Edit
} from "lucide-react";

interface ProfileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSidebar({ open, onOpenChange }: ProfileSidebarProps) {
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;
  
  const getInitials = () => {
    if (!user.username) return "U";
    return user.username.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    onOpenChange(false);
  };

  const menuItems = [
    {
      icon: <User size={18} />,
      label: "Profile",
      href: `/profile`,
    },
    {
      icon: <Trophy size={18} />,
      label: "Achievements",
      href: `/achievements`,
    },
    {
      icon: <Medal size={18} />,
      label: "Leaderboard",
      href: `/leaderboard`,
    },
    {
      icon: <History size={18} />,
      label: "History",
      href: `/history`,
    },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      href: `/settings`,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 sm:w-96 overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col items-center py-6">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary/10">
            <AvatarImage 
              src={user.profilePicture} 
              alt={user.username || "User"} 
            />
            <AvatarFallback className="text-2xl bg-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-4"
          >
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">
                <Edit size={14} className="mr-1" />
                Edit Profile
              </Link>
            </Button>
          </motion.div>
        </div>
        
        <Separator className="my-4" />
        
        <nav className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ x: 5 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <span className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </span>
                </Link>
              </Button>
            </motion.div>
          ))}
          
          <Separator className="my-4" />
          
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ x: 5 }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut size={18} />
              <span className="ml-2">Logout</span>
            </Button>
          </motion.div>
        </nav>
      </SheetContent>
    </Sheet>
  );
} 