import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Image, PlusCircle, FileQuestion, Edit3, CheckIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useEffect, useState, useCallback, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedCallback } from "use-debounce";

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
  // Create a stable question ID that won't change on re-renders
  const questionId = useRef(question?.id || Math.random().toString(36).substring(2, 9)).current;
  
  // Use immediate state instead of local state with debounce
  const [questionText, setQuestionText] = useState(question?.questionText || "");
  const [questionType, setQuestionType] = useState<"mcq" | "true_false">(question?.questionType || "mcq");
  const [options, setOptions] = useState<string[]>(question?.options || ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(question?.correctAnswer || "");
  const [imageUrl, setImageUrl] = useState(question?.imageUrl || "");
  const [optionImages, setOptionImages] = useState<string[]>(question?.optionImages || []);
  
  // Visual state
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Update local state from parent props initially
  useEffect(() => {
    if (question) {
      setQuestionText(question.questionText || "");
      setQuestionType(question.questionType || "mcq");
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer || "");
      setImageUrl(question.imageUrl || "");
      setOptionImages(question.optionImages || []);
    }
  }, [question?.id]); // Only update when the question ID changes
  
  // Update parent with all state whenever any changes happen
  const updateParent = useCallback(() => {
    onChange({
      questionText,
      questionType,
      options,
      correctAnswer,
      imageUrl,
      optionImages
    });
  }, [onChange, questionText, questionType, options, correctAnswer, imageUrl, optionImages]);
  
  // Update parent after any state change
  useEffect(() => {
    const timer = setTimeout(updateParent, 300);
    return () => clearTimeout(timer);
  }, [questionText, questionType, options, correctAnswer, imageUrl, optionImages, updateParent]);
  
  // Direct state handlers without complicated logic
  const handleQuestionTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestionText(e.target.value);
  }, []);
  
  const handleQuestionTypeChange = useCallback((type: "mcq" | "true_false") => {
    setQuestionType(type);
    setOptions(type === "mcq" ? ["", "", "", ""] : ["True", "False"]);
    setCorrectAnswer("");
  }, []);
  
  const handleOptionChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newOptions = [...options];
    newOptions[index] = e.target.value;
    setOptions(newOptions);
  }, [options]);
  
  const handleQuestionImageChange = useCallback((url: string | null) => {
    setImageUrl(url || "");
  }, []);
  
  const handleOptionImageChange = useCallback((index: number, url: string | null) => {
    const newOptionImages = [...optionImages];
    newOptionImages[index] = url || "";
    setOptionImages(newOptionImages);
  }, [optionImages]);
  
  const markAsCorrect = useCallback((index: number) => {
    const option = options[index];
    if (option.trim() !== "") {
      setCorrectAnswer(option);
    }
  }, [options]);
  
  // Filter non-empty options for UI
  const nonEmptyOptions = options.filter(option => option.trim() !== "");
  const hasOptions = nonEmptyOptions.length > 0;

  return (
    <motion.div
      className="border p-6 rounded-lg relative bg-white dark:bg-slate-900 shadow-sm"
      whileHover={{ scale: 1.01, boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout="position"
    >
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-70 hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="space-y-5">
        {/* Question Text & Image Section */}
        <motion.div 
          className="space-y-3 relative"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0.8 }}
          layout="position"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <FileQuestion className="h-4 w-4" />
                Question Text
              </Label>
              <Input
                value={questionText}
                onChange={handleQuestionTextChange}
                placeholder="Enter your question"
                className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="pt-6">
              <ImageUpload
                value={imageUrl}
                onChange={handleQuestionImageChange}
                label="Add Image"
                compact={true}
                id={`question-image-${questionId}`}
              />
            </div>
          </div>
        </motion.div>

        {/* Question Type Section */}
        <motion.div
          className="border-t pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          layout="position"
        >
          <Label className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Edit3 className="h-4 w-4" />
            Question Type
          </Label>
          <RadioGroup
            value={questionType}
            onValueChange={(value) =>
              handleQuestionTypeChange(value as "mcq" | "true_false")
            }
            className="flex space-x-4 pt-2"
          >
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <RadioGroupItem value="mcq" id={`mcq-${questionId}`} />
              <Label htmlFor={`mcq-${questionId}`}>Multiple Choice</Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <RadioGroupItem value="true_false" id={`true_false-${questionId}`} />
              <Label htmlFor={`true_false-${questionId}`}>True/False</Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Options Section - Enhanced with direct correct answer selection */}
        <AnimatePresence mode="popLayout">
          <motion.div
            className="border-t pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            layout="position"
          >
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                Options
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground italic">
                      Click the checkmark button to set the correct answer
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Mark the correct option by clicking the checkmark</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              {options.map((option, index) => {
                const isCorrect = option === correctAnswer && option.trim() !== "";
                const optionInputId = `option-input-${questionId}-${index}`;
                
                return (
                  <motion.div 
                    key={`option-${questionId}-${index}`}
                    className={cn(
                      "border rounded-md p-3 relative transition-all",
                      activeSection === `option-${index}` && "ring-2 ring-primary/30",
                      isCorrect && "bg-green-50 dark:bg-green-900/20 border-green-300",
                      !isCorrect && "hover:border-primary/30"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      scale: 1.005,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)" 
                    }}
                    onClick={() => setActiveSection(`option-${index}`)}
                    layout="position"
                  >
                    {isCorrect && (
                      <motion.div 
                        className="absolute -right-2 -top-2 bg-green-600 rounded-full p-1 shadow-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "font-medium text-sm w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                        isCorrect 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      
                      <Input
                        className={cn(
                          "flex-1 transition-all",
                          isCorrect && "border-green-200 focus:border-green-300 focus:ring-green-200/30"
                        )}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e)}
                        placeholder={`Option ${index + 1}`}
                        id={optionInputId}
                      />
                      <div className="flex items-center gap-2">
                        {option.trim() !== "" && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              type="button"
                              size="icon"
                              variant={isCorrect ? "default" : "outline"}
                              className={cn(
                                "h-8 w-8 transition-all",
                                isCorrect && "bg-green-600 hover:bg-green-700 text-white border-green-600",
                                !isCorrect && "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsCorrect(index);
                              }}
                              title="Mark as correct answer"
                            >
                              <motion.div
                                initial={{ scale: isCorrect ? 1 : 0.5, opacity: isCorrect ? 1 : 0.7 }}
                                animate={{ 
                                  scale: isCorrect ? [1, 1.2, 1] : 0.5, 
                                  opacity: isCorrect ? 1 : 0.7 
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <CheckIcon className="h-4 w-4" />
                              </motion.div>
                            </Button>
                          </motion.div>
                        )}
                        {questionType === "mcq" && (
                          <ImageUpload
                            value={optionImages[index] || ""}
                            onChange={(url) => handleOptionImageChange(index, url)}
                            label={`Image`}
                            compact={true}
                            id={`option-image-${questionId}-${index}`}
                          />
                        )}
                      </div>
                    </div>
                    
                    {isCorrect && (
                      <motion.div 
                        className="mt-2 pl-10 text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Marked as correct answer
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
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
  // Add safety check for question options
  const options = question?.options || [];
  const correctAnswer = question?.correctAnswer || "";
  const questionText = question?.questionText || "";
  const imageUrl = question?.imageUrl;
  const optionImages = question?.optionImages || [];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium mb-4">{questionText}</h3>
      
      {imageUrl && (
        <div className="mb-4">
          <img 
            src={imageUrl} 
            alt="Question" 
            className="max-w-full h-auto rounded-md border"
          />
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mb-2 italic">
        Select an answer by clicking anywhere on the option or using number keys (1-{options.length || 4})
      </div>
      
      <RadioGroup
        value={userAnswer}
        onValueChange={onChange}
        className="space-y-3"
      >
        {options.map((option, index) => {
          const isCorrect = showResult && option === correctAnswer;
          const isIncorrect = showResult && userAnswer === option && option !== correctAnswer;
          const isSelected = userAnswer === option;
          const optionImage = optionImages[index];

          return (
            <motion.div
              key={`take-option-${index}`}
              className={cn(
                "border rounded-md p-3 relative transition-all cursor-pointer",
                isCorrect && "bg-green-50 dark:bg-green-900/20 border-green-300",
                isIncorrect && "bg-red-50 dark:bg-red-900/20 border-red-300",
                isSelected && !showResult && "bg-primary/5 border-primary",
                !showResult && "hover:border-primary/50 hover:bg-muted/10"
              )}
              whileHover={!showResult ? { scale: 1.005, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !showResult && onChange(option)}
            >
              {isCorrect && (
                <motion.div
                  className="absolute -right-3 -top-3 bg-green-500 rounded-full p-1 text-white border-2 border-white dark:border-gray-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckIcon className="h-4 w-4" />
                </motion.div>
              )}

              {isIncorrect && (
                <motion.div
                  className="absolute -right-3 -top-3 bg-red-500 rounded-full p-1 text-white border-2 border-white dark:border-gray-900"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <X className="h-4 w-4" />
                </motion.div>
              )}

              <div className="flex items-center space-x-2">
                <div className={cn(
                  "flex items-center gap-2 flex-1",
                  isCorrect && "text-green-600 dark:text-green-400 font-medium",
                  isIncorrect && "text-red-600 dark:text-red-400 font-medium"
                )}>
                  <div className={cn(
                    "font-medium text-sm w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isSelected && !showResult && "bg-primary text-white",
                    isCorrect
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                      : isIncorrect
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : !isSelected && "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  
                  <RadioGroupItem
                    value={option}
                    id={`option-take-${index}`}
                    disabled={showResult}
                    className="sr-only" // Visually hide but keep accessible
                  />
                  <Label
                    htmlFor={`option-take-${index}`}
                    className={cn(
                      "flex items-center w-full text-base cursor-pointer",
                      isCorrect && "text-green-600 dark:text-green-400 font-medium",
                      isIncorrect && "text-red-600 dark:text-red-400 font-medium",
                      isSelected && !showResult && "font-medium text-primary"
                    )}
                  >
                    {option}
                  </Label>
                </div>
                
                {isSelected && !showResult && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10"> 
                    <CheckIcon className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
              
              {optionImage && (
                <div className="mt-3">
                  <img
                    src={optionImage}
                    alt={`Option ${index + 1}`}
                    className="max-w-full h-auto rounded-md border mt-2"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </RadioGroup>

      {showResult && (
        <motion.div
          className={cn(
            "mt-4 p-3 rounded-md border",
            userAnswer === correctAnswer 
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {userAnswer === correctAnswer ? (
            <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Correct!
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400 font-medium">
              Incorrect. The correct answer is: {correctAnswer}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}