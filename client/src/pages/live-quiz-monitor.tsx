import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quiz, Question as QuestionType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Square, Clock, Users, ArrowLeft, Eye,
  BarChart, CheckCircle2, AlertTriangle, Radio, Trophy, ShieldAlert, Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

interface Participant {
  userId: number;
  username: string;
  joinedAt: string;
  status: 'waiting' | 'verifying' | 'in_quiz' | 'submitted';
  score?: number;
  totalQuestions?: number;
  durationSeconds?: number;
  completedAt?: string;
  rank?: number;
}

export default function LiveQuizMonitorPage() {
  const [, params] = useRoute("/teacher/monitor/:quizId");
  const [, setLocation] = useLocation();
  const quizId = params?.quizId ? parseInt(params.quizId) : null;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
    refetchInterval: 4000,
  });

  const { data: statusData } = useQuery<any>({
    queryKey: [`/api/quizzes/${quizId}/status`],
    enabled: !!quizId,
    refetchInterval: 3000,
  });

  const activeSession = statusData?.activeSession;

  const { data: questions } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    enabled: !!quizId,
  });

  // Connect to WebSocket room for real-time state synchronization
  useEffect(() => {
    if (!quizId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          quizId,
          role: 'teacher',
          userId: user?.id,
          username: user?.username || 'Teacher',
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ROOM_SNAPSHOT' || msg.type === 'PARTICIPANTS_UPDATED' || msg.type === 'PARTICIPANT_STATUS_CHANGED' || msg.type === 'SUBMISSION_RECEIVED') {
          if (msg.participants) setParticipants(msg.participants);
          if (msg.leaderboard) setLeaderboard(msg.leaderboard);
        } else if (msg.type === 'SESSION_ENDED') {
          if (msg.participants) setParticipants(msg.participants);
          if (msg.leaderboard) setLeaderboard(msg.leaderboard);
        }
      } catch (err) {
        console.error('Teacher Monitor WS message parsing error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [quizId, user?.id, user?.username]);

  const startSessionMutation = useMutation({
    mutationFn: async (sessionName: string) => {
      setIsStarting(true);
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/sessions/start`, {
        sessionName: sessionName.trim(),
        duration: quiz?.duration || 30,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });

      // Notify room via WebSocket
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'LAUNCH_SESSION',
            quizId,
            sessionId: data.id,
            batchName: sessionNameInput.trim(),
          })
        );
      }

      toast({ title: "Live Session Launched", description: "Students in waiting room are now transitioning to quiz." });
      setIsStarting(false);
      setShowSessionDialog(false);
      setSessionNameInput("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to start session", description: error.message, variant: "destructive" });
      setIsStarting(false);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      setIsStopping(true);
      const res = await apiRequest("POST", `/api/quizzes/${quizId}/sessions/stop`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/status`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes/teacher"] });

      // Notify room via WebSocket
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'END_SESSION',
            quizId,
          })
        );
      }

      toast({ title: "Live Session Stopped", description: "The live session is now closed and immutable." });
      setIsStopping(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to stop session", description: error.message, variant: "destructive" });
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

  const getStatusBadge = (status: Participant['status']) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Waiting</span>;
      case 'verifying':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Camera Verification</span>;
      case 'in_quiz':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">In Quiz</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Submitted</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Connected</span>;
    }
  };

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

        {/* 1. Quiz Info Header Section */}
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

          {/* Active Batch Banner */}
          {isActive && activeSession && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Active Session Batch</span>
                  <span className="text-base font-bold text-white">{activeSession.sessionName}</span>
                </div>
              </div>
              <span className="text-xs text-emerald-300 font-medium">Session ID #{activeSession.id}</span>
            </div>
          )}


        </motion.div>

        {/* Phase 5 & 6: Waiting List (Pre-session) OR Live Leaderboard (Active Session) */}
        {!isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Waiting Room Queue ({participants.length})
              </h3>
              <span className="text-xs text-zinc-400 bg-[#131316] border border-white/5 px-3 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Pre-Session Queue
              </span>
            </div>

            {participants.length === 0 ? (
              <div className="bg-[#131316] rounded-xl p-8 text-center border border-white/5 space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400 font-medium">No students in waiting room yet.</p>
                <p className="text-xs text-zinc-600">Students actively present in the waiting room will appear here in real time.</p>
              </div>
            ) : (
              <div className="bg-[#131316] rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#18181c] text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 sm:p-4">Student Name</th>
                        <th className="p-3.5 sm:p-4">Join Time</th>
                        <th className="p-3.5 sm:p-4 text-right">Queue Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {participants.map((p) => (
                        <tr key={p.userId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 sm:p-4 font-semibold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {p.username.charAt(0).toUpperCase()}
                            </div>
                            <span>{p.username}</span>
                          </td>
                          <td className="p-3.5 sm:p-4 text-zinc-400 text-xs">
                            {p.joinedAt ? new Date(p.joinedAt).toLocaleTimeString() : 'Just now'}
                          </td>
                          <td className="p-3.5 sm:p-4 text-right">
                            {getStatusBadge(p.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Active Session Live Leaderboard
              </h3>
              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {leaderboard.length} Submissions
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="bg-[#131316] rounded-xl p-8 text-center border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
                <p className="text-sm text-indigo-300 font-bold">Session is Live!</p>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Students are currently taking the quiz. Rankings will populate on this live leaderboard in real-time as submissions arrive.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {leaderboard.map((item) => (
                    <motion.div
                      key={item.userId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="bg-[#131316] rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                          item.rank === 1 ? 'bg-amber-400 text-amber-950' : item.rank === 2 ? 'bg-zinc-300 text-zinc-950' : item.rank === 3 ? 'bg-amber-700 text-amber-100' : 'bg-white/5 text-zinc-400'
                        }`}>
                          #{item.rank}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.username}</div>
                          <div className="text-[11px] text-zinc-500">Completed at {item.completedAt ? new Date(item.completedAt).toLocaleTimeString() : ''}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-emerald-400 text-base">{item.score} pts</div>
                        <div className="text-[10px] text-zinc-500 font-medium">{item.durationSeconds || 0}s duration</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* 3. Controls Section */}
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
                {isStopping ? "Stopping..." : "Stop Session"}
              </Button>
            ) : (
              <Button
                className="flex-1 h-14 rounded-xl text-base font-bold gap-2"
                style={{
                  background: "linear-gradient(135deg, hsl(145 63% 42%), hsl(180 70% 40%))",
                  color: "white",
                }}
                onClick={() => setShowSessionDialog(true)}
                disabled={isStarting}
              >
                <Play className="w-5 h-5" />
                {isStarting ? "Launching..." : "Launch Live Session"}
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

      {/* Launch Session Dialog Modal */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-md bg-[#1c1c21] border-indigo-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" />
              Launch Live Session
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Enter a Session / Batch Name for this Live Quiz event. Students in waiting room will transition into camera verification and start the quiz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Session Name (Batch Name)
              </label>
              <Input
                value={sessionNameInput}
                onChange={(e) => setSessionNameInput(e.target.value)}
                placeholder="e.g. CE Batch A, Division B, Placement Round 1"
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && sessionNameInput.trim()) {
                    startSessionMutation.mutate(sessionNameInput);
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSessionDialog(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!sessionNameInput.trim() || isStarting}
              onClick={() => startSessionMutation.mutate(sessionNameInput)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold"
            >
              {isStarting ? "Launching..." : "Launch Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}