import React, { useState } from "react";
import { ProfileButton } from "./profile-button";
import { ProfileSidebar } from "./profile-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { 
  ThemeToggle 
} from "@/components/ui/theme-toggle";
import { 
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "@/components/ui/navigation-menu";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavigationWithProfileProps {
  children: React.ReactNode;
}

export function NavigationWithProfile({ children }: NavigationWithProfileProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  
  const teacherLinks = [
    { href: "/teacher", label: "Dashboard" },
    { href: "/teacher/quiz/create", label: "Create Quiz" },
  ];
  
  const studentLinks = [
    { href: "/student", label: "Dashboard" },
    { href: "/student/quizzes", label: "Browse Quizzes" },
  ];
  
  const links = isTeacher ? teacherLinks : isStudent ? studentLinks : [];
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-2 px-4">
          <div className="flex justify-between items-center">
            <Link href={isTeacher ? "/teacher" : isStudent ? "/student" : "/"}>
              <a className="flex items-center space-x-2">
                <span className="font-bold text-xl">QuizKnight</span>
              </a>
            </Link>
            
            {user && (
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  {links.map((link) => (
                    <NavigationMenuItem key={link.href}>
                      <Link href={link.href}>
                        <NavigationMenuLink
                          className={cn(
                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            location === link.href && "bg-accent text-accent-foreground"
                          )}
                        >
                          {link.label}
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
            
            <div className="flex items-center space-x-1">
              <ThemeToggle />
              {user && <ProfileButton onClick={() => setProfileOpen(true)} />}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <ProfileSidebar open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
} 