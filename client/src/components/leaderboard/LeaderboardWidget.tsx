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
  
  // Split users into top 3 and rest
  const topThreeUsers = usersWithRankChanges.slice(0, 3);
  const remainingUsers = usersWithRankChanges.slice(3);

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

  // Render 3D trophy based on position
  const renderTrophy = (rank: number) => {
    const trophyColorClass = rank === 1 
      ? "text-yellow-500" 
      : rank === 2 
        ? "text-gray-400" 
        : "text-amber-700";
    
    const trophyIcon = rank === 1 
      ? <Crown className="h-6 w-6" /> 
      : rank === 2 
        ? <Award className="h-6 w-6" /> 
        : <Medal className="h-6 w-6" />;
    
    return (
      <motion.div
        className={`absolute -top-4 ${rank === 1 ? 'left-1/2 -translate-x-1/2' : rank === 2 ? 'left-3' : 'right-3'}`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          rotateY: [0, 10, -10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 1.5, 
          delay: rank * 0.2,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 5
        }}
      >
        <div className={`transform-style-3d shadow-xl rounded-full flex items-center justify-center p-2 ${rank === 1 ? 'bg-yellow-100' : rank === 2 ? 'bg-gray-100' : 'bg-amber-100'}`}>
          <div className={trophyColorClass}>
            {trophyIcon}
          </div>
        </div>
      </motion.div>
    );
  };

  // Render rank badge for remaining users
  const renderRankBadge = (rank: number, rankChange: number) => {
    return (
      <div className="flex items-center">
        <div className="relative flex items-center justify-center w-5 h-5">
          <span className="text-sm font-semibold">{rank}</span>
        </div>
        
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

  // No data
  if (!usersWithRankChanges.length) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No leaderboard data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top {onlyStudents ? "students" : "performers"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        {/* Top 3 Users section - displayed in parallel */}
        <div className="pb-4 px-6 relative">
          <div className="flex justify-center items-end gap-2 md:gap-4 h-40 mb-2">
            {topThreeUsers.map((user, idx) => {
              const rank = user.rank;
              
              // Calculate height ratios based on position
              const heightPercent = rank === 1 ? '100%' : rank === 2 ? '85%' : '70%';
              const zIndex = rank === 1 ? 'z-30' : rank === 2 ? 'z-20' : 'z-10';
              
              // Position column based on rank
              const positionClass = rank === 1 
                ? 'order-2' 
                : rank === 2 
                  ? 'order-1' 
                  : 'order-3';
              
              // Background color based on rank
              const bgClass = rank === 1 
                ? 'bg-gradient-to-t from-yellow-100/80 to-yellow-50/50 border-yellow-300' 
                : rank === 2 
                  ? 'bg-gradient-to-t from-gray-100/80 to-gray-50/50 border-gray-300' 
                  : 'bg-gradient-to-t from-amber-100/80 to-amber-50/50 border-amber-300';
              
              return (
                <motion.div 
                  key={user.id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.1 * rank,
                    type: "spring",
                    stiffness: 100
                  }}
                  className={`${positionClass} ${zIndex} relative flex flex-col items-center rounded-t-xl transform transition-all duration-300 hover:scale-105 cursor-pointer w-1/3 border-t-4 ${bgClass}`}
                  style={{ height: heightPercent }}
                >
                  {renderTrophy(rank)}
                  
                  <motion.div 
                    className="flex flex-col items-center justify-end h-full"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className={`relative rounded-full p-1 border-2 ${
                        rank === 1 ? 'border-yellow-500' : 
                        rank === 2 ? 'border-gray-400' : 'border-amber-600'
                      }`}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Avatar className={`w-12 h-12 md:w-16 md:h-16 ${
                        rank === 1 ? 'ring-2 ring-yellow-300 ring-offset-2' : ''
                      }`}>
                        <AvatarImage src={user.profilePicture} />
                        <AvatarFallback className="text-lg bg-primary/10">
                          {getInitials(user.name, user.username)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {rank}
                      </div>
                    </motion.div>
                    
                    <div className="flex flex-col items-center mt-2 px-1">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="font-semibold text-sm md:text-base truncate w-full text-center"
                      >
                        {user.username}
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center gap-1 mt-1"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + (0.1 * rank) }}
                      >
                        <span className="text-sm md:text-base font-bold">{user.points}</span>
                        <Star className="h-3 w-3 text-yellow-500" />
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Remaining users - scrollable list */}
        <div className="max-h-[250px] overflow-y-auto leaderboard-scroll px-6 pb-4">
          <AnimatePresence initial={false}>
            <div className="space-y-2">
              {remainingUsers.map((user: any) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-center p-3 rounded-md relative overflow-hidden shadow-sm border border-transparent",
                    flashingItem === user.id && "flash-animation",
                    "hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                  )}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
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
                      <AvatarImage src={user.profilePicture} />
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
        </div>
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
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .leaderboard-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(var(--accent), 0.2) transparent;
        }
        
        .leaderboard-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .leaderboard-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .leaderboard-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(var(--accent), 0.2);
          border-radius: 20px;
        }
      `}</style>
    </Card>
  );
} 