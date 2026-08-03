import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Shield, GraduationCap, BookOpen, Zap, Trophy, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabType = "login" | "register";
type RoleType = "student" | "teacher";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [tab, setTab] = useState<TabType>("login");
  const [role, setRole] = useState<RoleType>("student");

  useEffect(() => {
    if (user) {
      setLocation(user.role === "teacher" ? "/teacher" : "/student");
    }
  }, [user, setLocation]);

  const loginForm = useForm({
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema as any),
    defaultValues: { username: "", password: "", role: "student" as const },
  });

  const features = [
    { icon: Shield, label: "Proctored Excellence", desc: "Advanced anti-cheat sanctuary architecture." },
    { icon: Zap, label: "Neural Speed", desc: "Real-time powered data analytics." },
    { icon: Trophy, label: "Global Leaderboards", desc: "Climb the ranks of the digital sanctuary." },
  ];

  return (
    <div className="min-h-screen flex items-stretch bg-[hsl(var(--background))]">
      {/* Left — Form panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-12 max-w-xl mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--primary))", boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.5)" }}
          >
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-base text-[hsl(var(--foreground))]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            QuizKTC
          </span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-extrabold text-[hsl(var(--foreground))] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {tab === "login"
              ? "Step back into the digital sanctuary."
              : "Join the QuizKTC digital sanctuary today."}
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "hsl(var(--muted))" }}
        >
          {(["login", "register"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                tab === t
                  ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {t === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    {...loginForm.register("username")}
                    placeholder="your_username"
                    className="pl-9 input-field"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="password"
                    {...loginForm.register("password")}
                    placeholder="••••••••"
                    className="pl-9 input-field"
                  />
                </div>
              </div>
              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  type="submit"
                  className="w-full font-semibold h-11"
                  disabled={loginMutation.isPending}
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 4px 16px -4px hsl(var(--primary) / 0.5)",
                  }}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              onSubmit={registerForm.handleSubmit((data) =>
                registerMutation.mutate({ ...data, role })
              )}
              className="space-y-4"
            >
              {/* Role selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[hsl(var(--foreground))]">
                  I am a...
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "student", icon: GraduationCap, label: "Student" },
                    { value: "teacher", icon: BookOpen, label: "Teacher" },
                  ] as { value: RoleType; icon: any; label: string }[]).map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        registerForm.setValue("role", r.value as any);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                        role === r.value
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)]"
                      )}
                    >
                      <r.icon className="w-4 h-4" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[hsl(var(--foreground))]">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    {...registerForm.register("username")}
                    placeholder="choose_username"
                    className="pl-9 input-field"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="password"
                    {...registerForm.register("password")}
                    placeholder="••••••••"
                    className="pl-9 input-field"
                  />
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
                <Button
                  type="submit"
                  className="w-full font-semibold h-11"
                  disabled={registerMutation.isPending}
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 4px 16px -4px hsl(var(--primary) / 0.5)",
                  }}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Right — Brand panel (desktop only) */}
      <div
        className="hidden md:flex flex-col justify-center px-12 py-12 w-[420px] relative overflow-hidden rounded-l-3xl"
        style={{
          background: "linear-gradient(135deg, hsl(252 87% 45%) 0%, hsl(270 80% 50%) 50%, hsl(280 75% 45%) 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ background: "hsl(280 80% 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full blur-3xl opacity-25"
          style={{ background: "hsl(252 90% 60%)" }}
        />

        {/* Large "2" background element */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[280px] font-black opacity-[0.06] leading-none select-none"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "white" }}
        >
          2
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <span
              className="text-xs font-bold tracking-widest text-white/60 uppercase"
            >
              The Obsidian Paladin System
            </span>
          </div>
          <div>
            <h2
              className="text-4xl font-extrabold text-white leading-tight mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Master the Digital Domain.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Experience a high-depth environment designed for elite learning and competitive assessment.
            </p>
          </div>
          <div className="space-y-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <f.icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{f.label}</div>
                  <div className="text-white/60 text-xs mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
