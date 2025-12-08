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
        <div className="container py-8 space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="overflow-hidden">
                    {/* Background gradient */}
                    <div
                        className={`h-32 bg-gradient-to-r ${isStudent
                                ? "from-blue-500 via-purple-500 to-pink-500"
                                : "from-green-500 via-teal-500 to-cyan-500"
                            }`}
                    />

                    <CardContent className="relative -mt-16 pb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                            {/* Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative"
                            >
                                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                    <AvatarImage
                                        src={displayProfile?.profilePicture || displayProfile?.profileImage}
                                    />
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Online indicator */}
                                <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-background rounded-full" />
                            </motion.div>

                            {/* Profile Info */}
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        {displayProfile?.name || displayProfile?.username || "User"}
                                    </h1>
                                    <p className="text-muted-foreground">@{displayProfile?.username || "unknown"}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={`capitalize ${isStudent
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
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
                                        <Badge variant="outline">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {displayProfile.branch}
                                        </Badge>
                                    )}

                                    {displayProfile?.year && (
                                        <Badge variant="outline">{displayProfile.year} Year</Badge>
                                    )}
                                </div>

                                {displayProfile?.bio && (
                                    <p className="text-muted-foreground max-w-2xl">
                                        {displayProfile.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    {displayProfile?.email && (
                                        <div className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {displayProfile.email}
                                        </div>
                                    )}
                                    {displayProfile?.createdAt && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Joined {new Date(displayProfile.createdAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Edit Button */}
                            <Button
                                onClick={() => setEditModalOpen(true)}
                                className="gap-2"
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
