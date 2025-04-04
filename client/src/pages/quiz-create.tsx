import { useState, useEffect, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { insertQuizSchema, insertQuestionSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
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
import { useDebouncedCallback } from "use-debounce";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Book, 
  FileQuestion, 
  Clock, 
  GraduationCap,
  PenTool, 
  Lightbulb, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  LayoutList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Create a simplified schema for the form only
const quizFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isPublic: z.boolean(),
  quizType: z.enum(["standard", "live"]),
  duration: z.number().optional(),
  targetYear: z.number().optional()
});

// Create a memoized version of the Question component to prevent re-renders
const MemoizedQuestion = memo(Question, (prevProps, nextProps) => {
  // Always return true for edit mode questions to prevent any re-renders from parent
  // The component will internally manage its own state and update the parent only when needed
  if (prevProps.mode === 'edit' && nextProps.mode === 'edit') {
    // If the question's ID changed, we need to re-render
    if (prevProps.question?.id !== nextProps.question?.id) {
      return false;
    }
    
    // Otherwise, never re-render from parent changes
    // The component will update internal state as needed
    return true;
  }
  
  // Default comparison for other modes
  return false;
});

// Add motion styling to CardFooter for layout control
const AnimatedCardFooter = ({ children, className, ...props }: React.ComponentPropsWithoutRef<typeof CardFooter>) => (
  <CardFooter className={`bg-muted/20 border-t py-3 ${className}`} {...props}>
    <motion.div 
      className="w-full flex justify-between"
      layout="position"
    >
      {children}
    </motion.div>
  </CardFooter>
);

