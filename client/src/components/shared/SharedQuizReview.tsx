import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, XCircle } from 'lucide-react';

interface SharedQuizReviewProps {
  report: {
    username: string;
    score: number;
    correctAnswers: number;
    timeTaken: number;
    answers: string[];
    tabSwitchCount: number;
    copyPasteAttempts: number;
    proctoringFlags: number;
  };
  questions: any[];
  onClose: () => void;
}

export function SharedQuizReview({ report, questions, onClose }: SharedQuizReviewProps) {
  const [activeTab, setActiveTab] = useState<'answers' | 'violations'>('answers');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="bg-[#1c1c21] rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden"
    >
      {/* Modal Header */}
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-[#131316] shrink-0">
         <div>
            <h3 className="text-2xl font-bold text-white mb-2">{report.username}'s Submission</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
               <span>Score: <span className={getScoreColor(report.score)}>{report.score}%</span></span>
               <span>�</span>
               <span>Correct: {report.correctAnswers}</span>
               <span>�</span>
               <span>Time: {formatTime(report.timeTaken)}</span>
            </div>
         </div>
         <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
         >
            <X className="w-5 h-5 text-white" />
         </button>
      </div>

      {/* Modal Content - Tabs */}
      <div className="bg-[#1c1c21] pt-4 px-4 md:px-8 border-b border-white/5 flex gap-8 text-xs font-bold uppercase tracking-widest overflow-x-auto shrink-0">
         <button 
            onClick={(e) => { e.stopPropagation(); setActiveTab('answers'); }}
            className={`pb-4 px-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'answers' ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-white'}`}
         >
           Answers Selected
         </button>
         <button 
            onClick={(e) => { e.stopPropagation(); setActiveTab('violations'); }}
            className={`pb-4 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'violations' ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-white'}`}
         >
           Violations
           {((report.tabSwitchCount || 0) + (report.copyPasteAttempts || 0) + (report.proctoringFlags || 0)) > 0 && (
              <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/20">
                   {(report.tabSwitchCount || 0) + (report.copyPasteAttempts || 0) + (report.proctoringFlags || 0)}
              </span>
           )}
         </button>
      </div>
      
      {/* Modal Content - Dynamic Array */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
         {activeTab === 'answers' ? (
            <div className="space-y-6">
               {questions && questions.length > 0 ? (
                  questions.map((q, idx) => {
                     const studentAnswer = report.answers?.[idx];
                     const isRight = studentAnswer === q.correctAnswer;
                     const hasAttempted = studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== "";

                     return (
                       <div key={q.id || idx} className="bg-[#131316] rounded-2xl p-6 border border-white/5">
                          <div className="flex items-start justify-between mb-4 gap-4">
                             <h4 className="text-lg font-bold text-white"><span className="text-zinc-600 mr-2">{idx + 1}.</span>{q.questionText}</h4>
                             {hasAttempted ? (
                                isRight ? (
                                   <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mt-1">
                                      <Check className="w-4 h-4 text-emerald-400" />
                                   </div>
                                ) : (
                                   <div className="w-8 h-8 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mt-1">
                                      <XCircle className="w-4 h-4 text-rose-400" />
                                   </div>
                                )
                             ) : (
                                <div className="px-3 py-1 shrink-0 rounded-full bg-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">
                                   Skipped
                                </div>
                             )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                             {Array.isArray(q.options) ? q.options.map((opt: string, oIdx: number) => {
                                const isCheckedByStudent = opt === studentAnswer;
                                const isActuallyCorrect = opt === q.correctAnswer;

                                let optionClass = "bg-[#1c1c21] border border-white/5 text-zinc-400";
                                if (isCheckedByStudent && isActuallyCorrect) {
                                   optionClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300";
                                } else if (isCheckedByStudent && !isActuallyCorrect) {
                                   optionClass = "bg-rose-500/10 border-rose-500/50 text-rose-300";
                                } else if (!isCheckedByStudent && isActuallyCorrect) {
                                   optionClass = "bg-emerald-500/5 border-emerald-500/30 text-emerald-500/70 border-dashed border-2";
                                }

                                return (
                                   <div key={oIdx} className={`${optionClass} p-4 rounded-xl flex items-center justify-between text-sm font-medium`}>
                                      <span>{opt}</span>
                                      {isCheckedByStudent && <div className="w-2 h-2 rounded-full bg-current" />}
                                   </div>
                                );
                             }) : (
                               <div className="text-sm text-zinc-500 italic">No options available for this format. User answered: <span className="text-white font-mono">{studentAnswer}</span></div>
                             )}
                          </div>
                          
                          {!isRight && hasAttempted && q.explanation && (
                             <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                                <span className="font-bold mr-2 uppercase text-[10px] tracking-widest text-indigo-400">Explanation:</span>
                                {q.explanation}
                             </div>
                          )}
                       </div>
                     );
                  })
               ) : (
                  <div className="text-center text-zinc-500 py-12">
                     No detailed question data was loaded for this submission.
                  </div>
               )}
            </div>
         ) : (
            <div className="space-y-6">
               <h3 className="text-xl font-bold text-white mb-6">Violations Review</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Violation Widgets */}
                  <div className="bg-[#1c1c21] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 mb-8 text-rose-400">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>
                          </div>
                          <span className="font-bold text-sm tracking-wide">Tab Switching</span>
                      </div>
                      <div className="text-4xl font-black text-white">{report.tabSwitchCount || 0}</div>
                  </div>
                  
                  <div className="bg-[#1c1c21] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 mb-8 text-amber-400">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </div>
                          <span className="font-bold text-sm tracking-wide">Copy / Paste</span>
                      </div>
                      <div className="text-4xl font-black text-white">{report.copyPasteAttempts || 0}</div>
                  </div>
                  
                  <div className="bg-[#1c1c21] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 mb-8 text-indigo-400">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </div>
                          <span className="font-bold text-sm tracking-wide">Proctoring Flags</span>
                      </div>
                      <div className="text-4xl font-black text-white">{report.proctoringFlags || 0}</div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </motion.div>
  );
}
