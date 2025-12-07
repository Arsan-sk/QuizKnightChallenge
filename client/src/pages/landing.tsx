import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
// NavBar removed per request

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">

      <main className="container mx-auto px-4 py-12">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <motion.h1
              className="text-4xl md:text-5xl font-extrabold leading-tight mb-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              QuizKTC — Gamified, Proctored, and Insightful Quizzes
            </motion.h1>

            <motion.p
              className="text-muted-foreground mb-6 max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              A modern platform for teachers and students combining live quizzes,
              AI analytics, progress tracking, and integrity-first proctoring.
              Make assessments fair, engaging, and data-driven.
            </motion.p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth">Join Now</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/student/quizzes">Browse Quizzes</Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm">
              <Card className="p-4">
                <CardContent>
                  <h4 className="font-semibold">Teacher-Friendly</h4>
                  <p className="text-sm text-muted-foreground">Create, schedule, and monitor quizzes with ease.</p>
                </CardContent>
              </Card>
              <Card className="p-4">
                <CardContent>
                  <h4 className="font-semibold">Student-Centric</h4>
                  <p className="text-sm text-muted-foreground">Engaging UI, live leaderboards, and immediate feedback.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-lg"
            >
              <div className="bg-card rounded-xl p-6 shadow-lg border">
                {/* Simple illustrative SVG representing quizzes and AI */}
                <div className="flex items-center justify-center mb-4">
                  <svg viewBox="0 0 160 120" className="w-64 h-48" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <rect x="6" y="10" rx="8" ry="8" width="148" height="90" fill="#f8fafc" stroke="url(#g1)" strokeWidth="2" />
                    <circle cx="34" cy="40" r="6" fill="#60a5fa" />
                    <rect x="50" y="34" width="70" height="6" rx="3" fill="#94a3b8" />
                    <rect x="50" y="46" width="50" height="6" rx="3" fill="#c7d2fe" />
                    <rect x="50" y="58" width="30" height="6" rx="3" fill="#bbf7d0" />
                    <path d="M120 24 L140 36 L120 48" stroke="#06b6d4" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-center">Interactive Quizzes + AI Insights</h3>
                <p className="text-sm text-muted-foreground mt-2 text-center">Review performance, track progress, and understand strengths with automated analytics.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Core Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4">
              <CardContent>
                <h4 className="font-semibold">Proctored Exams</h4>
                <p className="text-sm text-muted-foreground">Webcam monitoring, tab switch detection, and automatic submission on violations.</p>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent>
                <h4 className="font-semibold">AI Quiz Analysis</h4>
                <p className="text-sm text-muted-foreground">Smart analytics to flag tough questions, common mistakes, and personalize learning.</p>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardContent>
                <h4 className="font-semibold">Leaderboards & Reports</h4>
                <p className="text-sm text-muted-foreground">Motivate students with leaderboards and give teachers in-depth reports.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-muted-foreground mb-6">Create an account, join a class, or try a demo quiz to experience QuizKTC.</p>
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/auth">Join Now</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
