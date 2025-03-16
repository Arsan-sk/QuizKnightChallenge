import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function QuizCreate() {
  const [, setLocation] = useLocation();
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizType, setQuizType] = useState<"standard" | "live">("standard");

  const form = useForm({
    resolver: zodResolver(insertQuizSchema),
    defaultValues: {
      title: "",
      description: "",
      difficulty: "easy",
      isPublic: true,
      quizType: "standard",
      duration: 30,
    },
  });

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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "mcq",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, question: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = question;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuizTypeChange = (value: string) => {
    const type = value as "standard" | "live";
    setQuizType(type);
    form.setValue("quizType", type);
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Create New Quiz</h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createQuizMutation.mutate(data)
            )}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input {...form.register("title")} />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea {...form.register("description")} />
              </div>

              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("difficulty", value as "easy" | "medium" | "hard")
                  }
                  defaultValue="easy"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Quiz Type</label>
                <Select
                  onValueChange={handleQuizTypeChange}
                  defaultValue="standard"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quiz type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
                {quizType === "live" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Live quizzes can be started and stopped by the teacher. Students can only take the quiz when it's active.
                  </p>
                )}
              </div>

              {quizType === "live" && (
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="180"
                    defaultValue="30"
                    onChange={(e) => form.setValue("duration", parseInt(e.target.value))}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPublic" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => {
                    form.setValue("isPublic", checked === true);
                  }}
                />
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Make quiz public
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Questions</h2>
                <Button type="button" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Question
                    question={question}
                    onChange={(q) => updateQuestion(index, q)}
                    onRemove={() => removeQuestion(index)}
                    mode="edit"
                  />
                </motion.div>
              ))}

              {questions.length > 0 && (
                <div className="flex justify-center mt-6">
                  <Button 
                    type="button" 
                    onClick={addQuestion}
                    variant="outline"
                    className="px-8"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Question
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createQuizMutation.isPending || questions.length === 0}
            >
              {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
