import React from "react";
import { LeaderboardWidget } from "@/components/leaderboard/LeaderboardWidget";

export default function LeaderboardPage() {
  return (
    <div className="container py-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Student Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See who's leading the pack! Compete for the top spot.
          </p>
        </div>

        <LeaderboardWidget
          limit={100}
          fullPage={true}
          onlyStudents={true}
          visualStyle="standard"
          autoRefresh={true}
          className="shadow-2xl border-primary/10"
        />
      </div>
    </div>
  );
}