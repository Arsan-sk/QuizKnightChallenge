import React from "react";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Edit, User, Book, Calendar, School, Award, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-48 mt-4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 mt-2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-destructive">Failed to load profile: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center h-96">
          <p>No profile data available.</p>
          <Button asChild className="mt-4">
            <Link href="/profile/edit">Create Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get initial for avatar
  const getInitial = () => {
    if (profile.name) return profile.name.charAt(0).toUpperCase();
    if (profile.username) return profile.username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <ScrollArea className="h-[calc(100vh-65px)] w-full">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-1"
          >
            <Card>
              <CardHeader className="relative pb-8">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4"
                  asChild
                >
                  <Link href="/profile/edit">
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Link>
                </Button>
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profile.profilePicture} />
                    <AvatarFallback className="text-2xl">{getInitial()}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-center">{profile.name || profile.username}</CardTitle>
                  {profile.username && profile.name && (
                    <CardDescription className="text-center">@{profile.username}</CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.bio && (
                    <div className="flex items-start space-x-2">
                      <User size={16} className="mt-1 flex-shrink-0" />
                      <p className="text-sm">{profile.bio}</p>
                    </div>
                  )}
                  
                  {profile.branch && (
                    <div className="flex items-center space-x-2">
                      <Book size={16} className="flex-shrink-0" />
                      <p className="text-sm">Branch: {profile.branch}</p>
                    </div>
                  )}
                  
                  {profile.year && (
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="flex-shrink-0" />
                      <p className="text-sm">Year: {profile.year}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats and Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="md:col-span-2"
          >
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy size={20} className="mr-2" />
                    Stats
                  </CardTitle>
                  <CardDescription>Your quiz performance and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Quizzes Taken</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Average Score</p>
                      <p className="text-3xl font-bold">0%</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Total Points</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground text-sm">Global Rank</p>
                      <p className="text-3xl font-bold">-</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award size={20} className="mr-2" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Badges and rewards you've earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-muted-foreground">
                      No achievements yet. Start taking quizzes to earn badges!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </ScrollArea>
  );
} 