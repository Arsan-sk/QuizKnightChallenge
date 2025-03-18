import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "./hooks/use-theme";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import QuizCreate from "@/pages/quiz-create";
import QuizTake from "@/pages/quiz-take";
import QuizBrowse from "@/pages/quiz-browse";
import LiveQuizMonitorPage from "@/pages/live-quiz-monitor";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/auth" />
      </Route>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute 
        path="/teacher" 
        component={TeacherDashboard}
        role="teacher"
      />
      <ProtectedRoute 
        path="/teacher/quiz/create" 
        component={QuizCreate}
        role="teacher"
      />
      <ProtectedRoute 
        path="/teacher/monitor/:quizId" 
        component={LiveQuizMonitorPage}
        role="teacher"
      />
      <ProtectedRoute 
        path="/student" 
        component={StudentDashboard}
        role="student"
      />
      <ProtectedRoute 
        path="/student/quizzes" 
        component={QuizBrowse}
        role="student"
      />
      <ProtectedRoute 
        path="/student/quiz/:id" 
        component={QuizTake}
        role="student"
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;