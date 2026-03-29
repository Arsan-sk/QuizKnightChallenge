import { QuestionStat } from "@/types/analytics";
import { motion } from "framer-motion";
import { useState } from "react";

interface QuestionChartProps {
  data: QuestionStat[];
}

export function QuestionChart({ data }: QuestionChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort by lowest success rate to find the "Toughest" questions
  const processedData = [...data]
    .map((q, i) => {
      const successRate = q.totalAttempts > 0 ? (q.correctCount / q.totalAttempts) * 100 : 0;
      return { ...q, successRate, originalIndex: i + 1 };
    })
    .sort((a, b) => a.successRate - b.successRate);

  const displayQuestions = isExpanded ? processedData : processedData.slice(0, 4);

  const getProgressColor = (rate: number) => {
    if (rate <= 30) return "bg-rose-400";
    if (rate <= 50) return "bg-rose-400/80";
    if (rate <= 70) return "bg-amber-400";
    return "bg-emerald-400";
  };

  const getTextColor = (rate: number) => {
    if (rate <= 30) return "text-rose-400";
    if (rate <= 50) return "text-rose-400/80";
    if (rate <= 70) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="bg-[#1c1c21] rounded-[2rem] p-8 border border-white/5 shadow-xl h-full flex flex-col">
      <h3 className="text-xl font-bold text-white tracking-tight mb-8">Toughest Questions</h3>
      
      <div className={`flex-1 overflow-hidden flex flex-col ${isExpanded ? 'h-full max-h-[300px]' : ''}`}>
        {displayQuestions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 font-medium text-sm">
            No question data available yet.
          </div>
        ) : (
          <div className={`space-y-6 ${isExpanded ? 'overflow-y-auto pr-2 custom-scrollbar flex-1' : ''}`}>
            {displayQuestions.map((q, i) => {
              return (
                <div key={q.questionId} className="w-full relative group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-zinc-300 truncate pr-4 max-w-[200px]">
                      Q{q.originalIndex}. {q.questionText}
                    </span>
                  <span className={`text-[11px] font-bold ${getTextColor(q.successRate)} shrink-0`}>
                    {Math.round(q.successRate)}% Success
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#131316] rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${q.successRate}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                    className={`h-full ${getProgressColor(q.successRate)} rounded-full shadow-[0_0_10px_currentColor]`}
                  />
                </div>
                {/* Tooltip for N/M */}
                <div className="absolute top-0 right-[80px] -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-[#131316] text-[#a5b4fc] text-[10px] font-bold px-3 py-1.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-xl border border-indigo-500/20 shadow-indigo-500/10">
                  {q.correctCount} / {q.totalAttempts} Correct
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {data.length > 4 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-8 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl transition-colors border border-white/5 shadow-sm"
        >
          {isExpanded ? "Collapse View" : `Review All ${data.length} Questions`}
        </button>
      )}
    </div>
  );
}