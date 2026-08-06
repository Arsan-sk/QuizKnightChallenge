import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, Result } from "@shared/schema";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Loader2, Search, BookOpen, Key, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface QuizWithTeacher extends Quiz {
  teacherName: string;
}

export default function QuizBrowse() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [quizTypeFilter, setQuizTypeFilter] = useState<string>("all");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: quizzes, isLoading } = useQuery<QuizWithTeacher[]>({
    queryKey: ["/api/quizzes/public"],
  });

  const { data: results } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
    enabled: !!user,
  });

  const joinByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      setIsJoining(true);
      const res = await apiRequest("POST", "/api/quizzes/join-by-code", {
        accessCode: code.trim().toUpperCase(),
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setIsJoining(false);
      setShowJoinModal(false);
      setJoinCodeInput("");
      toast({
        title: "Quiz Joined!",
        description: `Redirecting to "${data.title}"...`,
        variant: "info",
      });
      setLocation(`/student/quiz/${data.quizId}`);
    },
    onError: (error: any) => {
      setIsJoining(false);
      toast({
        title: "Failed to Join Quiz",
        description: error.message || "Invalid quiz access code.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  // Filter quizzes: sort newest first, filter by unattempted, search, difficulty, quizType
  const attemptedQuizIds = new Set(results?.map((r) => r.quizId) || []);

  const sortedQuizzes = [...(quizzes || [])].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA; // Newest first
  });

  const availableQuizzes = sortedQuizzes.filter((quiz) => !attemptedQuizIds.has(quiz.id));

  const filteredQuizzes = availableQuizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "all" || quiz.difficulty === difficulty;

    const matchesQuizType =
      quizTypeFilter === "all" || quiz.quizType === quizTypeFilter;

    return matchesSearch && matchesDifficulty && matchesQuizType;
  });

  return (
    <div className="min-h-screen bg-mesh-primary text-white p-4 sm:p-6 md:p-8 font-sans pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Browse Available Quizzes
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Discover new assessments or enter a unique quiz code to begin immediately.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#1c1c21] border border-white/5 px-4 py-2 rounded-full">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{filteredQuizzes.length} Quizzes Available</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 bg-[#1c1c21] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-xl">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm focus-visible:ring-indigo-500/50"
              />
            </div>

            {/* Difficulty Filter */}
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c21] border-zinc-800 text-white">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Quiz Type Filter */}
            <Select value={quizTypeFilter} onValueChange={setQuizTypeFilter}>
              <SelectTrigger className="bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm">
                <SelectValue placeholder="Quiz Type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c21] border-zinc-800 text-white">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="live">Live Quiz</SelectItem>
              </SelectContent>
            </Select>

            {/* Join Quiz Action Button */}
            <Button
              onClick={() => setShowJoinModal(true)}
              className="h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20"
            >
              <Key className="w-4 h-4 mr-2" />
              Join Quiz
            </Button>
          </div>
        </motion.div>

        {/* Quizzes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              actionLabel="Take Quiz"
              actionPath={`/student/quiz/${quiz.id}`}
              teacherName={quiz.teacherName}
            />
          ))}
        </div>

        {filteredQuizzes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-[#1c1c21] rounded-2xl border border-white/5 space-y-4"
          >
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">No Available Quizzes Found</h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                No unattempted quizzes match your search or filters. If your instructor gave you an access code, click "Join Quiz" above.
              </p>
            </div>
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              className="bg-transparent border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-full"
            >
              <Key className="w-4 h-4 mr-2" /> Enter Quiz Code
            </Button>
          </motion.div>
        )}
      </div>

      {/* Join Quiz Dialog Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md bg-[#1c1c21] border-indigo-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Join Quiz by Code
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Enter the unique 6-character access code provided by your teacher (e.g. QK8M2P).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Quiz Access Code
              </label>
              <Input
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. QK8M2P"
                maxLength={8}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500 font-mono text-center tracking-widest text-lg h-12 uppercase font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCodeInput.trim()) {
                    joinByCodeMutation.mutate(joinCodeInput);
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowJoinModal(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!joinCodeInput.trim() || isJoining}
              onClick={() => joinByCodeMutation.mutate(joinCodeInput)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6"
            >
              {isJoining ? "Joining..." : "Join Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}