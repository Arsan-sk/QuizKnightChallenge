import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Zap, Trophy, Eye, ArrowRight, Users, BookOpen, BarChart3 } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Eye,
    title: "Proctored Excellence",
    desc: "Webcam monitoring, tab detection, and auto-submit on violations.",
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.12)",
  },
  {
    icon: Zap,
    title: "Neural Speed Analytics",
    desc: "AI-powered insights to flag tough questions and personalize learning.",
    color: "hsl(var(--accent-h) var(--accent-s) var(--accent-l))",
    bg: "hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.12)",
  },
  {
    icon: Trophy,
    title: "Global Leaderboards",
    desc: "Compete, climb the ranks, and earn achievement badges.",
    color: "hsl(145 63% 48%)",
    bg: "hsl(145 63% 48% / 0.12)",
  },
];

const stats = [
  { value: "1.2k+", label: "Daily Active" },
  { value: "50k+", label: "Total Quizzes" },
  { value: "24/7", label: "Support" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] bg-mesh-hero">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.8)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary))", boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.5)" }}
            >
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-bold text-base text-[hsl(var(--foreground))]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              QuizKTC
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button
                size="sm"
                className="font-semibold"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)",
                }}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...stagger} initial="initial" animate="animate" className="space-y-6">
            {/* Badge */}
            <motion.div {...fadeUp}>
              <span className="badge-primary text-xs">
                🎮 Gamified Learning Platform
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              {...fadeUp}
              className="text-5xl md:text-6xl font-extrabold leading-tight text-[hsl(var(--foreground))]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.03em" }}
            >
              Quizzes That{" "}
              <span className="gradient-text">Actually Matter</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...fadeUp}
              className="text-lg text-[hsl(var(--muted-foreground))] max-w-lg leading-relaxed"
            >
              A modern platform for teachers and students — combining live quizzes,
              AI analytics, progress tracking, and integrity-first proctoring.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    className="font-semibold gap-2 px-8"
                    style={{
                      background: "hsl(var(--primary))",
                      boxShadow: "0 6px 20px -4px hsl(var(--primary) / 0.5)",
                    }}
                  >
                    Claim Your Shield
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/student/quizzes">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-medium gap-2 border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]"
                >
                  <BookOpen className="w-5 h-5" />
                  Browse Quizzes
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div {...fadeUp} className="flex flex-wrap gap-3 pt-2">
              {["AI Analytics", "Live Proctoring", "Leaderboards"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  ✦ {tag}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero illustration — Liquid Glass card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Background glow blobs */}
            <div
              className="absolute w-72 h-72 rounded-full blur-3xl opacity-20"
              style={{ background: "hsl(var(--primary))", top: "10%", left: "10%" }}
            />
            <div
              className="absolute w-48 h-48 rounded-full blur-3xl opacity-15"
              style={{ background: "hsl(270 80% 65%)", bottom: "10%", right: "10%" }}
            />

            {/* Liquid glass hero card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: "hsl(var(--card) / 0.6)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid hsl(var(--border) / 0.5)",
                boxShadow: "0 24px 64px -12px hsl(0 0% 0% / 0.6), 0 0 0 1px hsl(var(--primary) / 0.1), inset 0 1px 0 hsl(255 255 255 / 0.08)",
              }}
            >
              {/* Card header */}
              <div
                className="px-6 py-4 border-b"
                style={{
                  borderColor: "hsl(var(--border) / 0.4)",
                  background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(270 80% 60% / 0.15))",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[hsl(var(--primary))] flex items-center justify-center">
                      <Shield className="w-3 h-3 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      QuizKTC
                    </span>
                  </div>
                  <span className="badge-primary text-xs">LIVE</span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Current Question (3 / 10)</div>
                  <div className="text-sm font-medium text-white leading-relaxed">
                    What is the time complexity of binary search?
                  </div>
                </div>

                <div className="space-y-2">
                  {["O(log n) ✓", "O(n)", "O(n²)", "O(1)"].map((opt, i) => (
                    <div
                      key={opt}
                      className="px-4 py-2.5 rounded-xl text-sm text-white/80 border transition-all"
                      style={{
                        background: i === 0
                          ? "hsl(145 63% 42% / 0.25)"
                          : "hsl(var(--muted) / 0.4)",
                        borderColor: i === 0
                          ? "hsl(145 63% 42% / 0.5)"
                          : "hsl(var(--border) / 0.3)",
                        color: i === 0 ? "hsl(145 63% 70%)" : "hsl(var(--muted-foreground))",
                        fontWeight: i === 0 ? 600 : 400,
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center justify-between text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <span>📍 Score: 2,450 pts</span>
                  <span className="text-[hsl(var(--accent-h) var(--accent-s) var(--accent-l))]">
                    ⏱ 00:42 left
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="py-8 border-y border-[hsl(var(--border))]"
        >
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <div
                  className="text-3xl font-extrabold stat-number gradient-text"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="py-20"
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2
              className="text-3xl font-extrabold text-[hsl(var(--foreground))] mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Built for Performance
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto">
              Everything you need for modern, data-driven academic assessments.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="clay-card card-hover p-6 space-y-4"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: f.bg }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} strokeWidth={2} />
                </div>
                <div>
                  <h3
                    className="font-bold text-[hsl(var(--foreground))] mb-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeUp}
          className="py-16 text-center"
        >
          <div
            className="clay-card p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(270 80% 60% / 0.1))",
              border: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
            />
            <h2
              className="text-3xl font-extrabold text-[hsl(var(--foreground))] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Start Your Learning Journey
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8 max-w-md mx-auto">
              Join thousands of students and teachers already using QuizKTC.
            </p>
            <Link href="/auth">
              <motion.div whileTap={{ scale: 0.97 }} className="inline-block">
                <Button
                  size="lg"
                  className="font-semibold gap-2 px-10"
                  style={{
                    background: "hsl(var(--primary))",
                    boxShadow: "0 6px 24px -4px hsl(var(--primary) / 0.6)",
                  }}
                >
                  Join Now — It's Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-6 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[hsl(var(--primary))] flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-sm font-bold text-[hsl(var(--foreground))]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              QuizKTC
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            © 2025 QuizKTC Digital Sanctuary. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
