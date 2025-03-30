import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  element,
  role,
  requiredRoles,
}: {
  path: string;
  component?: () => React.JSX.Element;
  element?: React.ReactNode;
  role?: "teacher" | "student";
  requiredRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (role && user.role !== role) {
    return (
      <Route path={path}>
        <Redirect to={`/${user.role}`} />
      </Route>
    );
  }

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to={`/${user.role}`} />
      </Route>
    );
  }

  if (Component) {
    return <Route path={path} component={Component} />;
  }
  
  return <Route path={path}>{element}</Route>;
}