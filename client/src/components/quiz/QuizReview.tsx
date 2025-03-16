import { Question as QuestionType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface QuizReviewProps {
  questions: QuestionType[];
  userAnswers: string[];
  onClose: () => void;
}

export function QuizReview({ questions, userAnswers, onClose }: QuizReviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-card w-full max-w-3xl rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Detailed Quiz Review</h2>
          <p className="text-muted-foreground">Review your answers and see the correct solutions</p>
        </div>
        
        <ScrollArea className="h-[60vh]">
          <div className="p-6 space-y-8">
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index] || "";
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <Card key={question.id} className="relative overflow-hidden">
                  {isCorrect ? (
                    <span className="absolute top-2 right-3 bg-green-100 text-green-800 font-medium px-2 py-1 rounded-full text-xs flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      +1
                    </span>
                  ) : (
                    <span className="absolute top-2 right-3 bg-red-100 text-red-800 font-medium px-2 py-1 rounded-full text-xs flex items-center">
                      <X className="h-3 w-3 mr-1" />
                      0
                    </span>
                  )}
                  
                  <CardContent className="pt-8 pb-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">
                        Question {index + 1}: {question.questionText}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {question.options?.map((option) => {
                        const isUserSelection = option === userAnswer;
                        const isCorrectOption = option === question.correctAnswer;
                        
                        return (
                          <div
                            key={option}
                            className={`p-3 rounded flex items-center ${
                              isCorrectOption
                                ? "bg-green-100 text-green-800"
                                : isUserSelection && !isCorrect
                                ? "bg-red-100 text-red-800"
                                : "bg-muted"
                            }`}
                          >
                            {isCorrectOption && <Check className="h-4 w-4 mr-2" />}
                            {isUserSelection && !isCorrectOption && <X className="h-4 w-4 mr-2" />}
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 