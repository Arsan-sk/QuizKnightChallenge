import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Award, 
  BadgeCheck, 
  BookOpen, 
  Calendar, 
  Gift, 
  Lock, 
  Bookmark,
  Star, 
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Define Achievement interface
interface Achievement {
  id: number;
  name: string;
  description: string;
  category: "quiz" | "streak" | "social" | "special";
  iconUrl: string;
  criteria: string;
  earnedAt: string | null;
  progress: number;
  requirement: number;
  reward: string;
}

export default function AchievementsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Fetch achievements
  const {
    data: achievements,
    isLoading: achievementsLoading,
    error: achievementsError,
    refetch
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const response = await fetch("/api/achievements");
      if (!response.ok) {
        throw new Error("Failed to fetch achievements");
      }
      return response.json() as Promise<Achievement[]>;
    },
    enabled: !!user
  });

  // Handle loading state
  if (authLoading || achievementsLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-52 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!user) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>
              You need to be logged in to view your achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please log in to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  if (achievementsError) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error loading your achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {achievementsError instanceof Error
                ? achievementsError.message
                : "Unknown error occurred"}
            </p>
            <Button 
              onClick={() => refetch()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No achievements state (unlikely in production but good for testing)
  if (!achievements || achievements.length === 0) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>
              Track your progress and unlock rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No achievements available</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              There are no achievements available yet. Check back later!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Process achievements data
  const earnedAchievements = achievements.filter(a => a.earnedAt !== null);
  const inProgressAchievements = achievements.filter(a => a.earnedAt === null && a.progress > 0);
  const lockedAchievements = achievements.filter(a => a.earnedAt === null && a.progress === 0);
  
  // Get achievement counts by category
  const quizAchievements = achievements.filter(a => a.category === "quiz");
  const streakAchievements = achievements.filter(a => a.category === "streak");
  const socialAchievements = achievements.filter(a => a.category === "social");
  const specialAchievements = achievements.filter(a => a.category === "special");

  // Filter achievements based on selected category
  const filteredAchievements = activeCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  // Helper function to get icon component
  const getIconComponent = (iconName: string, earned: boolean) => {
    const iconProps = {
      className: cn(
        "h-6 w-6",
        earned ? "text-primary" : "text-muted-foreground"
      )
    };
    
    switch (iconName) {
      case "award": return <Award {...iconProps} />;
      case "badge": return <BadgeCheck {...iconProps} />;
      case "book": return <BookOpen {...iconProps} />;
      case "calendar": return <Calendar {...iconProps} />;
      case "gift": return <Gift {...iconProps} />;
      case "star": return <Star {...iconProps} />;
      case "users": return <Users {...iconProps} />;
      case "bookmark": return <Bookmark {...iconProps} />;
      default: return <Award {...iconProps} />;
    }
  };

  // Achievement card component
  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const earned = achievement.earnedAt !== null;
    const inProgress = !earned && achievement.progress > 0;
    const progressPercentage = Math.min(
      Math.round((achievement.progress / achievement.requirement) * 100),
      100
    );

    return (
      <div className={cn(
        "rounded-lg border p-4 transition-all",
        earned ? "bg-primary/5 border-primary/20" : "bg-card border-border"
      )}>
        <div className="flex space-x-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            earned ? "bg-primary/10" : "bg-muted"
          )}>
            {earned ? (
              getIconComponent(achievement.iconUrl, true)
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="font-semibold">{achievement.name}</h3>
                {earned && (
                  <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                    Earned
                  </Badge>
                )}
                {inProgress && (
                  <Badge variant="outline" className="ml-2">
                    In Progress
                  </Badge>
                )}
              </div>
              
              {earned && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(achievement.earnedAt!), "PP")}
                </span>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
            
            {earned ? (
              <div className="mt-2 text-sm font-medium text-primary flex items-center">
                <Gift className="h-4 w-4 mr-1" /> Reward: {achievement.reward}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    Progress: {achievement.progress}/{achievement.requirement}
                  </span>
                  <span className="text-xs font-medium">
                    {progressPercentage}%
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2 mt-1" 
                />
                <div className="mt-2 text-sm font-medium flex items-center text-muted-foreground">
                  <Gift className="h-4 w-4 mr-1" /> Reward: {achievement.reward}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
            <CardDescription>
              Track your progress and unlock rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-primary/5">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Total Earned</p>
                    <p className="text-2xl font-bold">{earnedAchievements.length}</p>
                  </div>
                  <BadgeCheck className="h-8 w-8 text-primary opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Quiz Mastery</p>
                    <p className="text-2xl font-bold">
                      {quizAchievements.filter(a => a.earnedAt !== null).length}/{quizAchievements.length}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Streaks</p>
                    <p className="text-2xl font-bold">
                      {streakAchievements.filter(a => a.earnedAt !== null).length}/{streakAchievements.length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground opacity-80" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Social</p>
                    <p className="text-2xl font-bold">
                      {socialAchievements.filter(a => a.earnedAt !== null).length}/{socialAchievements.length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground opacity-80" />
                </CardContent>
              </Card>
            </div>
            
            <Tabs 
              defaultValue="all" 
              value={activeCategory}
              onValueChange={setActiveCategory}
              className="space-y-4"
            >
              <TabsList className="mb-1">
                <TabsTrigger value="all">
                  All ({achievements.length})
                </TabsTrigger>
                <TabsTrigger value="quiz">
                  Quiz ({quizAchievements.length})
                </TabsTrigger>
                <TabsTrigger value="streak">
                  Streak ({streakAchievements.length})
                </TabsTrigger>
                <TabsTrigger value="social">
                  Social ({socialAchievements.length})
                </TabsTrigger>
                <TabsTrigger value="special">
                  Special ({specialAchievements.length})
                </TabsTrigger>
              </TabsList>
              
              <div className="grid gap-4">
                {earnedAchievements.length > 0 && filteredAchievements.some(a => a.earnedAt !== null) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Earned Achievements</h3>
                    <div className="space-y-3">
                      {filteredAchievements
                        .filter(a => a.earnedAt !== null)
                        .map(achievement => (
                          <AchievementCard 
                            key={achievement.id} 
                            achievement={achievement} 
                          />
                        ))}
                    </div>
                  </div>
                )}
                
                {inProgressAchievements.length > 0 && filteredAchievements.some(a => a.earnedAt === null && a.progress > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">In Progress</h3>
                    <div className="space-y-3">
                      {filteredAchievements
                        .filter(a => a.earnedAt === null && a.progress > 0)
                        .map(achievement => (
                          <AchievementCard 
                            key={achievement.id} 
                            achievement={achievement} 
                          />
                        ))}
                    </div>
                  </div>
                )}
                
                {lockedAchievements.length > 0 && filteredAchievements.some(a => a.earnedAt === null && a.progress === 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Locked Achievements</h3>
                    <div className="space-y-3">
                      {filteredAchievements
                        .filter(a => a.earnedAt === null && a.progress === 0)
                        .map(achievement => (
                          <AchievementCard 
                            key={achievement.id} 
                            achievement={achievement} 
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 