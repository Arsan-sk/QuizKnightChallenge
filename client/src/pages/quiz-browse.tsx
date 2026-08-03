import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quiz, Result } from "@shared/schema";
import { QuizCard } from "@/components/quiz/QuizCard";
import { Loader2, Search, SlidersHorizontal, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizWithTeacher extends Quiz {
  teacherName: string;
}

export default function QuizBrowse() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const { user } = useAuth();

  const { data: quizzes, isLoading } = useQuery<QuizWithTeacher[]>({
    queryKey: ["/api/quizzes/public"],
  });

  const { data: results } = useQuery<Result[]>({
    queryKey: ["/api/results/user"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  const filteredQuizzes = quizzes?.filter((quiz) => {
    const matchesSearch = 
      quiz.title.toLowerCase().includes(search.toLowerCase()) ||
      quiz.description.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty = 
      difficulty === "all" || quiz.difficulty === difficulty;

    const matchesTeacher = 
      !teacherFilter || 
      (quiz.teacherName && quiz.teacherName.toLowerCase().includes(teacherFilter.toLowerCase()));

    return matchesSearch && matchesDifficulty && matchesTeacher;
  });

  const teachers = (Array.from(new Set(quizzes?.map(quiz => quiz.teacherName).filter(Boolean) || [])) as string[]).sort();

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
                Browse Quizzes
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Discover and take public quizzes created by teachers.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-[#1c1c21] border border-white/5 px-4 py-2 rounded-full w-fit">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{filteredQuizzes?.length || 0} Quizzes Available</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 bg-[#1c1c21] p-4 sm:p-5 rounded-2xl border border-white/5 shadow-xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm focus-visible:ring-indigo-500/50"
              />
            </div>

            <Select
              value={difficulty}
              onValueChange={setDifficulty}
            >
              <SelectTrigger className="bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-[#1c1c21] border-zinc-800 text-white">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Input
                placeholder="Search by teacher..."
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                list="teachers"
                className="bg-[#131316] border-white/5 text-white h-11 rounded-xl text-sm focus-visible:ring-indigo-500/50"
              />
              <datalist id="teachers">
                {teachers.map((teacher) => (
                  <option key={teacher} value={teacher} />
                ))}
              </datalist>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredQuizzes?.map((quiz) => {
            const alreadyAttempted = results?.some(r => r.quizId === quiz.id) || false;

            return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                actionLabel={alreadyAttempted ? "See Results" : "Take Quiz"}
                actionPath={alreadyAttempted ? `/student/quiz/${quiz.id}?view=results` : `/student/quiz/${quiz.id}`}
                teacherName={quiz.teacherName}
              />
            );
          })}
        </div>

        {(!filteredQuizzes || filteredQuizzes.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-[#1c1c21] rounded-2xl border border-white/5"
          >
            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Quizzes Found</h3>
            <p className="text-zinc-400 text-sm">
              No quizzes match your current filter criteria.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}