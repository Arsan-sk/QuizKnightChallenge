import { useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { Share2, CheckCircle2, Star, BarChart2, Trophy, Flame, ChevronRight, Rocket, Award } from "lucide-react";
import { Link } from "wouter";

export default function ProfilePage() {
  const { profile, isLoading: profileLoading, error } = useProfile();
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isStudent = user?.role === "student";

  // Fetch dynamic stats from server (unified for string & teacher)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/users/${profile?.id}/stats`],
    enabled: !!profile?.id, 
  });

  const isLoading = profileLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center text-muted-foreground">
        <Skeleton className="h-[400px] w-full max-w-4xl rounded-3xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Profile Not Found</h2>
      </div>
    );
  }

  // Common stats resolution based on role
  const totalPoints = stats?.totalPoints ?? profile.points ?? 0;
  
  // Student stats
  const quizzesCompleted = stats?.quizzesCompleted ?? 0;
  const averageScore = stats?.averageScore ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  
  // Teacher stats
  const totalQuizzes = stats?.totalQuizzes ?? 0;
  const totalAttempts = stats?.totalAttempts ?? 0;

  const getInitials = () => {
    if (profile.name) {
      return profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#131316] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Main Profile Header Card */}
        <div className="bg-[#1c1c21] rounded-[2rem] p-8 relative flex flex-col md:flex-row items-center md:items-start shadow-xl border border-white/5 overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative mb-6 md:mb-0 md:mr-10 flex-shrink-0 mt-4">
            <div className="w-56 h-56 rounded-full border-[10px] border-[#27272a] shadow-2xl overflow-hidden bg-[#27272a] flex items-center justify-center">
              {profile.profilePicture || profile.profileImage ? (
                <img src={profile.profilePicture || profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white/50">{getInitials()}</span>
              )}
            </div>
            {/* Online Indicator */}
            <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#22c55e] border-[6px] border-[#1c1c21] rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
          </div>

          <div className="flex-1 text-center md:text-left z-10 py-2">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
              <span className="bg-[#2e2e38] text-indigo-300 font-bold tracking-widest text-[11px] uppercase px-4 py-1.5 rounded-full">
                {profile.role}
              </span>
              {!isStudent && (
                <span className="bg-[#42331c] text-[#f59e0b] font-bold tracking-widest text-[11px] uppercase px-4 py-1.5 rounded-full">
                  Master Educator
                </span>
              )}
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {profile.name || profile.username}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-8">
              {profile.bio || (isStudent 
                ? "Exploring the realms of knowledge. Constantly leveling up." 
                : "Curating the future of gamified education. Digital Sanctuary Architect & Interactive Quiz Master.")}
            </p>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <Button 
                onClick={() => setEditModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8 py-6 text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              >
                Edit Profile
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-12 h-12 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-[#1a1a1e] rounded-[1.5rem] py-8 px-6 border border-white/5 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-indigo-300 mb-4" strokeWidth={1.5} />
            <span className="text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isStudent ? quizzesCompleted : totalQuizzes}
            </span>
            <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              {isStudent ? 'COMPLETED' : 'CREATED'}
            </span>
          </div>
          
          <div className="bg-[#1e1a30] rounded-[1.5rem] py-8 px-6 border border-indigo-500/20 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.05)]">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            <Star className="w-8 h-8 text-[#f59e0b] mb-4" strokeWidth={1.5} />
            <span className="text-4xl font-extrabold text-[#f59e0b] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {totalPoints >= 1000 ? (totalPoints/1000).toFixed(1) + 'K' : totalPoints}
            </span>
            <span className="text-[11px] font-bold tracking-widest text-[#f59e0b]/70 uppercase">
              POINTS
            </span>
          </div>

          <div className="bg-[#1a1a1e] rounded-[1.5rem] py-8 px-6 border border-white/5 flex flex-col items-center justify-center">
            <BarChart2 className="w-8 h-8 text-[#10b981] mb-4" strokeWidth={1.5} />
            <span className="text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {averageScore}%
            </span>
            <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
              AVG SCORE
            </span>
          </div>

          <div className="bg-[#1a1a1e] rounded-[1.5rem] py-8 px-6 border border-white/5 flex flex-col items-center justify-center">
            {isStudent ? (
              <>
                <Flame className="w-8 h-8 text-orange-500 mb-4" strokeWidth={1.5} />
                <span className="text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{currentStreak}</span>
                <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">DAY STREAK</span>
              </>
            ) : (
              <>
                <Trophy className="w-8 h-8 text-indigo-300 mb-4" strokeWidth={1.5} />
                <span className="text-4xl font-extrabold text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalAttempts}</span>
                <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">AWARDS</span>
              </>
            )}
          </div>
        </div>

        {/* Lower sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          
          {/* Recent Unlocks / Achievements */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent Unlocks</h2>
            <div className="space-y-4">
              <div className="bg-[#1c1c21] rounded-2xl p-5 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#312513] flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Quiz Virtuoso</h3>
                  <p className="text-zinc-400 text-sm mt-1">100% score on 5 consecutive tests</p>
                </div>
              </div>
              <div className="bg-[#1c1c21] rounded-2xl p-5 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#271d3a] flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-[#a855f7]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Speed Runner</h3>
                  <p className="text-zinc-400 text-sm mt-1">Finished a quiz in under 60 seconds</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Activity Timeline</h2>
              <a href="#" className="text-indigo-300 text-sm font-bold flex items-center hover:text-indigo-200">
                View Archive <ChevronRight className="w-4 h-4 ml-1" />
              </a>
            </div>
            
            <div className="relative border-l border-[#3f3f46] ml-4 pl-8 space-y-10 py-2">
              <div className="relative">
                <div className="absolute -left-[37px] top-1 w-[13px] h-[13px] rounded-full bg-indigo-300 border-[3px] border-[#131316] box-content" />
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-base pr-4 leading-tight">
                    {isStudent ? 'Completed "Advanced Quantum Mechanics" Quiz' : 'Created "Advanced Quantum Mechanics" Quiz'}
                  </h3>
                  <span className="text-xs text-zinc-500 font-medium shrink-0 pt-0.5">2h ago</span>
                </div>
                <div className="bg-[#1a1a1e] rounded-xl p-4 flex gap-4 items-center border border-white/5">
                  <div className="w-14 h-14 bg-[#111113] rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-zinc-700 font-mono text-[10px] tracking-widest text-center leading-tight">QUIZ<br/>DATA</span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {isStudent ? 'Scored 92% and earned 45 points in record time.' : 'System-wide live event with 124 concurrent participants. Average retention rate was 92%.'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-[37px] top-1 w-[13px] h-[13px] rounded-full bg-[#f59e0b] border-[3px] border-[#131316] box-content" />
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-base pr-4 leading-tight">Earned "The Sanctuary Architect" Badge</h3>
                  <span className="text-xs text-zinc-500 font-medium shrink-0 pt-0.5">1d ago</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Recognized for maintaining a positive community environment for 30 consecutive days.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[37px] top-1 w-[13px] h-[13px] rounded-full bg-zinc-600 border-[3px] border-[#131316] box-content" />
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-base pr-4 leading-tight">Updated Professor Profile Settings</h3>
                  <span className="text-xs text-zinc-500 font-medium shrink-0 pt-0.5">3d ago</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <EditProfileModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </div>
  );
}