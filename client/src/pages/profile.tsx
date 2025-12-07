import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { StudentProfile } from "@/components/profile/StudentProfile";
import { TeacherProfile } from "@/components/profile/TeacherProfile";
import {
    Edit,
    Mail,
    Calendar,
    MapPin,
    GraduationCap,
    Briefcase,
} from "lucide-react";
import { Link } from "wouter";

export default function ProfilePage() {
    const { profile, isLoading, error } = useProfile();
    const { user } = useAuth();
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Debug logging
    console.log('ProfilePage - profile:', profile);
    console.log('ProfilePage - user:', user);
    console.log('ProfilePage - isLoading:', isLoading);
    console.log('ProfilePage - error:', error);

    // Loading state
    if (isLoading) {
        return (
            <div className="container py-8 space-y-8">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="space-y-3 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container py-8">
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold text-destructive">Error</h2>
                            <p className="text-muted-foreground">
                                Failed to load profile data
                            </p>
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No profile - only show this if not loading and definitely no profile
    if (!isLoading && !profile && !user) {
        return (
            <div className="container py-8">
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold">Profile Not Found</h2>
                            <p className="text-muted-foreground">
                                Please make sure you are logged in.
                            </p>
                            <Link href="/auth">
                                <Button>Go to Login</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If we have user but profile is still loading, show loading state
    if (user && !profile && isLoading) {
        return (
            <div className="container py-8 space-y-8">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="space-y-3 flex-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    // Use profile data if available, otherwise fall back to user data
    const displayProfile = profile || user;

    const getInitials = () => {
        const nameToUse = displayProfile?.name || displayProfile?.username || "??";
        if (displayProfile?.name) {
            return displayProfile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);
        }
        return nameToUse.substring(0, 2).toUpperCase();
    };

    const isStudent = user?.role === "student" || displayProfile?.role === "student";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="overflow-hidden border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    {/* Background gradient */}
                    <div
                        className={`h-40 bg-gradient-to-r relative ${isStudent
                                ? "from-blue-600 via-purple-600 to-pink-600"
                                : "from-emerald-600 via-teal-600 to-cyan-600"
                            }`}
                    >
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                    </div>

                    <CardContent className="relative -mt-20 pb-8 pt-4">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
                            {/* Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative"
                            >
                                <Avatar className="h-36 w-36 border-[6px] border-white dark:border-slate-900 shadow-2xl ring-4 ring-blue-100 dark:ring-blue-900/30">
                                    <AvatarImage
                                        src={displayProfile?.profilePicture || displayProfile?.profileImage}
                                    />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Online indicator */}
                                <div className="absolute bottom-3 right-3 h-7 w-7 bg-green-500 border-[5px] border-white dark:border-slate-900 rounded-full shadow-lg">
                                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                                </div>
                            </motion.div>

                            {/* Profile Info */}
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                        {displayProfile?.name || displayProfile?.username || "User"}
                                    </h1>
                                    <p className="text-lg text-muted-foreground font-medium">@{displayProfile?.username || "unknown"}</p>
                                </div>

                                <div className="flex flex-wrap gap-2.5">
                                    <Badge
                                        variant="secondary"
                                        className={`capitalize px-4 py-1.5 text-sm font-semibold ${isStudent
                                                ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                : "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                            }`}
                                    >
                                        {isStudent ? (
                                            <GraduationCap className="h-3 w-3 mr-1" />
                                        ) : (
                                            <Briefcase className="h-3 w-3 mr-1" />
                                        )}
                                        {displayProfile?.role || "user"}
                                    </Badge>

                                    {displayProfile?.branch && (
                                        <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white/50 dark:bg-slate-800/50">
                                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                            {displayProfile.branch}
                                        </Badge>
                                    )}

                                    {displayProfile?.year && (
                                        <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white/50 dark:bg-slate-800/50">{displayProfile.year} Year</Badge>
                                    )}
                                </div>

                                {displayProfile?.bio && (
                                    <p className="text-muted-foreground max-w-2xl leading-relaxed text-base">
                                        {displayProfile.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
                                    {displayProfile?.email && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50">
                                            <Mail className="h-4 w-4 text-slate-500" />
                                            <span className="font-medium">{displayProfile.email}</span>
                                        </div>
                                    )}
                                    {displayProfile?.createdAt && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50">
                                            <Calendar className="h-4 w-4 text-slate-500" />
                                            <span className="font-medium">Joined {new Date(displayProfile.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Edit Button */}
                            <Button
                                onClick={() => setEditModalOpen(true)}
                                className="gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                                size="lg"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Role-specific content */}
            {isStudent ? (
                <StudentProfile profile={displayProfile} />
            ) : (
                <TeacherProfile profile={displayProfile} />
            )}

            {/* Edit Profile Modal */}
            <EditProfileModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
            />
        </div>
    );
}
