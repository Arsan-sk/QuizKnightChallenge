import { useState, useEffect, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Question } from "@/components/quiz/Question";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Info,
  ListChecks,
  Settings2,
  Eye,
  Trash2,
  Smile,
  Brain,
  Zap,
  CheckCircle2,
  Circle,
  Lock,
  Save,
  Globe,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Quiz, Question as QuestionType } from "@shared/schema";

const quizFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  subject: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isPublic: z.boolean(),
  quizType: z.enum(["standard", "live"]),
  duration: z.number().optional(),
  targetYear: z.string().optional(),
  targetBranch: z.string().optional()
});

const MemoizedQuestion = memo(Question, (prevProps, nextProps) => {
  if (prevProps.mode === 'edit' && nextProps.mode === 'edit') {
    if (prevProps.question?.id !== nextProps.question?.id) return false;
    return true;
  }
  return false;
});

export default function QuizCreate() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formValid, setFormValid] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(!isEditMode);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      difficulty: "easy" as "easy" | "medium" | "hard",
      isPublic: true,
      quizType: "standard" as "standard" | "live",
      duration: 30,
    },
    mode: "onChange"
  });

  const { watch, setValue, reset } = form;
  const watchTitle = watch("title");
  const watchDescription = watch("description");
  const watchDifficulty = watch("difficulty");
  const watchType = watch("quizType");
  const watchIsPublic = watch("isPublic");

  // Fetch existing quiz data in edit mode
  const { data: existingQuiz } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/${editId}`],
    enabled: isEditMode,
  });

  const { data: existingQuestions } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${editId}/questions`],
    enabled: isEditMode,
  });

  // Pre-populate form when edit data loads
  useEffect(() => {
    if (isEditMode && existingQuiz && !dataLoaded) {
      reset({
        title: existingQuiz.title || "",
        description: existingQuiz.description || "",
        subject: (existingQuiz as any).subject || "",
        difficulty: (existingQuiz.difficulty as "easy" | "medium" | "hard") || "easy",
        isPublic: existingQuiz.isPublic ?? true,
        quizType: (existingQuiz.quizType as "standard" | "live") || "standard",
        duration: existingQuiz.duration || 30,
      });
      setDataLoaded(true);
    }
  }, [isEditMode, existingQuiz, dataLoaded, reset]);

  // Pre-populate questions when they load
  useEffect(() => {
    if (isEditMode && existingQuestions && existingQuestions.length > 0 && questions.length === 0 && dataLoaded) {
      setQuestions(existingQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || ["", "", "", ""],
        correctAnswer: q.correctAnswer,
        points: q.points || 2,
        imageUrl: q.imageUrl,
        optionImages: q.optionImages,
      })));
    }
  }, [isEditMode, existingQuestions, dataLoaded, questions.length]);

  useEffect(() => {
    setFormValid(watchTitle.trim().length > 0);
  }, [watchTitle]);

  const createQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      const quiz = await res.json();
      for (const question of questions) {
        await apiRequest("POST", `/api/quizzes/${quiz.id}/questions`, question);
      }
      return quiz;
    },
    onSuccess: () => {
      toast({ title: "Quiz Created", description: "Your quiz is now live." });
      setLocation("/teacher");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create quiz", variant: "destructive" });
    }
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/quizzes/${editId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Quiz Updated", description: "Your changes have been saved." });
      setLocation("/teacher");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update quiz", variant: "destructive" });
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditMode) {
        const res = await apiRequest("PUT", `/api/quizzes/${editId}`, { ...data, isDraft: true });
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/quizzes", { ...data, isDraft: true });
        const quiz = await res.json();
        for (const question of questions) {
          await apiRequest("POST", `/api/quizzes/${quiz.id}/questions`, question);
        }
        return quiz;
      }
    },
    onSuccess: () => {
      toast({ title: "Draft Saved", description: "Your quiz has been saved as a draft." });
      setLocation("/teacher");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    }
  });

  const addQuestion = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setQuestions(prev => [...prev, {
      questionText: "",
      questionType: "mcq",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 2,
    }]);
  }, []);

  const updateQuestion = useCallback((index: number, question: any) => {
    setQuestions(prev => {
      const newQ = [...prev];
      newQ[index] = { ...newQ[index], ...question };
      return newQ;
    });
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuestions(questions => questions.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (data: any) => {
    if (!isEditMode && questions.length === 0) {
      toast({
        title: "No questions added",
        description: "Please add at least one question to your quiz",
        variant: "destructive"
      });
      setCurrentStep(2);
      return;
    }

    if (!isEditMode) {
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].correctAnswer) {
          toast({
            title: "Missing correct answer",
            description: `Question ${i + 1} does not have a correct answer selected.`,
            variant: "destructive"
          });
          setCurrentStep(2);
          return;
        }
      }
    }

    if (isEditMode) {
      updateQuizMutation.mutate({ ...data, isDraft: false });
    } else {
      createQuizMutation.mutate({ ...data, isDraft: false });
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveDraftMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(curr => curr + 1);
    else form.handleSubmit(handleSubmit)();
  };

  const getStepText = (step: number) => {
    switch (step) {
      case 1: return isEditMode
        ? "Update the core identity of your quiz. Quiz type cannot be changed."
        : "Define the core identity of your challenge. Set the tone and difficulty for your students.";
      case 2: return isEditMode
        ? "Review your questions. Questions cannot be modified after creation."
        : "Develop engaging questions. Add media and set the correct answers.";
      case 3: return "Configure time limits, public access, and live participation rules.";
      default: return "";
    }
  };

  const stepLabels = [
    { id: 1, label: "1. Info", icon: Info },
    { id: 2, label: "2. Questions", icon: ListChecks },
    { id: 3, label: "3. Settings", icon: Settings2 }
  ];

  const isPending = createQuizMutation.isPending || updateQuizMutation.isPending || saveDraftMutation.isPending;

  const renderInfoStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
      {/* Left Column: Form Fields */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-indigo-300 rounded-full shadow-[0_0_10px_rgba(165,180,252,0.5)]" />
            <h2 className="text-xl font-bold text-white">Basic Information</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">QUIZ TITLE</label>
              <Input
                {...form.register("title")}
                placeholder="e.g., Quantum Mechanics Fundamentals"
                className="bg-[#131316] border-white/5 text-white h-14 rounded-xl focus-visible:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">DESCRIPTION</label>
              <Textarea
                {...form.register("description")}
                placeholder="Explain the learning objectives and scope of this quiz..."
                className="bg-[#131316] border-white/5 text-white min-h-[120px] rounded-xl focus-visible:ring-indigo-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">SUBJECT</label>
                <Input
                  {...form.register("subject")}
                  placeholder="e.g. Physics, Computer Science, Biology, History..."
                  className="bg-[#131316] border-white/5 text-white h-14 rounded-xl focus-visible:ring-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">LANGUAGE</label>
                <Select defaultValue="en">
                  <SelectTrigger className="bg-[#131316] border-white/5 text-white h-14 rounded-xl">
                    <SelectValue placeholder="English (US)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c21] border-zinc-800 text-white">
                    <SelectItem value="en">English (US)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#f59e0b] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <h2 className="text-xl font-bold text-white">Difficulty Level</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-8">This determines the adaptive logic applied to questions.</p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Easy */}
            <button 
              type="button"
              onClick={() => setValue("difficulty", "easy")}
              className={`relative h-28 sm:h-40 rounded-2xl border flex flex-col items-center justify-center gap-2 sm:gap-4 transition-all ${
                watchDifficulty === 'easy' 
                  ? 'bg-[#1e293b]/50 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-[#131316] border-white/5 hover:border-white/10'
              }`}
            >
              {watchDifficulty === 'easy' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-white text-[10px] border-[3px] border-[#1c1c21]">
                  ✓
                </div>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-sm sm:text-base">Easy</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1 hidden sm:block">FUNDAMENTALS</p>
              </div>
            </button>

            {/* Medium */}
            <button 
              type="button"
              onClick={() => setValue("difficulty", "medium")}
              className={`relative h-28 sm:h-40 rounded-2xl flex flex-col items-center justify-center gap-2 sm:gap-4 transition-all ${
                watchDifficulty === 'medium' 
                  ? 'bg-indigo-300 border-[3px] border-indigo-200 shadow-[0_0_30px_rgba(165,180,252,0.3)]' 
                  : 'bg-[#131316] border border-white/5 hover:border-white/10'
              }`}
            >
              {watchDifficulty === 'medium' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-[#42331c] font-bold text-[10px] border-[3px] border-[#1c1c21] z-10">
                  ✓
                </div>
              )}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${watchDifficulty === 'medium' ? 'bg-[#1c1c21]/10' : 'bg-indigo-500/20'}`}>
                <Brain className={`w-5 h-5 sm:w-6 sm:h-6 ${watchDifficulty === 'medium' ? 'text-indigo-950' : 'text-indigo-400'}`} />
              </div>
              <div className="text-center">
                <p className={`font-bold text-sm sm:text-base ${watchDifficulty === 'medium' ? 'text-indigo-950' : 'text-white'}`}>Medium</p>
                <p className={`text-[9px] uppercase tracking-widest mt-1 hidden sm:block ${watchDifficulty === 'medium' ? 'text-indigo-900/60 font-bold' : 'text-zinc-500'}`}>STANDARD</p>
              </div>
            </button>

            {/* Hard */}
            <button 
              type="button"
              onClick={() => setValue("difficulty", "hard")}
              className={`relative h-28 sm:h-40 rounded-2xl border flex flex-col items-center justify-center gap-2 sm:gap-4 transition-all ${
                watchDifficulty === 'hard' 
                  ? 'bg-[#3f1d1d]/50 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                  : 'bg-[#131316] border-white/5 hover:border-white/10'
              }`}
            >
              {watchDifficulty === 'hard' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-white text-[10px] border-[3px] border-[#1c1c21]">
                  ✓
                </div>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white text-sm sm:text-base">Hard</p>
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 mt-1 hidden sm:block">ADVANCED</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Tips & Preview */}
      <div className="space-y-6">
        {/* Teacher Tip Card */}
        <div className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-300 to-[#a855f7]" />
          
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-5">
            <Lightbulb className="w-5 h-5 text-indigo-200" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isEditMode ? "Editing Tips" : "Teacher Tip"}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            {isEditMode
              ? "You can update the title, description, difficulty, and visibility. Questions and quiz type cannot be changed after creation."
              : "A clear, descriptive title helps students find your quiz in the library. Use the description to set expectations about time limits and question types."}
          </p>
          
          <div className="bg-[#131316] rounded-2xl p-5 border border-white/5">
            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-4">CHECKLIST</p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-zinc-300 items-start">
                {watchTitle.length > 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />}
                <span>Title entered</span>
              </li>
              <li className="flex gap-3 text-sm text-zinc-300 items-start">
                {watchDescription.length >= 20 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />}
                <span>Minimum 20 char description</span>
              </li>
              <li className="flex gap-3 text-sm text-zinc-300 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Subject categorized</span>
              </li>
              {isEditMode && (
                <li className="flex gap-3 text-sm text-zinc-400 items-start">
                  <Lock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                  <span>Quiz type locked</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Dummy Quiz Preview Card */}
        <div className="bg-[#1c1c21] rounded-[2rem] p-6 border border-white/5 shadow-xl hidden lg:block">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-4 ml-2">QUIZ CARD PREVIEW</p>
          <div className="bg-[#131316] rounded-2xl overflow-hidden border border-white/5 aspect-square flex flex-col">
            <div className="h-1/2 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] relative p-4 flex flex-col justify-end">
              <Badge className="bg-[#f59e0b] text-[#42331c] hover:bg-[#f59e0b] font-bold uppercase text-[9px] self-start border-none">PHYSICS</Badge>
            </div>
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-end pb-6">
               <div className="w-3/4 h-4 bg-white/10 rounded-full" />
               <div className="w-full h-3 bg-white/5 rounded-full" />
               <div className="flex justify-between items-center mt-4">
                 <div className="flex gap-1">
                   <div className="w-4 h-4 rounded-full bg-white/10" />
                   <div className="w-4 h-4 rounded-full bg-white/10" />
                 </div>
                 <div className="w-12 h-3 bg-white/10 rounded-full" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestionsStep = () => (
    <div className="space-y-6 pb-16">
      <div className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
           <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {isEditMode ? "Questions (Read Only)" : "Add Questions"}
              </h2>
              <p className="text-zinc-400 text-sm">
                {isEditMode
                  ? "Questions, options, and correct answers cannot be modified after creation."
                  : "Create specific challenges for your students."}
              </p>
           </div>
           {!isEditMode && (
             <Button onClick={addQuestion} className="bg-white/10 hover:bg-white/20 text-white rounded-full">
               <Plus className="w-4 h-4 mr-2" /> Add Question
             </Button>
           )}
        </div>

        {questions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-[#131316] rounded-full mx-auto flex items-center justify-center mb-4">
               <ListChecks className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isEditMode ? "No Questions Found" : "No Questions Yet"}
            </h3>
            <p className="text-zinc-500 mb-6">
              {isEditMode ? "This quiz has no questions." : "Start building your quiz by adding the first question."}
            </p>
            {!isEditMode && (
              <Button onClick={addQuestion} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-8 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                Create First Question
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {isEditMode && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-amber-200">
                  Questions are locked after quiz creation. You can update title, description, difficulty, and visibility from the Info and Settings tabs.
                </p>
              </div>
            )}
            {questions.map((question, index) => (
              <div key={question.id || index} className="bg-[#131316] rounded-2xl border border-white/5 p-1 relative">
                {isEditMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <Lock className="w-4 h-4 text-zinc-600" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4 p-4 pb-0">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-none font-bold">Question {index + 1}</Badge>
                </div>
                <MemoizedQuestion
                  question={question}
                  onChange={isEditMode ? () => {} : (q: any) => updateQuestion(index, q)}
                  onRemove={isEditMode ? undefined : () => removeQuestion(index)}
                  mode={isEditMode ? "take" : "edit"}
                />
              </div>
            ))}
            {!isEditMode && (
              <div className="flex justify-center mt-8">
                <Button onClick={addQuestion} variant="outline" className="border-dashed border-white/10 text-zinc-400 hover:text-white bg-transparent hover:bg-white/5 rounded-xl px-12 py-8 h-auto">
                  <Plus className="w-4 h-4 mr-2" /> Add Another Question
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
       <div className="bg-[#1c1c21] rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-xl font-bold text-white">Quiz Settings</h2>
          </div>
          
          <div className="space-y-8">
             <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">QUIZ MODE</label>
                  {isEditMode && <Lock className="w-3 h-3 text-zinc-600" />}
                </div>
                {isEditMode ? (
                  <div className="bg-[#131316] border-white/5 text-zinc-400 h-14 rounded-xl flex items-center px-4 border cursor-not-allowed">
                    {watchType === "live" ? "Live Event (Teacher Controlled)" : "Standard (Always Available)"}
                    <Lock className="w-4 h-4 text-zinc-600 ml-auto" />
                  </div>
                ) : (
                  <Select onValueChange={(val) => setValue("quizType", val as "standard"|"live")} defaultValue={watchType}>
                    <SelectTrigger className="bg-[#131316] border-white/5 text-white h-14 rounded-xl">
                      <SelectValue placeholder="Select Quiz Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1c21] border-zinc-800 text-white">
                      <SelectItem value="standard">Standard (Always Available)</SelectItem>
                      <SelectItem value="live">Live Event (Teacher Controlled)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
             </div>

             {watchType === 'live' && (
               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">TIME DURATION (MINUTES)</label>
                  <Input type="number" {...form.register('duration', { valueAsNumber: true })} className="bg-[#131316] border-white/5 text-white h-14 rounded-xl focus-visible:ring-indigo-500/50" />
               </div>
             )}

             <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  QUIZ VISIBILITY
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Create Public Quiz */}
                  <button
                    type="button"
                    onClick={() => setValue("isPublic", true)}
                    className={`relative p-5 sm:p-6 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 ${
                      watchIsPublic === true
                        ? "bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.15)] text-white"
                        : "bg-[#131316] border-2 border-white/5 hover:border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${watchIsPublic === true ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-zinc-500'}`}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-base ${watchIsPublic === true ? 'text-white' : 'text-zinc-300'}`}>
                            Create Public Quiz
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Discoverable</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${watchIsPublic === true ? 'bg-indigo-400 text-indigo-950 font-bold' : 'border-2 border-zinc-600'}`}>
                        {watchIsPublic === true && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      The quiz is publicly visible. Students can discover it from the Browse Quiz section and anyone with access can attempt it.
                    </p>
                  </button>

                  {/* Option 2: Create Private Quiz */}
                  <button
                    type="button"
                    onClick={() => setValue("isPublic", false)}
                    className={`relative p-5 sm:p-6 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 ${
                      watchIsPublic === false
                        ? "bg-purple-500/10 border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.15)] text-white"
                        : "bg-[#131316] border-2 border-white/5 hover:border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${watchIsPublic === false ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-zinc-500'}`}>
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-base ${watchIsPublic === false ? 'text-white' : 'text-zinc-300'}`}>
                            Create Private Quiz
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Join Code Only</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${watchIsPublic === false ? 'bg-purple-400 text-purple-950 font-bold' : 'border-2 border-zinc-600'}`}>
                        {watchIsPublic === false && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      The quiz is hidden from the Browse Quiz section. It is intended for selected students only and can be accessed only using your shared Join Code.
                    </p>
                  </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  if (isEditMode && !dataLoaded) {
    return (
      <div className="min-h-screen bg-[#131316] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-300/20 border-t-indigo-300 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="min-h-screen bg-[#131316] text-white p-4 sm:p-6 pb-48 sm:pb-56 font-sans relative overflow-x-hidden">
        {/* Glow Effects */}
        <div className="fixed top-0 left-[20%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 relative z-10 pt-4">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <button
                  type="button"
                  onClick={() => setLocation("/teacher")}
                  className="md:hidden p-2 rounded-xl bg-[#1c1c21] hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95 shadow-md flex items-center justify-center"
                  title="Back to Dashboard"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span>{isEditMode ? "Edit Quiz" : "Quiz Creation Wizard"}</span>
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-xl">{getStepText(currentStep)}</p>
            </div>
            
            <div className="bg-[#1c1c21] rounded-full px-5 py-2.5 flex items-center gap-4 border border-white/5 shadow-lg shrink-0">
              <span className="font-extrabold text-white text-base">0{currentStep}</span>
              <div className="w-24 md:w-32 h-1.5 bg-[#131316] rounded-full overflow-hidden inset-shadow-sm">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-400 to-[#a855f7] rounded-full transition-all duration-500" 
                  style={{ width: `${(currentStep / 3) * 100}%` }} 
                />
              </div>
              <span className="text-xs text-zinc-500 font-bold">/ 03</span>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex gap-1 sm:gap-2 p-1.5 bg-[#1c1c21] rounded-2xl border border-white/5 w-fit overflow-x-auto">
            {stepLabels.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  disabled={step.id > currentStep && !formValid}
                  className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-indigo-300 text-indigo-950 shadow-[0_0_15px_rgba(165,180,252,0.3)]' 
                      : isPast
                        ? 'text-white hover:bg-white/5'
                        : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-950' : isPast ? 'text-indigo-400' : ''}`} />
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="min-h-[500px] pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 && renderInfoStep()}
                {currentStep === 2 && renderQuestionsStep()}
                {currentStep === 3 && renderSettingsStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Fixed bottom bar — 3 main form action buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/10 py-3 sm:py-4 px-2.5 sm:px-6 md:px-12 flex justify-between items-center z-50 gap-1.5 sm:gap-4 shadow-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white text-xs sm:text-sm px-2 sm:px-4 h-10 sm:h-11 rounded-xl shrink-0 gap-1"
            onClick={() => setLocation("/teacher")}
          >
            {isEditMode ? (
              <><ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180 shrink-0" /> <span>Back</span></>
            ) : (
              <><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span>Discard Draft</span></>
            )}
          </Button>
          
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#1c1c21] border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl gap-1 text-xs sm:text-sm h-10 sm:h-11 px-2.5 sm:px-5"
              onClick={handleSaveDraft}
              disabled={isPending || !formValid}
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Save Draft</span>
            </Button>

            <Button 
              type="button"
              className={`font-bold px-3 sm:px-8 h-10 sm:h-12 rounded-xl flex items-center gap-1 shadow-lg transition-all text-xs sm:text-sm ${
                (!formValid) || isPending
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-300 hover:bg-indigo-400 text-indigo-950 hover:shadow-[0_0_20px_rgba(165,180,252,0.5)]'
              }`}
              onClick={nextStep}
              disabled={(!formValid) || isPending}
            >
              {currentStep < 3 ? (
                <>Next Step <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /></>
              ) : (
                isPending ? "Saving..." : (isEditMode ? "Save Changes" : "Launch Quiz")
              )}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}
