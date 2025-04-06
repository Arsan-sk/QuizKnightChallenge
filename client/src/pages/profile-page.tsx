import React from "react";
import { useProfile } from "@/hooks/use-profile";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal } from "lucide-react";

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>Failed to load profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              No profile information could be loaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please make sure you are logged in.</p>
            <Link href="/auth">
              <Button className="mt-4">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = () => {
    if (profile.displayName) {
      return profile.displayName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.profileImage} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <CardTitle className="text-2xl">
              {profile.displayName || profile.username}
            </CardTitle>
            <CardDescription>@{profile.username}</CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {profile.role}
              </Badge>
              {profile.branch && <Badge variant="outline">{profile.branch}</Badge>}
              {profile.year && <Badge variant="outline">{profile.year} Year</Badge>}
            </div>
          </div>
          <Link href="/profile/edit">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{profile.points}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Global Rank</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                {profile.stats?.globalRank ? (
                  <div className="flex items-center">
                    {profile.stats.globalRank === 1 ? (
                      <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                    ) : profile.stats.globalRank === 2 ? (
                      <Medal className="h-8 w-8 text-gray-400 mr-2" />
                    ) : profile.stats.globalRank === 3 ? (
                      <Medal className="h-8 w-8 text-amber-700 mr-2" />
                    ) : null}
                    <p className="text-3xl font-bold">
                      {profile.stats.globalRank}
                      <span className="text-lg text-muted-foreground ml-1">
                        {profile.stats.globalRank === 1 
                          ? "st" 
                          : profile.stats.globalRank === 2 
                            ? "nd" 
                            : profile.stats.globalRank === 3 
                              ? "rd" 
                              : "th"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Not ranked yet</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {profile.achievements?.length || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Since</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            {profile.stats?.quizzesTaken ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quizzes Taken</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{profile.stats.quizzesTaken}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          {profile.achievements && profile.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {profile.achievements.map((achievement, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{achievement}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Achievements Yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Complete quizzes to earn achievements!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your completed quizzes will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 