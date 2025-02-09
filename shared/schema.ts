import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["teacher", "student"] }).notNull(),
  points: integer("points").default(0),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", { enum: ["mcq", "true_false"] }).notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer").notNull(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  timeTaken: integer("time_taken").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  difficulty: true,
  isPublic: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  questionText: true,
  questionType: true,
  options: true,
  correctAnswer: true,
});

export const insertResultSchema = createInsertSchema(results).pick({
  quizId: true,
  score: true,
  timeTaken: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Result = typeof results.$inferSelect;
