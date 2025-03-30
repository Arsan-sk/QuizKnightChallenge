import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Medal, Trophy, Users, Star, Award, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interface for leaderboard user data
interface LeaderboardUser {
  id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  role: string;
  points: number;
  totalScore: number;
  rank?: number; // We'll calculate this on the client
}

interface LeaderboardWidgetProps {
  limit?: number;
  className?: string;
  autoRefresh?: boolean;
  onlyStudents?: boolean;
  visualStyle?: "standard" | "comparative";
}

export function LeaderboardWidget({
  limit = 10,
  className,
  autoRefresh = false,
  onlyStudents = true,
  visualStyle = "standard"
}: LeaderboardWidgetProps) {
  const { user } = useAuth();
  const [prevData, setPrevData] = useState<LeaderboardUser[]>([]);
  const [flashingItem, setFlashingItem] = useState<string | null>(null);
  const dataRef = useRef<LeaderboardUser[]>([]);

  const { data, isLoading, error, refetch } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if autoRefresh is enabled
  });

  // Compare previous and current data to determine rank changes
  const calculateRankChanges = () => {
    if (!data) return [];
    
    // Filter students only if onlyStudents is true
    let filteredData = onlyStudents 
      ? data.filter(user => user.role === "student") 
      : data;
    
    // Limit the number of users
    filteredData = filteredData.slice(0, limit);
    
    // Find the maximum score for comparative visualization
    const maxScore = filteredData.length > 0 
      ? Math.max(...filteredData.map(user => user.points))
      : 0;
    
    return filteredData.map((user, index) => {
      const prevIndex = prevData.findIndex(p => p.id === user.id);
      const rankChange = prevIndex === -1 ? 0 : prevIndex - index;
      const isNew = prevIndex === -1;
      
      // Calculate percentage of max score for comparative bar
      const scorePercentage = maxScore > 0 ? (user.points / maxScore) * 100 : 0;
      
      return {
        ...user,
        rankChange,
        isNew,
        rank: index + 1,
        scorePercentage
      };
    });
  };

  const usersWithRankChanges = calculateRankChanges();

  // Update previous data when new data is received
  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(dataRef.current)) {
      setPrevData(dataRef.current);
      dataRef.current = data;
      
      // Find changed items to flash
      if (prevData.length > 0) {
        const changedItems = data.filter(user => {
          const prevUser = prevData.find(p => p.id === user.id);
          return prevUser && prevUser.points !== user.points;
        });
        
        if (changedItems.length > 0) {
          setFlashingItem(changedItems[0].id);
          setTimeout(() => setFlashingItem(null), 2000);
        }
      }
    }
  }, [data]);

  // Render different rank badges based on position
  const renderRankBadge = (rank: number, rankChange: number) => {
    let rankElement;
    
    if (rank === 1) {
      rankElement = (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 0 }}
          className="relative flex items-center justify-center"
        >
          <Crown className="h-5 w-5 text-yellow-500" />
        </motion.div>
      );
    } else if (rank === 2) {
      rankElement = (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative flex items-center justify-center"
        >
          <Award className="h-5 w-5 text-gray-400" />
        </motion.div>
      );
    } else if (rank === 3) {
      rankElement = (
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative flex items-center justify-center"
        >
          <Medal className="h-5 w-5 text-amber-700" />
        </motion.div>
      );
    } else {
      rankElement = (
        <div className="relative flex items-center justify-center w-5 h-5">
          <span className="text-sm font-semibold">{rank}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        {rankElement}
        
        {rankChange !== 0 && (
          <motion.div 
            initial={{ opacity: 0, y: rankChange > 0 ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-1"
          >
            <Badge variant={rankChange > 0 ? "success" : "destructive"} className="text-xs px-1 py-0">
              {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
            </Badge>
          </motion.div>
        )}
      </div>
    );
  };

  // Get initials from name or username
  const getInitials = (displayName?: string, username?: string) => {
    if (displayName) {
      return displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return username?.substring(0, 2).toUpperCase() || "??";
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top performers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load leaderboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top {onlyStudents ? "students" : "performers"}</CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {usersWithRankChanges.map((user: any) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center p-2 rounded-md relative overflow-hidden",
                  flashingItem === user.id && "flash-animation",
                  user.rank <= 3 ? "bg-accent/20" : "hover:bg-accent/10"
                )}
              >
                {visualStyle === "comparative" && (
                  <div 
                    className="absolute left-0 top-0 h-full bg-accent/10 z-0" 
                    style={{ width: `${user.scorePercentage}%` }} 
                  />
                )}
                
                <div className="flex items-center gap-3 z-10 w-full">
                  <div className="flex-shrink-0 w-8">
                    {renderRankBadge(user.rank, user.rankChange)}
                  </div>
                  
                  <Avatar className="flex-shrink-0 h-8 w-8 bg-primary/10">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name, user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-grow justify-between items-center">
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {user.username}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold">{user.points}</span>
                      <Star className="h-3 w-3 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </CardContent>
      <style jsx global>{`
        @keyframes flash {
          0% { background-color: rgba(var(--accent), 0.1); }
          50% { background-color: rgba(var(--accent), 0.3); }
          100% { background-color: rgba(var(--accent), 0.1); }
        }
        
        .flash-animation {
          animation: flash 2s ease-in-out;
        }
      `}</style>
    </Card>
  );
} 