import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Image, PlusCircle, FileQuestion, Edit3, CheckIcon, TrashIcon, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  return (
    <ErrorBoundary componentName="Question">
      {props.mode === "edit" ? (
        <QuestionEdit {...props as QuestionEditProps} />
      ) : (
        <QuestionTake {...props as QuestionTakeProps} />
      )}
    </ErrorBoundary>
  );
}

function QuestionEdit({ question, onChange, onRemove }: QuestionEditProps) {
  // Create a stable question ID that won't change on re-renders
  const questionId = useRef(question?.id || createComponentId('q-')).current;

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
    try {
      if (isFunction(onChange)) {
        onChange({
          questionText,
          questionType,
          options,
          correctAnswer,
          imageUrl,
          optionImages
        });
      }
    } catch (error) {
      console.error("Error updating parent component:", error);
    }
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
    try {
      const newOptions = [...options];
      newOptions[index] = e.target.value;
      setOptions(newOptions);
    } catch (error) {
      console.error(`Error updating option at index ${index}:`, error);
    }
  }, [options]);

  const handleQuestionImageChange = useCallback((url: string | null) => {
    setImageUrl(url || "");
  }, []);

  const handleOptionImageChange = useCallback((index: number, url: string | null) => {
    try {
      const newOptionImages = [...optionImages];
      newOptionImages[index] = url || "";
      setOptionImages(newOptionImages);
    } catch (error) {
      console.error(`Error updating option image at index ${index}:`, error);
    }
  }, [optionImages]);

  const markAsCorrect = useCallback((index: number) => {
    try {
      const option = options[index];
      if (option && option.trim() !== "") {
        setCorrectAnswer(option);
      }
    } catch (error) {
      console.error(`Error marking option ${index} as correct:`, error);
    }
  }, [options]);

  // Filter non-empty options for UI
  const nonEmptyOptions = useMemo(() => {
    return options.filter(option => isValidString(option));
  }, [options]);

  const hasOptions = nonEmptyOptions.length > 0;
  const hasCorrectAnswer = correctAnswer.trim() !== "";

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
          onClick={(e) => {
            e.stopPropagation();
            if (isFunction(onRemove)) {
              onRemove();
            }
          }}
          title="Remove question"
        >
          <TrashIcon className="h-4 w-4" />
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
                onClick={() => setActiveSection('question-text')}
                autoFocus
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
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);
  const processingClick = useRef(false);

  // Add click handler for the entire option with error handling
  const handleOptionClick = useCallback((option: string, e?: React.MouseEvent) => {
    // Prevent duplicate clicks
    if (processingClick.current) return;
    processingClick.current = true;

    // Prevent event propagation if available
    if (e) {
      e.stopPropagation();
    }

    // Don't allow selections when showing results
    if (!showResult && isFunction(onChange) && isValidString(option)) {
      try {
        // Only process if component is still mounted
        if (isMounted.current) {
          onChange(option);
          console.log("Option selected:", option);
        }
      } catch (error) {
        console.error("Error handling option selection:", error);
      }
    }

    // Reset processing flag after a short delay
    setTimeout(() => {
      processingClick.current = false;
    }, 200);
  }, [onChange, showResult]);

  // Track component unmounting to prevent state updates
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Safety check to prevent rendering with invalid data
  if (!question) {
    return (
      <div className="p-4 text-muted-foreground">
        Question data is not available.
      </div>
    );
  }

  // Safely extract question data with defaults
  const questionText = safeAccess<string, string>(question, 'questionText', '');
  const options = safeAccess<string[], string[]>(question, 'options', []);
  const correctAnswer = safeAccess<string, string>(question, 'correctAnswer', '');
  const imageUrl = safeAccess<string, string>(question, 'imageUrl', '');
  const optionImages = safeAccess<string[], string[]>(question, 'optionImages', []);

  // If there are no options, show a message
  if (!isValidArray(options)) {
    return (
      <div className="p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20">
        <p className="text-amber-700 dark:text-amber-300">
          This question doesn't have any options to select.
        </p>
      </div>
    );
  }

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

      <div className="space-y-3">
        {options.map((option, index) => {
          const isCorrect = showResult && option === correctAnswer;
          const isIncorrect = showResult && userAnswer === option && option !== correctAnswer;
          const isSelected = option === userAnswer;
          const optionImage = optionImages?.[index] || '';
          const optionId = `option-take-${index}`;

          return (
            <motion.div
              key={`take-option-${index}`}
              className={cn(
                "border rounded-md p-3 relative transition-all cursor-pointer hover:shadow-md",
                isCorrect && "bg-green-50 dark:bg-green-900/20 border-green-300",
                isIncorrect && "bg-red-50 dark:bg-red-900/20 border-red-300",
                isSelected && !showResult && "border-primary bg-primary/5",
                !showResult && "hover:border-primary/50 hover:bg-primary/5"
              )}
              whileHover={!showResult ? { scale: 1.005 } : {}}
              whileTap={!showResult ? { scale: 0.995 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={(e) => handleOptionClick(option, e)}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOptionClick(option);
                  e.preventDefault();
                }
              }}
            >
              {isCorrect && (
                <motion.div
                  className="absolute -right-2 -top-2 bg-green-600 rounded-full p-1 shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.2 }}
                >
                  <CheckCircle className="h-3 w-3 text-white" />
                </motion.div>
              )}

              <div className={cn(
                "flex items-center gap-2",
                isCorrect && "text-green-600 dark:text-green-400 font-medium",
                isIncorrect && "text-red-600 dark:text-red-400 font-medium"
              )}>
                <div className={cn(
                  "font-medium text-sm w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isCorrect
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : isIncorrect
                      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                      : isSelected
                        ? "bg-primary/20 text-primary dark:bg-primary/30"
                        : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>

                {/* Custom radio button styling that's more noticeable */}
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>

                <span
                  className={cn(
                    "flex-1 text-base",
                    isCorrect && "text-green-600 dark:text-green-400 font-medium",
                    isIncorrect && "text-red-600 dark:text-red-400 font-medium",
                    isSelected && !showResult && "text-primary font-medium"
                  )}
                >
                  {option}
                </span>
              </div>

              {optionImage && (
                <div className="mt-3 ml-9">
                  <img
                    src={optionImage}
                    alt={`Option ${index + 1}`}
                    className="max-w-full max-h-32 h-auto rounded-md border"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {showResult && (
        <motion.div
          className={cn(
            "mt-4 p-3 rounded-md border",
            userAnswer === correctAnswer
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          )}
          initial={{ opacity: 0, y: 10 }}
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