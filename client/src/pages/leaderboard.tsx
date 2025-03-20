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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronUp, Medal, Search, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// LeaderboardUser interface
interface LeaderboardUser {
  id: number;
  username: string;
  displayName: string;
  profilePicture: string;
  role: "student" | "teacher";
  points: number;
  quizzesTaken: number;
  rank: number;
  badges: string[];
}

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch leaderboard data
  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refetch
  } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard");
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }
      return response.json() as Promise<LeaderboardUser[]>;
    }
  });

  // Handle loading state
  if (authLoading || leaderboardLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-52 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 mb-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (leaderboardError) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error loading the leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {leaderboardError instanceof Error
                ? leaderboardError.message
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

  // Process leaderboard data
  const filteredUsers = leaderboardData
    ? leaderboardData
        .filter(userData => 
          roleFilter === "all" || userData.role === roleFilter
        )
        .filter(userData =>
          userData.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userData.displayName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];

  // Find current user in the leaderboard
  const currentUserRanking = leaderboardData?.find(u => u.id === user?.id);

  // Function to render rank badge
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-1" /> 
          <span className="font-bold text-yellow-500">1st</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center">
          <Medal className="h-5 w-5 text-gray-400 mr-1" /> 
          <span className="font-bold text-gray-400">2nd</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center">
          <Medal className="h-5 w-5 text-amber-700 mr-1" /> 
          <span className="font-bold text-amber-700">3rd</span>
        </div>
      );
    }
    return <span className="font-semibold">{rank}th</span>;
  };

  // Get initials from display name or username
  const getInitials = (displayName: string, username: string) => {
    if (displayName) {
      return displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Leaderboard</CardTitle>
          <CardDescription>
            See who's leading in quizzes and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students Only</SelectItem>
                  <SelectItem value="teacher">Teachers Only</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {leaderboardData?.length || 0} users
            </div>
          </div>

          <Table>
            <TableCaption>Top users ranked by points and achievements</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead className="hidden md:table-cell">Badges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userData) => (
                <TableRow 
                  key={userData.id}
                  className={userData.id === user?.id ? "bg-primary/5" : ""}
                >
                  <TableCell className="font-medium">
                    {getRankBadge(userData.rank)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.profilePicture} />
                        <AvatarFallback>
                          {getInitials(userData.displayName, userData.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{userData.displayName || userData.username}</div>
                        <div className="text-xs text-muted-foreground">@{userData.username}</div>
                      </div>
                      {userData.id === user?.id && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{userData.points}</div>
                  </TableCell>
                  <TableCell>{userData.quizzesTaken}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {userData.badges && userData.badges.length > 0 ? (
                        userData.badges.map((badge, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">None yet</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Show current user's position if not in view */}
          {currentUserRanking && user && (
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Your Position</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/achievements")}
                >
                  View Achievements
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-medium w-[80px]">
                      {getRankBadge(currentUserRanking.rank)}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUserRanking.profilePicture} />
                      <AvatarFallback>
                        {getInitials(currentUserRanking.displayName, currentUserRanking.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{currentUserRanking.displayName || currentUserRanking.username}</div>
                      <div className="text-xs text-muted-foreground">@{currentUserRanking.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Points</div>
                      <div className="font-bold">{currentUserRanking.points}</div>
                    </div>
                    <ChevronUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                {currentUserRanking.rank > 10 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You're {currentUserRanking.rank - 10} positions away from the top 10. Keep going!
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 