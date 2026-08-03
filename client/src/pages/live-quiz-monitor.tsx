import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Play, Square, Clock, Users, ArrowLeft, Eye,
  BarChart, CheckCircle2, AlertTriangle, Radio
} from "lucide-react";
import { useState } from "react";

export default function LiveQuizMonitorPage() {
  const [, params] = useRoute("/teacher/monitor/:quizId");
  const [, setLocation] = useLocation();
  const quizId = params?.quizId ? parseInt(params.quizId) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
    refetchInterval: 5000,
  });

  const { data: questions } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    enabled: !!quizId,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      setIsStarting(true);
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/start`, {
        duration: quiz?.duration || 30,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({ title: "Quiz Started", description: "Students can now take this quiz." });
      setIsStarting(false);
    },
    onError: (error) => {
      toast({ title: "Failed to start quiz", description: error.message, variant: "destructive" });
      setIsStarting(false);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      setIsStopping(true);
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/end`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });
      toast({ title: "Quiz Stopped", description: "The quiz is no longer active." });
      setIsStopping(false);
    },
    onError: (error) => {
      toast({ title: "Failed to stop quiz", description: error.message, variant: "destructive" });
      setIsStopping(false);
    },
  });

  if (isLoading || !quiz) {
    return (
      <div className="min-h-screen bg-[#131316] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-300/20 border-t-indigo-300 animate-spin" />
      </div>
    );
  }

  const isActive = quiz.isActive && quiz.isStarted;
  const timeRemaining = quiz.endTime
    ? Math.max(0, Math.floor((new Date(quiz.endTime).getTime() - Date.now()) / 1000))
    : 0;
  const minutesLeft = Math.floor(timeRemaining / 60);
  const secondsLeft = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-[#131316] text-white p-4 sm:p-6 md:p-8 font-sans relative overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-[20%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={() => setLocation("/teacher")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-bold text-red-400">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Radio className="w-5 h-5 text-indigo-300" />
            <h1
              className="text-xl sm:text-2xl font-extrabold text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Live Quiz Monitor
            </h1>
          </div>

          <h2 className="text-lg font-bold text-white mb-2">{quiz.title}</h2>
          <p className="text-sm text-zinc-400 mb-6">{quiz.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#131316] rounded-xl p-4 border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-white">{questions?.length || 0}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Questions</div>
            </div>
            <div className="bg-[#131316] rounded-xl p-4 border border-white/5 text-center">
              <div className="text-2xl font-extrabold text-white">{quiz.duration || 30}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Minutes</div>
            </div>
            <div className="bg-[#131316] rounded-xl p-4 border border-white/5 text-center">
              <div className="text-2xl font-extrabold capitalize text-white">{quiz.difficulty}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Difficulty</div>
            </div>
            <div className="bg-[#131316] rounded-xl p-4 border border-white/5 text-center">
              <div className={`text-2xl font-extrabold ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isActive ? 'Active' : 'Stopped'}
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Status</div>
            </div>
          </div>

          {/* Time remaining for active quizzes */}
          {isActive && timeRemaining > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-300" />
                <span className="text-sm text-indigo-200 font-medium">Time Remaining</span>
              </div>
              <span className="text-xl font-extrabold text-indigo-300 tabular-nums">
                {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </span>
            </div>
          )}
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-300" />
            Controls
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            {isActive ? (
              <Button
                className="flex-1 h-14 rounded-xl text-base font-bold gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(0 72% 51%), hsl(20 90% 50%))",
                  color: "white",
                }}
                onClick={() => stopMutation.mutate()}
                disabled={isStopping}
              >
                <Square className="w-5 h-5" />
                {isStopping ? "Stopping..." : "Stop Quiz"}
              </Button>
            ) : (
              <Button
                className="flex-1 h-14 rounded-xl text-base font-bold gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(145 63% 42%), hsl(180 70% 40%))",
                  color: "white",
                }}
                onClick={() => startMutation.mutate()}
                disabled={isStarting}
              >
                <Play className="w-5 h-5" />
                {isStarting ? "Starting..." : "Start Quiz"}
              </Button>
            )}

            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl text-base font-bold gap-2 bg-[#131316] border-white/10 text-white hover:bg-white/5"
              onClick={() => setLocation(`/quiz-analytics/${quizId}`)}
            >
              <BarChart className="w-5 h-5" />
              View Analytics
            </Button>
          </div>
        </motion.div>

        {/* Quiz Info Badges */}
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
          <span className="bg-[#1c1c21] border border-white/5 px-3 py-1.5 rounded-full">
            Quiz ID: {quiz.id}
          </span>
          <span className="bg-[#1c1c21] border border-white/5 px-3 py-1.5 rounded-full capitalize">
            Type: {quiz.quizType}
          </span>
          <span className="bg-[#1c1c21] border border-white/5 px-3 py-1.5 rounded-full">
            {quiz.isPublic ? "Public" : "Private"}
          </span>
          {quiz.startTime && (
            <span className="bg-[#1c1c21] border border-white/5 px-3 py-1.5 rounded-full">
              Started: {new Date(quiz.startTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}