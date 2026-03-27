import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Result, Quiz } from "@shared/schema";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Sun, LineChart, Coins, CircleDashed } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  const { data: results, isLoading: loadingResults } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
  });

  const { data: liveQuizzes, isLoading: loadingLiveQuizzes } = useQuery<(Quiz & { teacherName: string })[]>({
    queryKey: ["/api/quizzes/live"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setTimeOfDay('morning');
    else if (hour >= 12 && hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;
    return (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1);
  };

  const getCompletedQuizCount = () => results?.length || 0;
  const calculateTotalPoints = () => user?.points || 0;

  const getGreeting = () => {
    const emoji = timeOfDay === 'morning' ? '☀️' : timeOfDay === 'afternoon' ? '⚡' : '🌙';
    return `Good ${timeOfDay}, ${user?.username}! ${emoji}`;
  };

  if (loadingResults || loadingLiveQuizzes) {
    return <div className="min-h-screen bg-[#131316] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Loading Mission Control...</div>;
  }

  // Fallback mock images for live quizzes
  const mockImages = [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-[#131316] font-sans text-white p-6 md:p-12 overflow-x-hidden relative">
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[2rem] p-10 md:p-16 mb-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
          style={{ background: 'linear-gradient(135deg, #2e1a66 0%, #170d33 100%)' }}
        >
          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {getGreeting()}
            </h1>
            <p className="text-indigo-200/80 text-lg md:text-xl font-medium tracking-wide">
              Ready to challenge yourself today?
            </p>
          </div>
          
          <div className="relative z-10 shrink-0 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center group cursor-pointer" onClick={() => setLocation("/achievements")}>
             <div className="absolute inset-0 rounded-full border-[8px] border-white/10" />
             <motion.div 
                initial={{ rotate: -90, strokeDasharray: "0 100" }}
                animate={{ rotate: -90, strokeDasharray: "75 100" }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="absolute inset-0 rounded-full border-[8px] border-indigo-200 pointer-events-none"
             />
             <div className="text-center">
               <div className="text-3xl md:text-4xl font-extrabold text-white">75%</div>
               <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-300">Daily Goal</div>
             </div>
          </div>
        </motion.div>

        {/* 3 Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Points */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Your Points
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-amber-950 text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)]">$</div>
            </div>
            <h2 className="text-4xl font-extrabold text-amber-400 mb-2">{calculateTotalPoints().toLocaleString()}</h2>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 -rotate-45" />
              +12% from last week
            </div>
          </motion.div>

          {/* Quizzes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Quizzes Completed
              </div>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">{getCompletedQuizCount()}</h2>
            <div className="text-xs font-bold text-zinc-500">
              Mastery: Advanced
            </div>
          </motion.div>

          {/* Average */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                Average Score
              </div>
              <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-[#131316]">
                <LineChart className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-emerald-400 mb-2">{calculateAverageScore()}%</h2>
            <div className="text-xs font-bold text-zinc-500">
              Top 5% of Students
            </div>
          </motion.div>
        </div>

        {/* Split Layout: Live Quizzes & Global Ranks */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-20">
          
          {/* Left Col: Live Quizzes */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-white tracking-tight">Live Quizzes</h2>
                 <div className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> LIVE
                 </div>
               </div>
               <Link href="/quizzes">
                 <div className="text-xs font-bold text-zinc-400 hover:text-white cursor-pointer transition-colors">View All</div>
               </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {liveQuizzes && liveQuizzes.length > 0 ? (
                 liveQuizzes.slice(0, 2).map((quiz, i) => (
                    <div key={quiz.id} onClick={() => setLocation(`/quizzes/${quiz.id}`)} className="bg-[#1c1c21] rounded-[2rem] border border-white/5 overflow-hidden shadow-xl cursor-pointer group hover:border-white/10 transition-colors">
                      <div className="h-40 w-full relative overflow-hidden">
                        <img src={mockImages[i % 2]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 mix-blend-screen mix-blend-overlay" />
                        <div className="absolute top-4 left-4 bg-white text-black px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest leading-none shadow-lg">
                          {quiz.category || 'General'}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 truncate">{quiz.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-6">{quiz.description}</p>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center">
                             {/* Mock Avatars */}
                             <div className="flex -space-x-2">
                               <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-[#1c1c21] text-[10px] flex items-center justify-center font-bold">AJ</div>
                               <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#1c1c21] text-[10px] flex items-center justify-center font-bold">MK</div>
                               <div className="w-8 h-8 rounded-full bg-[#131316] border-2 border-[#1c1c21] text-[10px] flex items-center justify-center font-bold text-zinc-500">+12</div>
                             </div>
                           </div>
                           <button className="bg-indigo-300 hover:bg-indigo-400 text-indigo-950 px-6 py-2 rounded-full text-xs font-bold transition-colors">
                             Join Now
                           </button>
                        </div>
                      </div>
                    </div>
                 ))
               ) : (
                 <div className="col-span-1 lg:col-span-2 bg-[#1c1c21] rounded-[2rem] border border-white/5 p-12 text-center">
                   <CircleDashed className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-white mb-2">No Active Quizzes</h3>
                   <p className="text-zinc-500">Wait for your teacher to launch a live session.</p>
                 </div>
               )}
            </div>
          </div>

          {/* Right Col: Global Ranks */}
          <div className="xl:col-span-1">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-white tracking-tight">Global Ranks</h2>
               <div className="flex gap-1">
                 <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                 <div className="w-1 h-1 bg-zinc-600 rounded-full" />
                 <div className="w-1 h-1 bg-zinc-600 rounded-full" />
               </div>
            </div>
            {/* The widget uses fullPage=false for standard view */}
            <LeaderboardWidget limit={5} fullPage={false} onlyStudents={true} />
            <div className="mt-4 text-center">
              <Link href="/leaderboard">
                 <button className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">Show Global Leaderboard</button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Section: Hungry for more? */}
        <div className="py-20 text-center flex flex-col items-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hungry for more?
          </h2>
          <p className="text-zinc-400 max-w-lg mb-10 text-lg">
            Explore over 5,000+ quizzes across various domains from science to pop culture.
          </p>
          <Link href="/quizzes">
            <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)] px-8 py-4 rounded-full text-sm font-bold flex items-center gap-2 mb-16 transition-all hover:scale-105 active:scale-95">
              Browse All Quizzes <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          <div className="flex items-center justify-center gap-12 md:gap-24">
            <div>
              <div className="text-2xl font-black text-white mb-1">1.2k+</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Daily Active</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white mb-1">50k+</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total Quizzes</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white mb-1">24/7</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Support</div>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between text-[11px] font-bold text-zinc-600 mt-20 pt-8 border-t border-white/5 pb-8">
          <div>© 2024 QuizKTC Digital Sanctuary. All rights reserved.</div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">Help Center</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}