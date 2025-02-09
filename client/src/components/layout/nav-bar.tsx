import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function NavBar() {
  const { user, logoutMutation } = useAuth();

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">QuizKtc</h1>
          <span className="text-muted-foreground">
            Logged in as {user?.username} ({user?.role})
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            "Logging out..."
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </div>
    </nav>
  );
}
