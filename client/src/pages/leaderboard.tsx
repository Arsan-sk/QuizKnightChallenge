import React from "react";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#131316] font-sans text-white p-6 md:p-12 overflow-x-hidden relative">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-[-10%] w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="mb-16 md:mb-24">
          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-4">
             Global Ranking
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-300">Champions</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl leading-relaxed text-lg">
            The digital sanctuary for our most elite learners. Rankings are calculated based on accuracy, speed, and consistency across all modules.
          </p>
        </div>

        <LeaderboardWidget
          limit={100}
          fullPage={true}
          onlyStudents={true}
        />
      </div>
    </div>
  );
}