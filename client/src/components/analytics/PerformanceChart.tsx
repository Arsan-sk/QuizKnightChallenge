import { TimePerformance } from "@/types/analytics";
import { TrendingUp, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface PerformanceChartProps {
  data: TimePerformance[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1c1c21] rounded-[2rem] p-8 md:p-10 border border-white/5 shadow-2xl h-full flex flex-col justify-center items-center text-center">
         <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
         <h3 className="text-xl font-bold text-white mb-2">No Performance Data</h3>
         <p className="text-sm text-zinc-400">Trends will appear once quizzes are attempted.</p>
      </div>
    );
  }

  // Format data
  const chartData = data.map(item => ({
    date: new Date(item.date),
    label: format(new Date(item.date), "MMM d"),
    score: item.averageScore || 0,
    attempts: item.attempts || 0,
    correct: item.correct || 0,
    wrong: item.wrong || 0
  }));

  const maxAttempts = Math.max(...chartData.map(d => d.attempts), 10); // Minimum 10 scale for aesthetic spacing

  return (
    <div className="bg-[#1c1c21] rounded-[2rem] p-8 md:p-10 border border-white/5 shadow-2xl h-full flex flex-col relative overflow-hidden group">
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, #3f3f46 1px, transparent 1px), linear-gradient(to bottom, #3f3f46 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start mb-10 gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Performance Trends
            <div className="p-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </h3>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">
            Daily Scores & Attempts
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 text-[10px] uppercase tracking-widest font-black text-zinc-400 border border-white/5 bg-black/20 px-4 py-2 rounded-full">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Score %</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
              <span>Attempts</span>
           </div>
        </div>
      </div>

      {/* Chart Plot Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-end mt-4 min-h-[220px]">
        {/* Y Axis Guide Lines (Background) */}
        <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none">
           {[100, 75, 50, 25, 0].map(val => (
              <div key={val} className="w-full flex items-center border-t border-white/5 h-0">
                 <span className="absolute -left-2 -translate-x-full text-[9px] font-bold text-zinc-600">{val}%</span>
              </div>
           ))}
        </div>

        {/* Data Bars & Points Container */}
        <div className="relative w-full h-[220px] flex items-end justify-between px-6 pt-2">
           {chartData.map((d, i) => {
              // Calculate heights relative to maximum scale
              const barHeight = `${Math.min((d.attempts / maxAttempts) * 100, 100)}%`;
              const pointHeight = `${d.score}%`;

              return (
                 <div key={i} className="relative flex flex-col items-center justify-end h-full w-full group/point" style={{ maxWidth: '40px' }}>
                    {/* Attempts Bar */}
                    <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: barHeight }}
                       transition={{ duration: 1, delay: i * 0.05, type: "spring", bounce: 0.2 }}
                       className="w-full bg-emerald-500/20 rounded-t-sm border-t border-emerald-500/50 relative z-10 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    />

                    {/* Score Point Indicator Line / Dot */}
                    <div className="absolute bottom-0 w-0.5 bg-indigo-500/0 z-20 h-full flex flex-col justify-end pointer-events-none">
                       <motion.div 
                           initial={{ bottom: '0%', opacity: 0 }}
                           animate={{ bottom: pointHeight, opacity: 1 }}
                           transition={{ duration: 1, delay: i * 0.05 + 0.3 }}
                           className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-[#1c1c21] border-2 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)] z-30 pointer-events-auto cursor-pointer flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-125 transition-all"
                       >
                           {/* Tooltip that appears on hover */}
                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#131316] border border-white/10 px-3 py-2 rounded-xl text-center shadow-xl opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              <div className="text-[10px] font-black uppercase text-zinc-500 mb-1">{d.label}</div>
                              <div className="text-sm font-bold text-white"><span className="text-indigo-400">{d.score.toFixed(1)}%</span> Avg</div>
                              <div className="text-xs text-zinc-400">{d.attempts} attempts</div>
                           </div>
                       </motion.div>
                    </div>

                    {/* X Axis Label */}
                    <div className="absolute top-[calc(100%+12px)] text-[9px] font-black tracking-widest text-zinc-500 whitespace-nowrap -rotate-45 origin-top-left translate-x-3">
                       {d.label}
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
}