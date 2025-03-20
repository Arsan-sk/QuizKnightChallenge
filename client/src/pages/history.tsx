import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Clock, Eye, FileEdit, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types for quiz attempts and creations
interface QuizAttempt {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number;
  maxScore: number;
  completedAt: string;
  timeTaken: number;
}

interface QuizCreation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  questionCount: number;
  attempts: number;
}

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Get quiz attempts for students
  const {
    data: quizAttempts,
    isLoading: attemptsLoading,
    error: attemptsError,
    refetch: refetchAttempts
  } = useQuery({
    queryKey: ["quizAttempts"],
    queryFn: async () => {
      const response = await fetch("/api/results/user");
      if (!response.ok) {
        throw new Error("Failed to fetch quiz attempts");
      }
      return response.json() as Promise<QuizAttempt[]>;
    },
    enabled: user?.role === "student"
  });

  // Get created quizzes for teachers
  const {
    data: createdQuizzes,
    isLoading: quizzesLoading,
    error: quizzesError,
    refetch: refetchQuizzes
  } = useQuery({
    queryKey: ["createdQuizzes"],
    queryFn: async () => {
      const response = await fetch("/api/quizzes/teacher");
      if (!response.ok) {
        throw new Error("Failed to fetch created quizzes");
      }
      return response.json() as Promise<QuizCreation[]>;
    },
    enabled: user?.role === "teacher"
  });

  // Handle loading state
  if (authLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-52 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle unauthenticated users
  if (!user) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>
              You need to be logged in to view your history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please log in to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Student view for quiz attempts
  if (user.role === "student") {
    // Loading state
    if (attemptsLoading) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>
                View your previous quiz attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Error state
    if (attemptsError) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                There was an error loading your quiz attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {attemptsError instanceof Error
                  ? attemptsError.message
                  : "Unknown error occurred"}
              </p>
              <Button 
                onClick={() => refetchAttempts()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // No attempts state
    if (!quizAttempts?.length) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>
                View your previous quiz attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quiz attempts yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't taken any quizzes yet. Start taking quizzes to track your progress!
              </p>
              <Button onClick={() => navigate("/student/quizzes")}>
                Browse Quizzes
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Display quiz attempts
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>
              View your previous quiz attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your recent quiz attempts</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">
                      {attempt.quizTitle}
                    </TableCell>
                    <TableCell>
                      {attempt.completedAt
                        ? format(new Date(attempt.completedAt), "PPP")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        (attempt.score / attempt.maxScore) >= 0.7 
                          ? "text-green-600" 
                          : (attempt.score / attempt.maxScore) >= 0.4 
                            ? "text-amber-600" 
                            : "text-red-600"
                      }`}>
                        {attempt.score}/{attempt.maxScore} 
                        ({Math.round((attempt.score / attempt.maxScore) * 100)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <Clock className="inline mr-1 h-4 w-4" /> 
                      {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/student/quiz-results/${attempt.quizId}/${attempt.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Teacher view for created quizzes
  if (user.role === "teacher") {
    // Loading state
    if (quizzesLoading) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Management</CardTitle>
              <CardDescription>
                View and manage your created quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Error state
    if (quizzesError) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                There was an error loading your created quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {quizzesError instanceof Error
                  ? quizzesError.message
                  : "Unknown error occurred"}
              </p>
              <Button 
                onClick={() => refetchQuizzes()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // No quizzes state
    if (!createdQuizzes?.length) {
      return (
        <div className="container py-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Management</CardTitle>
              <CardDescription>
                View and manage your created quizzes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes created yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't created any quizzes yet. Start creating quizzes for your students!
              </p>
              <Button onClick={() => navigate("/teacher/quiz/create")}>
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Split quizzes into published and drafts
    const publishedQuizzes = createdQuizzes.filter(quiz => quiz.published);
    const draftQuizzes = createdQuizzes.filter(quiz => !quiz.published);

    // Display created quizzes with tabs for published and drafts
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Management</CardTitle>
            <CardDescription>
              View and manage your created quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="published">
              <TabsList className="mb-4">
                <TabsTrigger value="published">
                  Published ({publishedQuizzes.length})
                </TabsTrigger>
                <TabsTrigger value="drafts">
                  Drafts ({draftQuizzes.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="published">
                <Table>
                  <TableCaption>Your published quizzes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedQuizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">
                          {quiz.title}
                          <Badge className="ml-2" variant="outline">Live</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(quiz.createdAt), "PP")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(quiz.updatedAt), "PP")}
                        </TableCell>
                        <TableCell>{quiz.questionCount}</TableCell>
                        <TableCell>
                          <BadgeCheck className="inline mr-1 h-4 w-4" /> 
                          {quiz.attempts}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/teacher/quiz/edit/${quiz.id}`)}
                            className="mr-2"
                          >
                            <FileEdit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/teacher/results/${quiz.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Results
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="drafts">
                <Table>
                  <TableCaption>Your draft quizzes</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftQuizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">
                          {quiz.title}
                          <Badge className="ml-2" variant="secondary">Draft</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(quiz.createdAt), "PP")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(quiz.updatedAt), "PP")}
                        </TableCell>
                        <TableCell>{quiz.questionCount}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/teacher/quiz/edit/${quiz.id}`)}
                          >
                            <FileEdit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/teacher/quiz/create")}>
              Create New Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback for unexpected role
  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            View your activity history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your role ({user.role}) doesn't have specific history views.</p>
        </CardContent>
      </Card>
    </div>
  );
} 