import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Question as QuestionType, Result } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { NavBar } from "@/components/layout/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/utils/analytics";

export default function QuizReviewPage() {
  const { quizId, userId } = useParams();
  const { toast } = useToast();
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  
  // Fetch quiz details
  const { data: quiz, isLoading: loadingQuiz } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    onError: (error) => {
      toast({
        title: "Error loading quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch questions
  const { data: questions, isLoading: loadingQuestions } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    onError: (error) => {
      toast({
        title: "Error loading questions",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch user's result/attempt
  const { data: userResult, isLoading: loadingResult } = useQuery<Result>({
    queryKey: [`/api/quizzes/${quizId}/results/${userId}`],
    onError: (error) => {
      toast({
        title: "Error loading student result",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Fetch user details
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: [`/api/users/${userId}`],
    onError: (error) => {
      toast({
        title: "Error loading student information",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  useEffect(() => {
    if (userResult?.answers) {
      try {
        const parsedAnswers = JSON.parse(userResult.answers);
        setUserAnswers(Array.isArray(parsedAnswers) ? parsedAnswers : []);
      } catch (error) {
        console.error("Error parsing user answers:", error);
        setUserAnswers([]);
      }
    }
  }, [userResult]);
  
  const isLoading = loadingQuiz || loadingQuestions || loadingResult || loadingStudent;
  
  if (isLoading) {
    return (
      <div>
        <NavBar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading quiz review...</span>
        </div>
      </div>
    );
  }
  
  if (!quiz || !questions || !userResult || !student) {
    return (
      <div>
        <NavBar />
        <div className="container mx-auto p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Quiz Review</h1>
          <p className="text-muted-foreground mb-6">
            The requested quiz review could not be loaded. The quiz or student attempt may not exist.
          </p>
          <Button asChild>
            <Link href={`/quiz-analytics/${quizId}`}>Return to Analytics</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const scorePercentage = userResult.totalQuestions > 0 
    ? Math.round((userResult.correctAnswers / userResult.totalQuestions) * 100) 
    : 0;
  
  return (
    <div>
      <NavBar />
      <div className="container mx-auto p-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Button variant="outline" asChild className="mb-4 md:mb-0">
              <Link href={`/quiz-analytics/${quizId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Analytics
              </Link>
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-1">{quiz.title}</h1>
            <p className="text-muted-foreground">
              Student Review: {student.username}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Final Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold">{scorePercentage}%</p>
              <p className="text-muted-foreground mt-1">
                {userResult.correctAnswers} of {userResult.totalQuestions} correct
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                Time Taken
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold">{formatTime(userResult.timeTaken)}</p>
              <p className="text-muted-foreground mt-1">
                Completed on {new Date(userResult.completedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
                Incorrect Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-4xl font-bold">{userResult.wrongAnswers}</p>
              <p className="text-muted-foreground mt-1">
                Questions that need attention
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">Detailed Question Analysis</h2>
          
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index] || "";
            const isCorrect = userAnswer === question.correctAnswer;
            
            // Sort options to put the user's correct answer at the top
            const sortedOptions = [...(question.options || [])];
            if (isCorrect && userAnswer) {
              const correctIndex = sortedOptions.findIndex(o => o === userAnswer);
              if (correctIndex > 0) {
                // Move the correct answer to the top
                const correctOption = sortedOptions.splice(correctIndex, 1)[0];
                sortedOptions.unshift(correctOption);
              }
            }
            
            return (
              <Card key={question.id} className="relative overflow-hidden border-l-4 border-l-transparent" 
                    style={{ borderLeftColor: isCorrect ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4">
                    {isCorrect ? (
                      <span className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-full text-sm flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Correct
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 font-medium px-3 py-1 rounded-full text-sm flex items-center">
                        <XCircle className="h-4 w-4 mr-1" />
                        Incorrect
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-medium mb-4 pr-24">
                    Question {index + 1}: {question.questionText}
                  </h3>
                  
                  <div className="space-y-3 mt-4">
                    {sortedOptions.map((option) => {
                      const isUserSelection = option === userAnswer;
                      const isCorrectOption = option === question.correctAnswer;
                      
                      // Determine the background and border color based on answer status
                      let bgColor = "bg-background border border-border";
                      if (isCorrectOption) bgColor = "bg-green-50 border border-green-200";
                      if (isUserSelection && !isCorrect) bgColor = "bg-red-50 border border-red-200";
                      
                      // Add extra styling for correct user selection
                      let extraClasses = "";
                      if (isUserSelection && isCorrect) {
                        extraClasses = "bg-green-100 border-green-500 border-2 shadow-sm";
                      }
                      
                      return (
                        <div
                          key={option}
                          className={`p-3 rounded-md flex items-center ${bgColor} ${extraClasses} relative`}
                        >
                          {isUserSelection && isCorrect && (
                            <span className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                              CORRECT
                            </span>
                          )}
                          
                          {isCorrectOption && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                          {isUserSelection && !isCorrectOption && <XCircle className="h-4 w-4 mr-2 text-red-600" />}
                          <span className={`${isCorrectOption ? 'font-medium' : ''}`}>{option}</span>
                          
                          {isUserSelection && (
                            <span className="ml-auto text-sm font-medium">
                              Student's choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
} 