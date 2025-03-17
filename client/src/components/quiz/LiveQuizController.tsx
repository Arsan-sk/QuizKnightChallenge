import { useState, useEffect, useCallback } from "react";
import { Question as QuestionType } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Camera, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface LiveQuizControllerProps {
  questions: QuestionType[];
  duration: number; // in minutes
  onAnswer: (answer: string, questionIndex: number) => void;
  onComplete: () => void;
  userAnswers: string[];
}

export function LiveQuizController({ 
  questions, 
  duration, 
  onAnswer, 
  onComplete,
  userAnswers
}: LiveQuizControllerProps) {
  // Randomize question order for each student
  const [randomizedQuestions, setRandomizedQuestions] = useState<QuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // convert to seconds
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [screenshotNotification, setScreenshotNotification] = useState(false);
  const { toast } = useToast();
  
  // Calculate time per question based on total duration and number of questions
  const timePerQuestion = Math.floor((duration * 60) / questions.length);
  
  // Initialize randomized questions on component mount
  useEffect(() => {
    if (questions.length > 0) {
      // Create a shuffled copy of the questions array
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setRandomizedQuestions(shuffled);
      setQuestionTimeRemaining(timePerQuestion);
    }
  }, [questions, timePerQuestion]);
  
  // Handle quiz timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, onComplete]);
  
  // Handle per-question timer
  useEffect(() => {
    if (questionTimeRemaining <= 0) {
      // Move to next question when time runs out
      if (currentQuestionIndex < randomizedQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionTimeRemaining(timePerQuestion);
      } else {
        onComplete();
      }
      return;
    }
    
    const timer = setInterval(() => {
      setQuestionTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [questionTimeRemaining, currentQuestionIndex, randomizedQuestions.length, timePerQuestion, onComplete]);
  
  // Handle screenshot simulation
  useEffect(() => {
    // Simulate periodic screenshots (every 30 seconds)
    const screenshotInterval = setInterval(() => {
      // Show notification that a screenshot was taken
      setScreenshotNotification(true);
      
      // In a real implementation, this would trigger a screenshot and send it to the server
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setScreenshotNotification(false);
      }, 3000);
    }, 30000);
    
    return () => clearInterval(screenshotInterval);
  }, []);
  
  // Handle current question answer
  const handleAnswer = useCallback((answer: string) => {
    // Map the randomized question back to its original index
    const originalIndex = questions.findIndex(q => 
      q.id === randomizedQuestions[currentQuestionIndex].id
    );
    
    onAnswer(answer, originalIndex);
    
    // Move to next question
    if (currentQuestionIndex < randomizedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimeRemaining(timePerQuestion);
    } else {
      onComplete();
    }
  }, [currentQuestionIndex, onAnswer, onComplete, questions, randomizedQuestions, timePerQuestion]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // If questions haven't been randomized yet, show loading
  if (randomizedQuestions.length === 0) {
    return <div className="text-center p-4">Preparing quiz questions...</div>;
  }
  
  const currentQuestion = randomizedQuestions[currentQuestionIndex];
  
  return (
    <div className="relative">
      {/* Screenshot notification */}
      {screenshotNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded flex items-center gap-2 z-10"
        >
          <Camera className="h-4 w-4" />
          <span className="text-sm">Screenshot taken for proctoring</span>
        </motion.div>
      )}
      
      {/* Timer bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">Quiz time remaining:</span>
          </div>
          <span className="font-medium">{formatTime(timeRemaining)}</span>
        </div>
        <Progress value={(timeRemaining / (duration * 60)) * 100} className="h-2" />
      </div>
      
      {/* Question timer */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Time for this question:</span>
          <span className="font-medium">{formatTime(questionTimeRemaining)}</span>
        </div>
        <Progress 
          value={(questionTimeRemaining / timePerQuestion) * 100} 
          className="h-2" 
          indicatorColor={questionTimeRemaining < 10 ? "bg-red-500" : undefined}
        />
      </div>
      
      {/* Question counter */}
      <div className="mb-6 text-sm text-center">
        Question {currentQuestionIndex + 1} of {randomizedQuestions.length}
      </div>
      
      {/* Current question */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <h3 className="text-xl font-medium mb-4">{currentQuestion.questionText}</h3>
        
        {/* Answer options */}
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full text-left p-3 rounded-md border hover:bg-primary/10 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 