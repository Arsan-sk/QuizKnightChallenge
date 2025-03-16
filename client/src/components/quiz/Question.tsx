import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleCorrectAnswerChange = (value: string) => {
    if (mode !== "edit") return;
    onChange({ ...question, correctAnswer: value });
  };

  if (mode === "edit") {
    // Filter non-empty options here to avoid issues in the Select component
    const nonEmptyOptions = question?.options?.filter(option => option.trim() !== "") || [];
    const hasOptions = nonEmptyOptions.length > 0;
    
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
            {hasOptions ? (
              <Select
                value={question?.correctAnswer || ""}
                onValueChange={handleCorrectAnswerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the correct answer" />
                </SelectTrigger>
                <SelectContent>
                  {nonEmptyOptions.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Enter options above, then select the correct answer
              </p>
            )}
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