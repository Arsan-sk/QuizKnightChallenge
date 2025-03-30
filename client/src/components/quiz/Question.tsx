import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { X, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface QuestionPropsBase {
  question?: QuestionType;
  onRemove?: () => void;
}

interface QuestionEditProps extends QuestionPropsBase {
  mode: "edit";
  onChange: (question: Partial<QuestionType>) => void;
}

interface QuestionTakeProps extends QuestionPropsBase {
  mode?: "take";
  userAnswer?: string;
  onChange: (answer: string) => void;
  showResult?: boolean;
}

type QuestionProps = QuestionEditProps | QuestionTakeProps;

export function Question(props: QuestionProps) {
  if (props.mode === "edit") {
    return <QuestionEdit {...props} />;
  }
  return <QuestionTake {...props} />;
}

function QuestionEdit({ question, onChange, onRemove }: QuestionEditProps) {
  const handleQuestionTypeChange = (type: "mcq" | "true_false") => {
    onChange({
      ...question,
      questionType: type,
      options: type === "mcq" ? ["", "", "", ""] : ["True", "False"],
      correctAnswer: "",
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!question?.options) return;
    const newOptions = [...question.options];
    newOptions[index] = value;
    onChange({ ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (value: string) => {
    onChange({ ...question, correctAnswer: value });
  };

  // Filter non-empty options here to avoid issues with radio buttons
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
            className="flex space-x-4 pt-2"
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

        <div>
          <Label>Options</Label>
          {question?.options?.map((option, index) => (
            <Input
              key={index}
              className="mb-2"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
            />
          ))}
        </div>

        <div>
          <Label>Correct Answer</Label>
          {hasOptions ? (
            <div className="space-y-2 mt-2">
              <RadioGroup
                value={question?.correctAnswer || ""}
                onValueChange={handleCorrectAnswerChange}
              >
                {nonEmptyOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-md transition-colors",
                      question?.correctAnswer === option && "bg-green-50 dark:bg-green-900/20 border border-green-300"
                    )}
                  >
                    <RadioGroupItem value={option} id={`correct-${index}`} />
                    <Label htmlFor={`correct-${index}`} className="w-full">
                      {option}
                      {question?.correctAnswer === option && (
                        <CheckCircle className="inline-block ml-2 h-4 w-4 text-green-600" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
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

function QuestionTake({
  question,
  onChange,
  userAnswer = "",
  showResult = false
}: QuestionTakeProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium mb-4">{question?.questionText}</h3>
      <RadioGroup
        value={userAnswer}
        onValueChange={onChange}
        className="space-y-2"
      >
        {question?.options?.map((option, index) => {
          const isCorrect = showResult && option === question.correctAnswer;
          const isIncorrect = showResult && userAnswer === option && option !== question.correctAnswer;

          return (
            <div
              key={index}
              className={cn(
                "flex items-center space-x-2 p-3 rounded-md transition-colors",
                isCorrect && "bg-green-50 dark:bg-green-900/20",
                isIncorrect && "bg-red-50 dark:bg-red-900/20"
              )}
            >
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                disabled={showResult}
              />
              <Label
                htmlFor={`option-${index}`}
                className={cn(
                  "flex items-center w-full",
                  isCorrect && "text-green-600 dark:text-green-400 font-medium",
                  isIncorrect && "text-red-600 dark:text-red-400 font-medium"
                )}
              >
                {option}
                {isCorrect && (
                  <CheckCircle className="ml-2 h-4 w-4 text-green-600 dark:text-green-400" />
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {showResult && userAnswer && (
        <div className="mt-2">
          {userAnswer === question?.correctAnswer ? (
            <p className="text-green-600 dark:text-green-400 font-medium">Correct!</p>
          ) : (
            <p className="text-red-600 dark:text-red-400 font-medium">
              Incorrect. The correct answer is: {question?.correctAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}