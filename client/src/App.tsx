import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { ProfileProvider } from "./hooks/use-profile";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "./hooks/use-theme";
import { NavigationWithProfile } from "./components/profile/navigation-with-profile";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import QuizCreate from "@/pages/quiz-create";
import QuizTake from "@/pages/quiz-take";
import QuizBrowse from "@/pages/quiz-browse";
import LiveQuizMonitorPage from "@/pages/live-quiz-monitor";
import ProfilePage from "@/pages/profile-page";
import ProfileEditPage from "@/pages/profile-edit";
import HistoryPage from "@/pages/history";
import AchievementsPage from "@/pages/achievements";
import LeaderboardPage from "@/pages/leaderboard";
import QuizAnalyticsPage from "@/pages/QuizAnalytics";
import QuizReviewPage from "@/pages/quiz-review";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
        path="/quiz-analytics/:id" 
        element={<QuizAnalyticsPage />}
        requiredRoles={["teacher"]}
      />
      <ProtectedRoute 
        path="/quiz-review/:quizId/:userId" 
        component={QuizReviewPage}
        requiredRoles={["teacher"]}
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
      <ProtectedRoute 
        path="/profile" 
        component={ProfilePage}
      />
      <ProtectedRoute 
        path="/profile/edit" 
        component={ProfileEditPage}
      />
      <ProtectedRoute 
        path="/history" 
        component={HistoryPage}
      />
      <ProtectedRoute 
        path="/achievements" 
        component={AchievementsPage}
      />
      <ProtectedRoute 
        path="/leaderboard" 
        component={LeaderboardPage}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <NavigationWithProfile>
      <Router />
    </NavigationWithProfile>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <AppContent />
            <Toaster />
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;