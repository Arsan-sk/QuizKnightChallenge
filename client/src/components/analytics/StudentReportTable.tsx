import { SharedQuizReview } from "@/components/shared/SharedQuizReview";
import { StudentReport } from "@/types/analytics";
import { formatTime } from "@/utils/analytics";
import { useState } from "react";
import { ChevronDown, Filter, X, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentReportTableProps {
  data: StudentReport[];
  questions?: any[];
  quizId: string;
}

export function StudentReportTable({ data, questions = [], quizId }: StudentReportTableProps) {
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [selectedStudent, setSelectedStudent] = useState<StudentReport | null>(null);
  const [activeTab, setActiveTab] = useState<'answers' | 'violations'>('answers');

// Sort the data (by score, and then by timeTaken for tie-breaking)
  const sortedData = [...data].sort((a, b) => {
    if (sortDirection === "asc") {
        if (a.score === b.score) {
            return b.timeTaken - a.timeTaken; // Higher time first when ascending score
        }
        return a.score - b.score;     
    } else {
        if (a.score === b.score) {
            return a.timeTaken - b.timeTaken; // Lower time first when descending score
        }
        return b.score - a.score;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 70) return "text-amber-400";
    return "text-zinc-300";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-emerald-400";
    if (score >= 70) return "bg-amber-400";
    if (score >= 40) return "bg-zinc-500";
    return "bg-rose-400/50";
  };

  return (
    <>
      <div className="bg-[#1c1c21] rounded-3xl border border-white/5 overflow-hidden shadow-xl mt-8 relative z-0">
        {/* Header Area */}
        <div className="p-8 flex items-center justify-between border-b border-white/5 bg-[#131316]/30">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Student Performance</h2>
            <p className="text-sm text-zinc-400">Individual results for {data.length} enrolled students.</p>
          </div>
          
          <button 
            onClick={() => setSortDirection(s => s === "desc" ? "asc" : "desc")}
            className="bg-[#09090b] border border-white/10 hover:border-white/20 transition-all rounded-full px-5 py-2.5 flex items-center gap-3 text-sm font-medium text-white shadow-xl"
          >
            <Filter className="w-4 h-4 text-zinc-400" />
            <span>Score: {sortDirection === "desc" ? "High to Low" : "Low to High"}</span>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Table Area */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[25%]">Student</th>
                  <th className="px-4 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[12%]">Score</th>
                  <th className="px-4 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[12%]">Time Spent</th>
                  <th className="px-4 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[20%]">Accuracy</th>
                  <th className="px-4 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold w-[15%]">Violations</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-right w-[15%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 pb-4">
                {sortedData.map((student, i) => {
                  const totalItems = questions?.length || (student.correctAnswers + student.wrongAnswers) || 1;
                  const attempted = student.correctAnswers + student.wrongAnswers;
                  
                  let accuracyColor = "bg-transparent";
                  if (attempted > 0) {
                    if (student.correctAnswers === attempted) accuracyColor = "bg-emerald-400";
                    else if (student.correctAnswers === 0) accuracyColor = "bg-rose-500";
                    else accuracyColor = "bg-amber-400";
                  }
                  const barWidth = attempted > 0 ? (attempted / totalItems) * 100 : 0;
  
                  const totalViolations = (student.tabSwitchCount || 0) + (student.copyPasteAttempts || 0) + (student.proctoringFlags || 0);
                    const nameToUse = student.username || (student as any).studentName || 'Unknown Student';
                    const initials = nameToUse.split(' ')
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  
                const avatarColors = [
                  'bg-indigo-500/20 text-indigo-300',
                  'bg-amber-500/20 text-amber-300',
                  'bg-emerald-500/20 text-emerald-300',
                  'bg-rose-500/20 text-rose-300',
                  'bg-cyan-500/20 text-cyan-300'
                ];
                const avatarClass = avatarColors[i % avatarColors.length];
                
                return (
                  <tr key={`${student.userId}-${student.completedAt}`} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarClass}`}>
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{student.username}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: #{student.userId.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-lg font-bold ${getScoreColor(student.score)}`}>
                        {Math.round(student.score)}%
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-zinc-300 text-sm font-mono">{formatTime(student.timeTaken)}</span>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                              className={`h-full rounded-full transition-all duration-500 ${accuracyColor}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {student.correctAnswers}/{totalItems}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 text-sm">
                          {totalViolations > 0 ? (
                              <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">{totalViolations}</span>
                          ): (
                              <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 font-bold border border-white/5">0</span>
                          )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Review</button>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.length > 0 && (
            <div className="px-8 py-5 border-t border-white/5 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              <span>Showing {data.length} of {data.length} students</span>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 disabled:opacity-30">&lt;</button>
                <button className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">1</button>
                <button className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center hover:bg-white/5 disabled:opacity-30">&gt;</button>
              </div>
            </div>
          )}
          {data.length === 0 && (
            <div className="px-8 py-12 text-center text-zinc-500 text-sm font-medium">
              No students have attempted this quiz yet.
            </div>
          )}
        </div>
      </div>

      {/* Review Modal Overlay */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
              <SharedQuizReview 
                report={{ 
                  ...selectedStudent, 
                  answers: selectedStudent.answers || [],
                  tabSwitchCount: selectedStudent.tabSwitchCount || 0,
                  copyPasteAttempts: selectedStudent.copyPasteAttempts || 0,
                  proctoringFlags: selectedStudent.proctoringFlags || 0
                }} 
                questions={questions} 
                onClose={() => setSelectedStudent(null)} 
              />
          </div>
        )}
      </AnimatePresence>
    </>
  );
}



