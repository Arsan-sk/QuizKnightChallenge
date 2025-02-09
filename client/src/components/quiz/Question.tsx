import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface QuestionProps {
  question?: QuestionType;
  onChange: mode extends "edit" ? (question: Partial<QuestionType>) => void : (answer: string) => void;
  onRemove?: () => void;
  answer?: string;
  mode: "edit" | "take";
}

export function Question({
  question,
  onChange,
  onRemove,
  answer,
  mode,
}: QuestionProps) {
  const handleQuestionTypeChange = (type: "mcq" | "true_false") => {
    if (mode !== "edit") return;
    onChange({
      ...question,
      questionType: type,
      options: type === "mcq" ? ["", "", "", ""] : ["True", "False"],
      correctAnswer: "",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (mode !== "edit" || !question?.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    onChange({ ...question, options: newOptions });
  };

  if (mode === "edit") {
    return (
      <motion.div
        className="border p-6 rounded-lg relative"
        whileHover={{ scale: 1.01 }}
      >
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <div className="space-y-4">
          <div>
            <Label>Question Text</Label>
            <Input
              value={question?.questionText || ""}
              onChange={(e) =>
                onChange({ ...question, questionText: e.target.value })
              }
              placeholder="Enter your question"
            />
          </div>

          <div>
            <Label>Question Type</Label>
            <RadioGroup
              value={question?.questionType}
              onValueChange={(value) =>
                handleQuestionTypeChange(value as "mcq" | "true_false")
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mcq" id="mcq" />
                <Label htmlFor="mcq">Multiple Choice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true_false" id="true_false" />
                <Label htmlFor="true_false">True/False</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {question?.options?.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
            ))}
          </div>

          <div>
            <Label>Correct Answer</Label>
            <Input
              value={question?.correctAnswer || ""}
              onChange={(e) =>
                onChange({ ...question, correctAnswer: e.target.value })
              }
              placeholder="Enter the correct answer"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="border p-6 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-xl font-medium mb-4">{question?.questionText}</h3>
      <RadioGroup
        value={answer}
        onValueChange={(value: string) => onChange(value)}
        className="space-y-2"
      >
        {question?.options?.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${index}`} />
            <Label htmlFor={`option-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </motion.div>
  );
}