export default function QuizCreate() {
  const [, setLocation] = useLocation();
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizType, setQuizType] = useState<"standard" | "live">("standard");
  const [currentStep, setCurrentStep] = useState<"details" | "questions">("details");
  const [isPreview, setIsPreview] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      isPublic: true,
      quizType: "standard",
      duration: 30,
    },
    mode: "onChange"
  });
  
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      const titleValue = formValues.title as string || "";
      setFormValid(titleValue.trim().length > 0);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const createQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      const quiz = await res.json();

      // Create questions
      for (const question of questions) {
        await apiRequest("POST", `/api/quizzes/${quiz.id}/questions`, question);
      }

      return quiz;
    },
    onSuccess: () => {
      setLocation("/teacher");
    },
  });

  const addQuestion = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const newQuestion = {
        questionText: "",
        questionType: "mcq",
        options: ["", "", "", ""],
        correctAnswer: "",
      points: 1,
    };
    
    setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
  }, []);

  const updateQuestion = useCallback((index: number, question: any) => {
    setQuestions(prevQuestions => {
      // Create a new array with all the previous questions
      const newQuestions = [...prevQuestions];
      const currentQuestion = { ...newQuestions[index] };
      let hasChanged = false;
      
      // Now we only update the specific fields that changed
      // This approach prevents unnecessary state updates and re-renders
      
      // Only update specific fields if they've changed
      if (question.questionText !== undefined && 
          currentQuestion.questionText !== question.questionText) {
        currentQuestion.questionText = question.questionText;
        hasChanged = true;
      }
      
      // Handle options changes
      if (question.options !== undefined) {
        // If options length changed, we need a full update
        if (!currentQuestion.options || 
            currentQuestion.options.length !== question.options.length) {
          currentQuestion.options = [...question.options];
          hasChanged = true;
        } else {
          // Check if any individual options changed
          let optionsChanged = false;
          for (let i = 0; i < question.options.length; i++) {
            if (currentQuestion.options[i] !== question.options[i]) {
              // Create a new options array only if we find a change
              if (!optionsChanged) {
                currentQuestion.options = [...currentQuestion.options];
                optionsChanged = true;
              }
              currentQuestion.options[i] = question.options[i];
            }
          }
          if (optionsChanged) {
            hasChanged = true;
          }
        }
      }
      
      // Handle question type changes (structural)
      if (question.questionType !== undefined && 
          currentQuestion.questionType !== question.questionType) {
        currentQuestion.questionType = question.questionType;
        hasChanged = true;
      }
      
      // Handle correct answer changes
      if (question.correctAnswer !== undefined && 
          currentQuestion.correctAnswer !== question.correctAnswer) {
        currentQuestion.correctAnswer = question.correctAnswer;
        hasChanged = true;
      }
      
      // Handle image changes
      if (question.imageUrl !== undefined && 
          currentQuestion.imageUrl !== question.imageUrl) {
        currentQuestion.imageUrl = question.imageUrl;
        hasChanged = true;
      }
      
      // Handle option image changes
      if (question.optionImages !== undefined) {
        if (!currentQuestion.optionImages) {
          currentQuestion.optionImages = [...question.optionImages];
          hasChanged = true;
        } else {
          let imagesChanged = false;
          // Only create a new array if the length is different or a value has changed
          if (currentQuestion.optionImages.length !== question.optionImages.length) {
            currentQuestion.optionImages = [...question.optionImages];
            hasChanged = true;
          } else {
            // Check individual image URLs
            for (let i = 0; i < question.optionImages.length; i++) {
              if (currentQuestion.optionImages[i] !== question.optionImages[i]) {
                // Create a new array only if we find a change
                if (!imagesChanged) {
                  currentQuestion.optionImages = [...currentQuestion.optionImages];
                  imagesChanged = true;
                }
                currentQuestion.optionImages[i] = question.optionImages[i];
              }
            }
            if (imagesChanged) {
              hasChanged = true;
            }
          }
        }
      }
      
      // Only update the state if something has actually changed
      if (!hasChanged) {
        return prevQuestions; // Return the original array to prevent re-renders
      }
      
      // Update the question in our new array and return
      newQuestions[index] = currentQuestion;
      return newQuestions;
    });
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuestions(questions => questions.filter((_, i) => i !== index));
  }, []);

  const handleQuizTypeChange = useCallback((value: string) => {
    const type = value as "standard" | "live";
    setQuizType(type);
    form.setValue("quizType", type);
  }, [form]);
  
  const nextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCurrentStep("questions");
  };
  
  const prevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCurrentStep("details");
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Move the handleSubmit function above where it's used in renderQuestionsSection
  const handleSubmit = async (data: any) => {
    if (questions.length === 0) {
      toast({
        title: "No questions added",
        description: "Please add at least one question to your quiz",
        variant: "destructive"
      });
      return;
    }
    
    createQuizMutation.mutate(data);
  };

  // Handler for the create quiz button that validates the form first
  const handleCreateQuizClick = useCallback(() => {
    // Trigger form validation
    form.trigger().then(isValid => {
      if (isValid) {
        // If form is valid, get the values and submit
        const formData = form.getValues();
        handleSubmit(formData);
      } else {
        // If form is invalid, show an error
        toast({
          title: "Invalid form data",
          description: "Please check the form for errors",
          variant: "destructive"
        });
      }
    });
  }, [form, handleSubmit]);

  // Button event handlers need to stop propagation and prevent default
  const handleButtonClick = useCallback((handler: Function) => (e: React.MouseEvent) => {
    // Stop event from bubbling up and triggering form submission
    e.stopPropagation();
    e.preventDefault();
    handler(e);
  }, []);

  // Memoized render functions to prevent unnecessary re-renders
  const renderQuizDetails = useCallback(() => (
    <AnimatePresence mode="wait">
      <motion.div
        key="details-form"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
        layout="position"
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz Information
            </CardTitle>
            <CardDescription>Enter the basic details about your quiz</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Book className="h-4 w-4" />
                Quiz Title
              </label>
              <Input 
                {...form.register("title")} 
                placeholder="Enter an engaging title for your quiz" 
                className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title.message?.toString()}</p>
              )}
              </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileQuestion className="h-4 w-4" />
                Description
              </label>
              <Textarea 
                {...form.register("description")} 
                placeholder="Describe what this quiz is about and what students will learn"
                className="min-h-24 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Difficulty Level
                </label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("difficulty", value as "easy" | "medium" | "hard")
                  }
                  defaultValue="easy"
                >
                  <SelectTrigger className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy" className="flex items-center">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor("easy")}>Easy</Badge>
                        <span className="text-muted-foreground text-xs">For beginners</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor("medium")}>Medium</Badge>
                        <span className="text-muted-foreground text-xs">Intermediate level</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="hard">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor("hard")}>Hard</Badge>
                        <span className="text-muted-foreground text-xs">Advanced concepts</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <LayoutList className="h-4 w-4" />
                  Quiz Type
                </label>
                <Select
                  onValueChange={handleQuizTypeChange}
                  defaultValue="standard"
                >
                  <SelectTrigger className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select quiz type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Standard</Badge>
                        <span className="text-muted-foreground text-xs">Always available</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="live">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Live</Badge>
                        <span className="text-muted-foreground text-xs">Teacher-controlled timing</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {quizType === "live" && (
                  <motion.p 
                    className="text-xs text-muted-foreground mt-1 italic"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    Live quizzes can be started and stopped by the teacher. Students can only take the quiz when it's active.
                  </motion.p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {quizType === "live" && (
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration (minutes)
                  </label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="180"
                    defaultValue="30"
                    onChange={(e) => form.setValue("duration", parseInt(e.target.value))}
                    className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="isPublic" 
                defaultChecked={true}
                onCheckedChange={(checked) => {
                  form.setValue("isPublic", checked === true);
                }}
              />
              <label htmlFor="isPublic" className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Make quiz public for all students
              </label>
            </div>
          </CardContent>
          <AnimatedCardFooter>
            <div></div> {/* Empty div for flex justification */}
            <Button 
              type="button"
              onClick={handleButtonClick(() => setCurrentStep("questions"))}
              className={`transition-all ${!formValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!formValid}
            >
              Next: Add Questions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AnimatedCardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  ), [form, quizType, formValid, handleButtonClick, handleQuizTypeChange, getDifficultyColor]);

  const renderQuestionsSection = useCallback(() => (
    <AnimatePresence mode="wait">
      <motion.div 
        key="questions-section"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
        layout="position"
      >
        <Card>
          <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Add Questions
              </CardTitle>
              <CardDescription>Create questions for your quiz</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={handleButtonClick(() => setCurrentStep("details"))}
              >
                Back to Details
              </Button>
              <Button 
                type="button" 
                size="sm"
                onClick={handleButtonClick(addQuestion)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800"
              layout="position"
            >
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Quick Tip
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                You can now directly mark an option as the correct answer by clicking the checkmark icon next to it. 
                The correct answer will be highlighted in green. No need to select it separately!
              </p>
            </motion.div>
            
            {questions.length === 0 ? (
              <motion.div 
                className="text-center py-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                layout="position"
              >
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start by adding a question</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Your quiz needs at least one question. Click the button below to add your first question.
                </p>
                <Button 
                  type="button"
                  onClick={handleButtonClick(addQuestion)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Question
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
              {questions.map((question, index) => (
                <motion.div
                      key={`question-wrapper-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                      layout
                      layoutId={`question-${index}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-primary/10">Question {index + 1}</Badge>
                        {question.questionType === "mcq" && <Badge variant="outline">Multiple Choice</Badge>}
                        {question.questionType === "true_false" && <Badge variant="outline">True/False</Badge>}
                      </div>
                      <MemoizedQuestion
                    question={question}
                    onChange={(q) => updateQuestion(index, q)}
                    onRemove={() => removeQuestion(index)}
                    mode="edit"
                  />
                </motion.div>
              ))}
                </AnimatePresence>

                {questions.length > 0 && (
                  <motion.div 
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    layout="position"
                  >
                    <Button 
                      type="button" 
                      onClick={handleButtonClick(addQuestion)}
                      variant="outline"
                      className="px-8"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Question
                    </Button>
                  </motion.div>
                )}
            </div>
            )}
          </CardContent>
          <AnimatedCardFooter>
            <Button 
              variant="outline" 
              type="button"
              onClick={handleButtonClick(() => setCurrentStep("details"))}
            >
              Back to Details
            </Button>
            <Button
              type="button"
              onClick={handleButtonClick(handleCreateQuizClick)}
              className="min-w-32"
              disabled={createQuizMutation.isPending || questions.length === 0}
            >
              {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </AnimatedCardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  ), [questions, addQuestion, updateQuestion, removeQuestion, handleButtonClick, createQuizMutation.isPending, handleCreateQuizClick]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Create New Quiz
        </h1>
        <p className="text-muted-foreground mt-2">
          Design an engaging quiz for your students with questions and options
        </p>
      </motion.div>

      <Form {...form}>
        <div className="space-y-6" id="quiz-form">
          <AnimatePresence mode="wait">
            {currentStep === "details" ? renderQuizDetails() : renderQuestionsSection()}
          </AnimatePresence>
        </div>
      </Form>
    </div>
  );
}
