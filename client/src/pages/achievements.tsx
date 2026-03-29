import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Award, 
  BadgeCheck, 
  BookOpen, 
  Calendar, 
  Gift, 
  Lock, 
  Star, 
  Users,
  Medal,
  Zap,
  Globe,
  Diamond,
  Target
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const { user, isLoading: authLoading } = useAuth(); const { data: userStats, refetch: fetchStats } = useQuery({ queryKey: ['api', 'users', user?.id], queryFn: async () => { const res = await fetch('/api/users/' + user?.id); return (await res.json())?.stats; }, enabled: !!user?.id });
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const {
    data: achievements,
    isLoading: achievementsLoading,
    error: achievementsError
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const response = await fetch("/api/achievements");
      if (!response.ok) throw new Error("Failed to fetch achievements");
      return response.json() as Promise<Achievement[]>;
    },
    enabled: !!user
  });

  if (authLoading || achievementsLoading) {
    return <div className="min-h-screen bg-[#131316] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Loading Trophy Room...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#131316] flex items-center justify-center flex-col text-center p-6">
        <Lock className="w-12 h-12 text-zinc-600 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Sanctuary Restricted</h2>
        <p className="text-zinc-500 max-w-sm mb-8">Access to the Trophy Room requires authentication.</p>
        <button onClick={() => navigate("/auth")} className="bg-white text-black px-8 py-3 rounded-full font-bold">Authenticate</button>
      </div>
    );
  }

  const earnedAchievements = achievements?.filter(a => a.earnedAt !== null) || [];
  const inProgressAchievements = achievements?.filter(a => a.earnedAt === null && a.progress > 0) || [];

  const categories = [
    { id: "all", label: "All Achievements" },
    { id: "quiz", label: "Milestones" },
    { id: "special", label: "Special Events" },
    { id: "social", label: "Social" },
  ];

  const filteredAchievements = achievements?.filter(a => activeCategory === "all" || a.category === activeCategory) || [];

  const getIconForCategory = (category: string) => {
    switch(category) {
      case "quiz": return Globe;
      case "streak": return Zap;
      case "special": return Diamond;
      case "social": return Users;
      default: return Target;
    }
  };

  const getCategoryTheme = (category: string, earned: boolean) => {
    if (!earned) return { bg: "bg-[#131316]", icon: "text-zinc-600", border: "" };
    switch(category) {
      case "quiz": return { bg: "bg-indigo-400", shadow: "shadow-[0_0_30px_rgba(129,140,248,0.4)]", icon: "text-[#131316]", text: "text-indigo-400" };
      case "streak": return { bg: "bg-amber-400", shadow: "shadow-[0_0_30px_rgba(251,191,36,0.4)]", icon: "text-[#131316]", text: "text-amber-400" };
      case "special": return { bg: "bg-emerald-400", shadow: "shadow-[0_0_30px_rgba(52,211,153,0.4)]", icon: "text-[#131316]", text: "text-emerald-400" };
      case "social": return { bg: "bg-rose-400", shadow: "shadow-[0_0_30px_rgba(251,113,133,0.4)]", icon: "text-[#131316]", text: "text-rose-400" };
      default: return { bg: "bg-zinc-400", shadow: "", icon: "text-[#131316]", text: "text-zinc-400" };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case "quiz": return "LEGENDARY";
      case "streak": return "RARE";
      case "special": return "EPIC PURSUIT";
      case "social": return "MYTHIC";
      default: return "SPEED TRIAL";
    }
  };

  return (
    <div className="min-h-screen bg-[#131316] font-sans text-white p-6 md:p-12 overflow-x-hidden relative">
      {/* Ambient background glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Trophy Room
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed text-lg">
            Your journey through the digital sanctuary is marked by these obsidian tokens. Each milestone forged in the heat of competition.
          </p>
        </div>

        {/* 4 Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                <BadgeCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                Total Points
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white">{userStats?.totalScore || user?.points || 0}</h2>
          </div>

          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                <Medal className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                Mastery
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white">84%</h2>
          </div>

          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                Win Streak
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white">{userStats?.winStreak || 0}</h2>
          </div>

          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                Global Rank
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white">{userStats?.globalRank ? `#${userStats.globalRank}` : 'Unranked'}</h2>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-10 border-b border-white/5 pb-8">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={cn(
                "px-6 py-3 rounded-full text-sm font-bold transition-all duration-300",
                activeCategory === c.id 
                  ? "bg-indigo-500/10 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-indigo-500/20" 
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <AnimatePresence>
            {filteredAchievements.map((achievement, i) => {
              const earned = achievement.earnedAt !== null;
              const inProgress = !earned && achievement.progress > 0;
              const locked = !earned && achievement.progress === 0;
              const progressPercentage = Math.min(Math.round((achievement.progress / achievement.requirement) * 100), 100);
              
              const Icon = getIconForCategory(achievement.category);
              const theme = getCategoryTheme(achievement.category, earned);

              if (earned) {
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={`earned-${achievement.id}`} 
                    className="bg-[#131316] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl flex items-center gap-6 relative overflow-hidden group hover:border-white/15 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={cn("w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shrink-0 relative", theme.bg, theme.shadow)}>
                      <Icon className={cn("w-10 h-10 drop-shadow-md", theme.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-black tracking-widest text-zinc-400">
                        <span className={theme.text}>{getCategoryLabel(achievement.category)}</span>
                        <span className="text-zinc-700">•</span>
                        <span>Forged {format(new Date(achievement.earnedAt!), "dd.MM.yy")}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 truncate">{achievement.name}</h3>
                      <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-[90%] md:line-clamp-2">{achievement.description}</p>
                    </div>
                  </motion.div>
                );
              }

              if (inProgress) {
                const pColor = achievement.category === "quiz" ? "bg-amber-400 text-amber-400" : "bg-emerald-400 text-emerald-400";
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={`prog-${achievement.id}`} 
                    className="bg-[#1c1c21] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="flex items-start md:items-center gap-6 mb-6">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#131316] border border-white/5 flex items-center justify-center shrink-0">
                        <Icon className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className={cn("text-[10px] uppercase font-black tracking-widest", pColor.split(" ")[1])}>
                            {getCategoryLabel(achievement.category)}
                          </div>
                          <div className={cn("text-[10px] uppercase font-black tracking-widest", pColor.split(" ")[1])}>
                            {progressPercentage}%
                          </div>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 truncate">{achievement.name}</h3>
                        <p className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-[90%] md:line-clamp-2">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 md:h-3 bg-[#131316] rounded-full overflow-hidden border border-white/5 mt-auto">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                        className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", pColor.split(" ")[0])} 
                      />
                    </div>
                  </motion.div>
                );
              }

              // Locked
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={`locked-${achievement.id}`} 
                  className="bg-[#131316]/60 rounded-3xl p-6 md:p-8 border border-white/[0.02] relative overflow-hidden opacity-50 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1c1c21] border border-white/5 flex items-center justify-center shrink-0">
                      <Diamond className="w-8 h-8 md:w-10 md:h-10 text-zinc-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">
                        {getCategoryLabel(achievement.category)}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-zinc-600 mb-2 truncate">{achievement.name}</h3>
                      <p className="text-xs md:text-sm text-zinc-700 leading-relaxed max-w-[90%] md:line-clamp-2">
                        {achievement.description.split(" ").map(w => w.length > 4 ? "???" : w).join(" ")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredAchievements.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <Target className="w-16 h-16 text-zinc-700 mb-6" />
            <h3 className="text-2xl font-bold text-zinc-500 mb-2">No Tokens Found</h3>
            <p className="text-zinc-600">The sanctuary has yet to reveal these milestones to you.</p>
          </div>
        )}

      </div>
    </div>
  );
}
