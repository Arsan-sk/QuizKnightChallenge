import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentProfile } from "@/components/profile/StudentProfile";
import { TeacherProfile } from "@/components/profile/TeacherProfile";
import {
  Edit, Mail, Calendar, MapPin, GraduationCap,
  Briefcase, RefreshCw, Shield, AlertCircle
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function ProfilePage() {
  const { profile, isLoading, error } = useProfile();
  const { user } = useAuth();

  const isTeacher = profile?.role === "teacher" || user?.role === "teacher";

  const heroBg = isTeacher
    ? "linear-gradient(135deg, hsl(145 63% 30%) 0%, hsl(180 70% 30%) 100%)"
    : "linear-gradient(135deg, hsl(var(--primary) / 0.9) 0%, hsl(270 80% 50%) 100%)";

  const getInitials = () => {
    const name = profile?.displayName || profile?.username || user?.username || "U";
    return name.substring(0, 2).toUpperCase();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl overflow-hidden">
          <Skeleton className="h-36 w-full" />
          <div className="relative px-6 pb-6">
            <Skeleton className="absolute -top-14 left-6 h-28 w-28 rounded-full border-4 border-[hsl(var(--background))]" />
            <div className="pt-20 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div
          className="clay-card p-10 text-center max-w-sm"
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--danger-h) var(--danger-s) 60%)]" />
          <h2
            className="font-bold text-[hsl(var(--foreground))] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Failed to load profile
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Something went wrong while loading your profile data.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
            style={{ background: "hsl(var(--primary))" }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <motion.div {...fadeUp} className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Hero Card */}
        <div className="clay-card overflow-hidden">
          {/* Banner */}
          <div
            className="h-36 relative"
            style={{ background: heroBg }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)" }}
            />
            {/* Edit button */}
              <Link href="/profile/edit">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-4 right-4 gap-1.5 font-medium text-xs bg-black/30 border-white/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              </Link>
          </div>

          {/* Avatar + basic info */}
          <div className="relative px-6 pb-6">
            {/* Avatar — overlaps banner */}
            <div className="absolute -top-14 left-6">
              <Avatar
                className="w-28 h-28 border-4 border-[hsl(var(--background))] shadow-xl"
              >
                <AvatarImage src={profile?.profilePicture || (profile as any)?.profileImage} />
                <AvatarFallback
                  className="text-3xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(270 90% 65%))" }}
                >
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {/* Online dot */}
              <span
                className="absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(145,63%,48%)] border-2 border-[hsl(var(--background))]"
              />
            </div>

            <div className="pt-18 mt-16">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1
                    className="text-2xl font-extrabold text-[hsl(var(--foreground))] mb-1"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {profile?.displayName || profile?.username || user?.username}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {profile?.username && (
                      <span className="font-mono text-xs">@{profile.username}</span>
                    )}
                    <span className={isTeacher ? "badge-success" : "badge-primary"}>
                      {isTeacher ? "🎓 Teacher" : "🏅 Student"}
                    </span>
                    {isTeacher && (
                      <span
                        className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{
                          background: "hsl(38 95% 58% / 0.15)",
                          color: "hsl(38 95% 65%)",
                          border: "1px solid hsl(38 95% 58% / 0.3)",
                        }}
                      >
                        MASTER EDUCATOR
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile edit button */}
                <Link href="/profile/edit">
                  <Button
                    size="sm"
                    variant="outline"
                    className="md:hidden gap-1.5 text-xs border-[hsl(var(--border))]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </Link>
              </div>

              {/* Bio / meta info */}
              <div className="mt-4 space-y-2">
                {profile?.bio && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  {profile?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {profile.email}
                    </div>
                  )}
                  {profile?.branch && (
                    <div className="flex items-center gap-1.5">
                      {isTeacher ? <Briefcase className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                      {profile.branch}
                      {profile.year && `, ${profile.year}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isTeacher && profile ? (
          <TeacherProfile profile={profile as any} />
        ) : profile ? (
          <StudentProfile profile={profile as any} />
        ) : null}
      </motion.div>
    </div>
  );
}
