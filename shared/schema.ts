import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for better type safety
export const roleEnum = pgEnum("role", ["teacher", "student"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const questionTypeEnum = pgEnum("question_type", ["mcq", "true_false"]);
export const quizTypeEnum = pgEnum("quiz_type", ["standard", "live"]);
export const branchEnum = pgEnum("branch", ["CS", "AIML", "DS", "ECS", "ECE", "CE", "ME"]);
export const yearEnum = pgEnum("year", ["1st", "2nd", "3rd", "4th"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // Keep as text with enum for now for compatibility
  role: text("role", { enum: ["teacher", "student"] }).notNull(),
  points: integer("points").default(0),
  // New profile fields
  name: text("name"),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  branch: text("branch", { enum: ["CS", "AIML", "DS", "ECS", "ECE", "CE", "ME"] }),
  year: text("year", { enum: ["1st", "2nd", "3rd", "4th"] }),
  email: text("email"),
  lastActive: timestamp("last_active").defaultNow(),
  achievements: text("achievements").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  displayName: text("display_name"),
  profileImage: text("profile_image"),
  friendIds: integer("friend_ids").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").notNull(),
  // Keep as text with enum for now for compatibility
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  isPublic: boolean("is_public").default(false),
  quizType: quizTypeEnum("quiz_type").default("standard"),
  isActive: boolean("is_active").default(false),
  duration: integer("duration"),  // Duration in minutes for live quizzes
  // Add new fields for targeting specific branches and years
  targetBranch: text("target_branch", { enum: ["CS", "AIML", "DS", "ECS", "ECE", "CE", "ME"] }),
  targetYear: text("target_year", { enum: ["1st", "2nd", "3rd", "4th"] }),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  // Keep as text with enum for now for compatibility
  questionType: text("question_type", { enum: ["mcq", "true_false"] }).notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").default(1),  // Points awarded for correct answer
  imageUrl: text("image_url"),  // URL for question image
  optionImages: text("option_images").array(),  // URLs for option images
  createdAt: timestamp("created_at").defaultNow(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: integer("wrong_answers").notNull(),
  timeTaken: integer("time_taken").notNull(),  // Time taken in seconds
  pointsEarned: integer("points_earned").default(0), // Points earned for this attempt
  completedAt: timestamp("completed_at").defaultNow(),
});

// Add achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  criteria: text("criteria").notNull(), // JSON string with criteria for earning this achievement
  createdAt: timestamp("created_at").defaultNow(),
});

// Add user achievements table to track which users have which achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Add friends table
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Validation schemas for API requests
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  profilePicture: true,
  bio: true,
  branch: true,
  year: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  profilePicture: true,
  bio: true,
  branch: true,
  year: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  difficulty: true,
  isPublic: true,
  quizType: true,
  duration: true,
  targetBranch: true,
  targetYear: true,
});

export const updateQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  difficulty: true,
  isPublic: true,
  quizType: true,
  duration: true,
  isActive: true,
  targetBranch: true,
  targetYear: true,
  startTime: true,
  endTime: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  questionText: true,
  questionType: true,
  options: true,
  correctAnswer: true,
  quizId: true,
  points: true,
  imageUrl: true,
  optionImages: true,
});

export const updateQuestionSchema = createInsertSchema(questions).pick({
  questionText: true,
  questionType: true,
  options: true,
  correctAnswer: true,
  points: true,
  imageUrl: true,
  optionImages: true,
});

export const insertResultSchema = createInsertSchema(results).pick({
  quizId: true,
  score: true,
  totalQuestions: true,
  correctAnswers: true,
  wrongAnswers: true,
  timeTaken: true,
  pointsEarned: true,
});

export const submitResultSchema = insertResultSchema.extend({
  pointsEarned: z.number().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type UpdateQuiz = z.infer<typeof updateQuizSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;

export type User = typeof users.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;
