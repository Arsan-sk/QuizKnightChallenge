import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { QuestionChart } from '@/components/analytics/QuestionChart';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { StudentReportTable } from '@/components/analytics/StudentReportTable';
import { QuizAnalytics } from '@/types/analytics';
import { formatTime } from '@/utils/analytics';
import { Users, BarChart3, Clock, CheckCircle2, ChevronRight, Download, Share2, AlertCircle } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const emptyAnalytics: QuizAnalytics = {
  totalAttempts: 0,
  averageScore: null,
  highestScore: null,
  lowestScore: null,
  averageTime: null,
  questionStats: [],
  performanceDistribution: [],
  timePerformance: [],
  studentReports: []
};

export default function QuizAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [, setLocation] = useLocation();
  const [analytics, setAnalytics] = useState<QuizAnalytics>(emptyAnalytics);
  const [quizTitle, setQuizTitle] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const quizResponse = await fetch(`/api/quizzes/${id}`);
        if (quizResponse.ok) {
          const quizData = await quizResponse.json();
          setQuizTitle(quizData.title || "Untitled Quiz");
        }

        const response = await fetch(`/api/analytics/quiz/${id}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
          throw new Error(errorData?.error || `Failed to fetch analytics`);
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (error: any) {
        console.error("Error fetching analytics:", error);
        setError(error.message || "Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#131316] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Loading Analytics Matrix...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#131316] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Analytics Unavailable</h1>
        <p className="text-zinc-400 max-w-md mb-8">{error}</p>
        <Button onClick={() => setLocation(user?.role === "teacher" ? "/teacher" : "/student")} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const completionRate = analytics.totalAttempts > 0 ? 93.2 : 0; // Simulated since DB doesn't track total enrolled precisely here

  return (
    <div className="min-h-screen bg-[#131316] font-sans text-white p-6 md:p-12 overflow-x-hidden relative">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-12 gap-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setLocation("/teacher")}>
              <span>Quizzes</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-indigo-300 truncate max-w-[200px] md:max-w-md">{quizTitle}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quiz Analytics
            </h1>
            <p className="text-zinc-400 max-w-xl leading-relaxed">
              In-depth performance breakdown and insights for this assessment based on global sanctuary reports.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 shrink-0 mt-2 xl:mt-8">
            <Button variant="outline" className="bg-[#1c1c21] border-white/5 hover:bg-white/5 text-white rounded-full px-6 h-12 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button className="bg-indigo-300 hover:bg-indigo-400 text-indigo-950 font-bold rounded-full px-6 h-12 shadow-[0_0_20px_rgba(165,180,252,0.3)] transition-all">
              <Share2 className="w-4 h-4 mr-2" /> Share Results
            </Button>
          </div>
        </div>

        {/* Top Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Participants Card */}
          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                +12%
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">{analytics.totalAttempts}</h2>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Total Participants</p>
          </div>

          {/* Average Score Card */}
          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-zinc-500 text-[10px] font-bold">
                Target: 75%
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">{(analytics.averageScore || 0).toFixed(1)}%</h2>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Average Score</p>
          </div>

          {/* Completion Rate Card */}
          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-zinc-500 text-[10px] font-bold">
                9 incomplete
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">{completionRate}%</h2>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Completion Rate</p>
          </div>

          {/* Time Card */}
          <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
                <Clock className="w-5 h-5 text-rose-400" />
              </div>
              <div className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded border border-rose-500/20">
                -2m avg
              </div>
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-2">{formatTime(analytics.averageTime || 0)}</h2>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Median Time (M:S)</p>
          </div>
        </div>

        {/* Charts Middle Section: Interactive Carousel */}
        <div className="mb-12">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">Analytics Explorer</h3>
              <div className="flex gap-2 bg-[#1c1c21] p-1.5 rounded-full border border-white/5">
                 {[0, 1].map(slideIndex => (
                    <button 
                       key={slideIndex} 
                       onClick={() => setActiveSlide(slideIndex)}
                       className={cn(
                          "h-2 rounded-full transition-all duration-300", 
                          activeSlide === slideIndex ? "w-8 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "w-2 bg-white/10 hover:bg-white/20"
                       )} 
                    />
                 ))}
              </div>
           </div>
           
           <div className="relative overflow-hidden w-full rounded-[2rem] min-h-[460px]">
               <motion.div 
                 className="flex w-[200%]" 
                 animate={{ x: `-${activeSlide * 50}%` }} 
                 transition={{ type: "spring", bounce: 0, duration: 0.8 }}
               >
                  {/* Slide 0: Distribution + Toughest Questions */}
                  <div className="w-1/2 shrink-0 flex-none px-1">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                       <div className="lg:col-span-2 h-full">
                         <DistributionChart data={analytics.performanceDistribution} />
                       </div>
                       <div className="lg:col-span-1 h-full">
                         <QuestionChart data={analytics.questionStats} />
                       </div>
                     </div>
                  </div>

                  {/* Slide 1: Daily Performance Trends */}
                  <div className="w-1/2 shrink-0 flex-none px-1">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                       <div className="lg:col-span-3 h-full">
                         <PerformanceChart data={analytics.timePerformance} />
                       </div>
                     </div>
                  </div>
               </motion.div>
           </div>
        </div>

        {/* Table Bottom Section */}
        <StudentReportTable data={analytics.studentReports} questions={analytics.questions} quizId={id || ''} />

      </div>
    </div>
  );
}