import { Question as QuestionType } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Image, PlusCircle, FileQuestion, Edit3, CheckIcon, XCircle } from "lucide-react";
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
  const [points, setPoints] = useState(question?.points || 2);

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
      setPoints(question.points || 2);
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
      optionImages,
      points
    });
  }, [onChange, questionText, questionType, options, correctAnswer, imageUrl, optionImages, points]);

  // Update parent after any state change
  useEffect(() => {
    const timer = setTimeout(updateParent, 300);
    return () => clearTimeout(timer);
  }, [questionText, questionType, options, correctAnswer, imageUrl, optionImages, points, updateParent]);

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
    const oldOption = newOptions[index];
    const newValue = e.target.value;
    newOptions[index] = newValue;
    setOptions(newOptions);
    
    // Auto-update correct answer string to match the new value if it was the selected answer
    setCorrectAnswer(prev => (prev === oldOption && oldOption !== "") ? newValue : prev);
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
      className="p-6 relative bg-transparent"
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
                className="transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-[#1c1c21] border-white/5 text-white h-12 rounded-xl"
              />
            </div>

            <div className="pt-6 flex flex-col gap-4">
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

        {/* Question Type & Points Section */}
        <motion.div
          className="border-t border-white/5 pt-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          layout="position"
        >
          <div className="space-y-2 w-full sm:w-auto">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />
              Question Type
            </Label>
            <RadioGroup
              value={questionType}
              onValueChange={(value) =>
                handleQuestionTypeChange(value as "mcq" | "true_false")
              }
              className="flex space-x-2 sm:space-x-4 w-full"
            >
              <div className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 border border-white/5 bg-[#1c1c21] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-white/5 transition-colors cursor-pointer text-white">
                <RadioGroupItem value="mcq" id={`mcq-${questionId}`} />
                <Label htmlFor={`mcq-${questionId}`} className="cursor-pointer text-xs sm:text-sm font-semibold">
                  <span className="sm:hidden">MCQ</span>
                  <span className="hidden sm:inline">Multiple Choice</span>
                </Label>
              </div>
              <div className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 border border-white/5 bg-[#1c1c21] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-white/5 transition-colors cursor-pointer text-white">
                <RadioGroupItem value="true_false" id={`true_false-${questionId}`} />
                <Label htmlFor={`true_false-${questionId}`} className="cursor-pointer text-xs sm:text-sm font-semibold">
                  True/False
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-start pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
              Points
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="w-20 sm:w-24 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-[#1c1c21] border-white/5 text-white h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
              />
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
          </div>
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
                      "border rounded-xl p-3 relative transition-all bg-[#1c1c21]",
                      activeSection === `option-${index}` && "ring-2 ring-indigo-500/30",
                      isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/5 hover:border-white/10"
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

                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className={cn(
                        "font-bold text-xs sm:text-sm w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors shrink-0",
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-zinc-500"
                      )}>
                        {index + 1}
                      </div>

                      <Input
                        className={cn(
                          "flex-1 transition-all bg-[#131316] border-white/5 text-white h-10 sm:h-11 rounded-lg text-xs sm:text-sm px-2.5 sm:px-3",
                          isCorrect && "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                        )}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e)}
                        placeholder={`Option ${index + 1}`}
                        id={optionInputId}
                      />
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <motion.div
                            whileHover={option.trim() !== "" ? { scale: 1.1 } : {}}
                            whileTap={option.trim() !== "" ? { scale: 0.95 } : {}}
                            className={option.trim() === "" ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Button
                              type="button"
                              size="icon"
                              variant={isCorrect ? "default" : "outline"}
                              className={cn(
                                "h-8 w-8 sm:h-9 sm:w-9 transition-all rounded-lg shrink-0",
                                isCorrect 
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500" 
                                  : "bg-transparent border-white/10 text-zinc-500 hover:text-white hover:bg-white/5"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsCorrect(index);
                              }}
                              disabled={option.trim() === ""}
                              title={option.trim() === "" ? "Enter text first to mark as correct" : "Mark as correct answer"}
                            >
                              <motion.div
                                initial={{ scale: isCorrect ? 1 : 0.5, opacity: isCorrect ? 1 : 0.7 }}
                                animate={{
                                  scale: isCorrect ? [1, 1.2, 1] : 0.5,
                                  opacity: isCorrect ? 1 : 0.7
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </motion.div>
                            </Button>
                          </motion.div>
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
  const options = question?.options || [];
  const correctAnswer = question?.correctAnswer || "";
  const questionText = question?.questionText || "";
  const imageUrl = question?.imageUrl;
  const optionImages = question?.optionImages || [];

  return (
    <div className="space-y-6 sm:space-y-8 flex flex-col items-center pt-2 sm:pt-4 w-full">
      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white leading-tight max-w-3xl px-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {questionText}
      </h3>

      {imageUrl && (
        <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/40 p-2 sm:p-3 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Question reference"
            className="w-full h-auto object-contain max-h-[220px] sm:max-h-[320px] rounded-xl"
          />
        </div>
      )}

      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-center -mb-2">
        Select the correct answer
      </div>

      <RadioGroup
        value={userAnswer}
        onValueChange={onChange}
        className="w-full max-w-2xl space-y-3 sm:space-y-4"
      >
        {options.map((option, index) => {
          const isCorrect = showResult && option === correctAnswer;
          const isIncorrect = showResult && userAnswer === option && option !== correctAnswer;
          const isSelected = userAnswer === option;
          const optionImage = optionImages[index];

          // Alphabet label: A, B, C, D...
          const labelChar = String.fromCharCode(65 + index);

          return (
            <motion.div
              key={`take-option-${index}`}
              className={cn(
                "w-full rounded-2xl p-4 sm:p-5 md:p-6 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center",
                isCorrect ? "bg-emerald-500/10 border-2 border-emerald-500 text-emerald-100" 
                : isIncorrect ? "bg-red-500/10 border-2 border-red-500 text-red-100" 
                : isSelected && !showResult ? "bg-indigo-500/10 border-2 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)] text-white" 
                : !showResult ? "bg-[#131316] border-2 border-transparent hover:border-white/10 text-zinc-300" : "bg-[#131316] opacity-50 border-transparent text-zinc-500"
              )}
              whileHover={!showResult ? { scale: 1.01, y: -2 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => !showResult && onChange(option)}
            >
              {isSelected && !showResult && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none" />
              )}
              
              <div className="flex items-center gap-3 sm:gap-5 relative z-10 w-full">
                {/* Selection Circle/Ring */}
                <div className="shrink-0 flex items-center justify-center">
                   <div className={cn(
                     "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all",
                     isCorrect ? "bg-emerald-500 border-emerald-500 text-white"
                     : isIncorrect ? "bg-red-500 border-red-500 text-white"
                     : isSelected && !showResult ? "border-indigo-400"
                     : "border-zinc-600"
                   )}>
                      {isCorrect && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                      {isIncorrect && <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                      {isSelected && !showResult && <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-400 rounded-full" />}
                   </div>
                </div>

                <div className="flex-1 flex gap-2 items-baseline">
                  <span className={cn(
                    "font-bold shrink-0 text-sm sm:text-base", 
                    isCorrect ? "text-emerald-400" : isIncorrect ? "text-red-400" : isSelected ? "text-indigo-300" : "text-zinc-500"
                  )}>{labelChar})</span>
                  
                  <RadioGroupItem
                    value={option}
                    id={`option-take-${index}`}
                    disabled={showResult}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`option-take-${index}`}
                    className={cn(
                      "text-sm sm:text-base font-medium cursor-pointer leading-relaxed break-words",
                      isCorrect ? "text-emerald-300" 
                      : isIncorrect ? "text-red-300" 
                      : isSelected ? "text-white" : "text-zinc-300"
                    )}
                  >
                    {option}
                  </Label>
                </div>
              </div>

              {optionImage && (
                <div className="mt-3 sm:mt-4 ml-8 sm:ml-12 w-full">
                  <div className="bg-black/50 rounded-xl overflow-hidden inline-block border border-white/10 p-1.5 max-w-full">
                    <img
                      src={optionImage}
                      alt={`Option ${labelChar}`}
                      className="max-h-[140px] sm:max-h-[200px] w-auto max-w-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </RadioGroup>

      {showResult && (
        <motion.div
          className={cn(
            "mt-8 p-6 rounded-2xl border flex items-center gap-4 max-w-2xl w-full",
            userAnswer === correctAnswer
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {userAnswer === correctAnswer ? (
            <>
              <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                 <h4 className="font-bold text-emerald-300 text-lg">Correct!</h4>
                 <p className="text-emerald-400/80 text-sm">You selected the right answer.</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                 <h4 className="font-bold text-red-400 text-lg">Incorrect</h4>
                 <p className="text-red-400/80 text-sm">The correct answer was: <strong className="text-red-300">{correctAnswer}</strong></p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}