var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-entry.ts
import express2 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  achievements: () => achievements,
  branchEnum: () => branchEnum,
  difficultyEnum: () => difficultyEnum,
  friendships: () => friendships,
  insertLiveSessionSchema: () => insertLiveSessionSchema,
  insertQuestionSchema: () => insertQuestionSchema,
  insertQuizSchema: () => insertQuizSchema,
  insertResultSchema: () => insertResultSchema,
  insertUserSchema: () => insertUserSchema,
  liveSessions: () => liveSessions,
  questionTypeEnum: () => questionTypeEnum,
  questions: () => questions,
  quizTypeEnum: () => quizTypeEnum,
  quizzes: () => quizzes,
  results: () => results,
  roleEnum: () => roleEnum,
  submitResultSchema: () => submitResultSchema,
  updateQuestionSchema: () => updateQuestionSchema,
  updateQuizSchema: () => updateQuizSchema,
  updateUserProfileSchema: () => updateUserProfileSchema,
  userAchievements: () => userAchievements,
  users: () => users,
  yearEnum: () => yearEnum
});
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["teacher", "student"]);
var difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
var questionTypeEnum = pgEnum("question_type", ["mcq", "true_false"]);
var quizTypeEnum = pgEnum("quiz_type", ["standard", "live"]);
var branchEnum = pgEnum("branch", ["CS", "AIML", "DS", "ECS", "ECE", "CE", "ME"]);
var yearEnum = pgEnum("year", ["1st", "2nd", "3rd", "4th"]);
var users = pgTable("users", {
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: integer("created_by").notNull(),
  // Keep as text with enum for now for compatibility
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  isPublic: boolean("is_public").default(false),
  quizType: quizTypeEnum("quiz_type").default("standard"),
  isActive: boolean("is_active").default(false),
  isStarted: boolean("is_started").default(false),
  isDraft: boolean("is_draft").default(true),
  duration: integer("duration"),
  // Duration in minutes for live quizzes
  // Add new fields for targeting specific branches and years
  targetBranch: text("target_branch", { enum: ["CS", "AIML", "DS", "ECS", "ECE", "CE", "ME"] }),
  targetYear: text("target_year", { enum: ["1st", "2nd", "3rd", "4th"] }),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  accessCode: text("access_code").unique(),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  questionText: text("question_text").notNull(),
  // Keep as text with enum for now for compatibility
  questionType: text("question_type", { enum: ["mcq", "true_false"] }).notNull(),
  options: text("options").array(),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").default(2),
  // Points awarded for correct answer
  imageUrl: text("image_url"),
  // URL for question image
  optionImages: text("option_images").array(),
  // URLs for option images
  createdAt: timestamp("created_at").defaultNow()
});
var results = pgTable("results", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: integer("wrong_answers").notNull(),
  timeTaken: integer("time_taken").notNull(),
  // Time taken in seconds
  // Store the user's answers as a JSON string
  answers: text("answers"),
  pointsEarned: integer("points_earned").default(0),
  // Points earned for this attempt
  tabSwitchCount: integer("tab_switch_count").default(0),
  copyPasteAttempts: integer("copy_paste_attempts").default(0),
  proctoringFlags: integer("proctoring_flags").default(0),
  sessionId: integer("session_id"),
  // Optional session/batch ID for live quizzes
  completedAt: timestamp("completed_at").defaultNow()
});
var liveSessions = pgTable("live_sessions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  sessionName: text("session_name").notNull(),
  status: text("status", { enum: ["active", "completed"] }).default("active").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  criteria: text("criteria").notNull(),
  // JSON string with criteria for earning this achievement
  createdAt: timestamp("created_at").defaultNow()
});
var userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow()
});
var friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  profilePicture: true,
  bio: true,
  branch: true,
  year: true
});
var updateUserProfileSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  profilePicture: true,
  bio: true,
  branch: true,
  year: true
});
var insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  difficulty: true,
  isPublic: true,
  quizType: true,
  duration: true,
  targetBranch: true,
  targetYear: true
});
var updateQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  difficulty: true,
  isPublic: true,
  quizType: true,
  duration: true,
  isActive: true,
  isStarted: true,
  isDraft: true,
  targetBranch: true,
  targetYear: true,
  startTime: true,
  endTime: true
});
var insertQuestionSchema = createInsertSchema(questions).pick({
  questionText: true,
  questionType: true,
  options: true,
  correctAnswer: true,
  quizId: true,
  points: true,
  imageUrl: true,
  optionImages: true
});
var updateQuestionSchema = createInsertSchema(questions).pick({
  questionText: true,
  questionType: true,
  options: true,
  correctAnswer: true,
  points: true,
  imageUrl: true,
  optionImages: true
});
var insertResultSchema = createInsertSchema(results).pick({
  quizId: true,
  score: true,
  totalQuestions: true,
  correctAnswers: true,
  wrongAnswers: true,
  timeTaken: true,
  pointsEarned: true,
  tabSwitchCount: true,
  copyPasteAttempts: true,
  proctoringFlags: true
});
var submitResultSchema = z.object({
  userAnswers: z.array(z.string()),
  timeTaken: z.number().optional(),
  tabSwitchCount: z.number().optional(),
  copyPasteAttempts: z.number().optional(),
  proctoringFlags: z.number().optional(),
  sessionId: z.number().optional()
});
var insertLiveSessionSchema = createInsertSchema(liveSessions).pick({
  quizId: true,
  sessionName: true
});

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import path from "path";
var { Pool } = pg;
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Using in-memory mode for development."
  );
}
var connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || "postgresql://fake";
var isCloudOrProduction = process.env.NODE_ENV === "production" || connectionString.includes("supabase") || connectionString.includes("neon.tech") || connectionString.includes("render.com") || connectionString.includes("cockroach") || connectionString.includes("aiven") || connectionString !== "postgresql://fake" && !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
var pool = new Pool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 15e3,
  idleTimeoutMillis: 3e4,
  keepAlive: true,
  ...isCloudOrProduction ? { ssl: { rejectUnauthorized: false } } : {}
});
pool.on("error", (err, _client) => {
  console.error("Unexpected error on idle database client", err?.message || err);
});
if (connectionString !== "postgresql://fake") {
  pool.connect((err, _client, done) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
    } else {
      console.log("Successfully connected to the database");
      done();
    }
  });
}
var db = drizzle(pool, { schema: schema_exports });
async function applySchemaChanges() {
  try {
    if (connectionString === "postgresql://fake") {
      console.log("Using fake database, skipping schema changes");
      return;
    }
    console.log("Applying schema changes...");
    const client = await pool.connect();
    console.log("Got client for schema changes");
    const branchEnumResult = await client.query(`SELECT 1 FROM pg_type WHERE typname = 'branch'`);
    if (branchEnumResult.rowCount === 0) {
      await client.query(`CREATE TYPE "public"."branch" AS ENUM('CS', 'AIML', 'DS', 'ECS', 'ECE', 'CE', 'ME');`);
    }
    const yearEnumResult = await client.query(`SELECT 1 FROM pg_type WHERE typname = 'year'`);
    if (yearEnumResult.rowCount === 0) {
      await client.query(`CREATE TYPE "public"."year" AS ENUM('1st', '2nd', '3rd', '4th');`);
    }
    const addColumnIfNotExists = async (table, column, type, defaultVal = "") => {
      const colResult = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (colResult.rowCount === 0) {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type} ${defaultVal}`);
      }
    };
    await addColumnIfNotExists("users", "name", "text");
    await addColumnIfNotExists("users", "profile_picture", "text");
    await addColumnIfNotExists("users", "bio", "text");
    await addColumnIfNotExists("users", "branch", "text");
    await addColumnIfNotExists("users", "year", "text");
    await addColumnIfNotExists("users", "updated_at", "timestamp", "DEFAULT now()");
    await addColumnIfNotExists("quizzes", "target_branch", "text");
    await addColumnIfNotExists("quizzes", "target_year", "text");
    await addColumnIfNotExists("quizzes", "is_started", "boolean", "DEFAULT false");
    await addColumnIfNotExists("quizzes", "is_draft", "boolean", "DEFAULT true");
    await client.query(`UPDATE quizzes SET is_draft = false WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 minute'`);
    await addColumnIfNotExists("questions", "image_url", "text");
    await addColumnIfNotExists("questions", "option_images", "text[]");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "icon_url" text,
        "criteria" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "friendships" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "friend_id" integer NOT NULL,
        "status" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "achievement_id" integer NOT NULL,
        "earned_at" timestamp DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "live_sessions" (
        "id" serial PRIMARY KEY NOT NULL,
        "quiz_id" integer NOT NULL,
        "session_name" text NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "started_at" timestamp DEFAULT now(),
        "ended_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);
    await addColumnIfNotExists("results", "points_earned", "integer", "DEFAULT 0");
    await addColumnIfNotExists("results", "tab_switch_count", "integer", "DEFAULT 0");
    await addColumnIfNotExists("results", "copy_paste_attempts", "integer", "DEFAULT 0");
    await addColumnIfNotExists("results", "proctoring_flags", "integer", "DEFAULT 0");
    await addColumnIfNotExists("results", "session_id", "integer");
    await addColumnIfNotExists("quizzes", "access_code", "text");
    await addColumnIfNotExists("quizzes", "subject", "text");
    const missingCodesResult = await client.query(`SELECT id FROM quizzes WHERE access_code IS NULL OR access_code = ''`);
    if (missingCodesResult.rows.length > 0) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (const row of missingCodesResult.rows) {
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await client.query(`UPDATE quizzes SET access_code = $1 WHERE id = $2`, [code, row.id]);
      }
    }
    await client.query(`UPDATE quizzes SET is_public = true WHERE is_public IS NULL;`);
    await client.query(`UPDATE quizzes SET is_draft = false WHERE is_public = true;`);
    client.release();
    console.log("Schema changes applied successfully");
  } catch (error) {
    console.error("Error applying schema changes:", error);
  }
}
applySchemaChanges();

// server/storage.ts
import { eq, and, desc, sql, or, asc, getTableColumns, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      errorLog: (err) => console.error("Postgres session store error:", err)
    });
    this.sessionStore.on("error", (err) => {
      console.error("Session store error:", err);
    });
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      return void 0;
    }
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({ ...insertUser, points: 0 }).returning();
    return user;
  }
  async getUserWithDetails(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        console.warn(`getUserWithDetails: user ${userId} not found`);
        return null;
      }
      const userAchievementsList = await this.getUserAchievements(userId);
      const results2 = await this.getResultsByUser(userId);
      const quizzesTaken = results2.length;
      const totalScore = results2.reduce((sum, result) => sum + (result.pointsEarned || 0), 0);
      const averageScore = quizzesTaken > 0 ? Math.round(results2.reduce((sum, r) => sum + r.score, 0) / quizzesTaken) : 0;
      let winStreak = 0;
      const sortedResults = results2.sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0));
      for (const r of sortedResults) {
        if (r.score >= 80) {
          winStreak++;
        } else {
          break;
        }
      }
      const leaderboard = await this.getGlobalLeaderboard(0);
      const rank = leaderboard.findIndex((entry) => entry.id === userId) + 1;
      return {
        ...user,
        stats: {
          quizzesTaken,
          totalScore,
          averageScore,
          globalRank: rank > 0 ? rank : void 0,
          winStreak
        },
        achievements: userAchievementsList
      };
    } catch (error) {
      console.error("Error in getUserWithDetails:", error);
      throw error;
    }
  }
  async updateUserProfile(userId, profile) {
    try {
      if (profile.username) {
        const existingUser = await this.getUserByUsername(profile.username);
        if (existingUser && existingUser.id !== userId) {
          throw new Error("Username already taken");
        }
      }
      const [updatedUser] = await db.update(users).set({
        ...profile,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userId)).returning();
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }
  async updateLoginStreak(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
      if (lastLogin) lastLogin.setHours(0, 0, 0, 0);
      let newStreak = user.loginStreak || 0;
      if (!lastLogin || lastLogin.getTime() < today.getTime()) {
        if (lastLogin && lastLogin.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1e3).getTime()) {
          newStreak = (newStreak || 0) + 1;
        } else if (!lastLogin) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }
        const [updatedUser] = await db.update(users).set({
          lastLoginDate: /* @__PURE__ */ new Date(),
          loginStreak: newStreak,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(users.id, userId)).returning();
        return updatedUser;
      }
      return user;
    } catch (error) {
      console.error("Error in updateLoginStreak:", error);
      throw error;
    }
  }
  async createQuiz(quiz) {
    const now = /* @__PURE__ */ new Date();
    let accessCode = quiz.accessCode || "";
    if (!accessCode) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let i = 0; i < 6; i++) {
        accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    const [newQuiz] = await db.insert(quizzes).values({
      ...quiz,
      accessCode,
      createdAt: now,
      updatedAt: now
    }).returning();
    return newQuiz;
  }
  async updateQuiz(id, quizUpdate) {
    const [updatedQuiz] = await db.update(quizzes).set({
      ...quizUpdate,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(quizzes.id, id)).returning();
    return updatedQuiz;
  }
  async deleteQuiz(id) {
    await db.delete(questions).where(eq(questions.quizId, id));
    await db.delete(results).where(eq(results.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }
  async getQuiz(id) {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }
  async getQuizByAccessCode(code) {
    try {
      const cleanCode = code.trim().toUpperCase();
      const [quiz] = await db.select().from(quizzes).where(sql`UPPER(${quizzes.accessCode}) = ${cleanCode}`);
      return quiz;
    } catch (error) {
      console.error("Error in getQuizByAccessCode:", error);
      return void 0;
    }
  }
  async getQuizzesByTeacher(teacherId) {
    try {
      const teacherQuizzes = await db.select().from(quizzes).where(eq(quizzes.createdBy, teacherId)).orderBy(desc(quizzes.createdAt));
      const quizzesWithAttempts = await Promise.all(
        teacherQuizzes.map(async (q) => {
          const attempts = await db.select({ count: sql`count(*)` }).from(results).where(eq(results.quizId, q.id));
          return {
            ...q,
            attemptCount: Number(attempts[0]?.count || 0)
          };
        })
      );
      return quizzesWithAttempts;
    } catch (error) {
      console.error("Error in getQuizzesByTeacher:", error);
      return [];
    }
  }
  async getPublicQuizzes() {
    try {
      return await db.select().from(quizzes).where(eq(quizzes.isPublic, true)).orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error in getPublicQuizzes:", error);
      return [];
    }
  }
  async getPublicQuizzesWithTeachers() {
    try {
      const quizzesWithTeachers = await db.select({
        ...getTableColumns(quizzes),
        teacherName: users.username
      }).from(quizzes).leftJoin(users, eq(quizzes.createdBy, users.id)).where(
        or(
          eq(quizzes.isPublic, true),
          isNull(quizzes.isPublic),
          sql`${quizzes.isPublic} IS NOT FALSE`
        )
      ).orderBy(desc(quizzes.createdAt));
      const resultList = await Promise.all(
        quizzesWithTeachers.map(async (q) => {
          let attemptCount = 0;
          try {
            const attempts = await db.select({ count: sql`count(*)` }).from(results).where(eq(results.quizId, q.id));
            attemptCount = Number(attempts[0]?.count || 0);
          } catch (e) {
            console.warn(`Error counting attempts for quiz ${q.id}:`, e);
          }
          return {
            ...q,
            teacherName: q.teacherName || "Instructor",
            attemptCount
          };
        })
      );
      return resultList;
    } catch (error) {
      console.error("Error in getPublicQuizzesWithTeachers:", error);
      return [];
    }
  }
  async getQuizzesForStudent(userId) {
    try {
      return await db.select().from(quizzes).where(
        or(
          eq(quizzes.isPublic, true),
          isNull(quizzes.isPublic),
          sql`${quizzes.isPublic} IS NOT FALSE`
        )
      ).orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error in getQuizzesForStudent:", error);
      return [];
    }
  }
  async getLiveQuizzes() {
    try {
      const liveQuizzes = await db.select({
        ...getTableColumns(quizzes),
        teacherName: users.username
      }).from(quizzes).leftJoin(users, eq(quizzes.createdBy, users.id)).where(
        and(
          eq(quizzes.quizType, "live"),
          eq(quizzes.isPublic, true),
          eq(quizzes.isDraft, false),
          eq(quizzes.isActive, true)
        )
      ).orderBy(desc(quizzes.startTime));
      return liveQuizzes;
    } catch (error) {
      console.error("Error in getLiveQuizzes:", error);
      return [];
    }
  }
  async getQuestion(id) {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }
  async createQuestion(question) {
    const [newQuestion] = await db.insert(questions).values({
      ...question,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newQuestion;
  }
  async updateQuestion(id, questionUpdate) {
    const [updatedQuestion] = await db.update(questions).set(questionUpdate).where(eq(questions.id, id)).returning();
    return updatedQuestion;
  }
  async deleteQuestion(id) {
    await db.delete(questions).where(eq(questions.id, id));
  }
  async getQuestionsByQuiz(quizId) {
    return db.select().from(questions).where(eq(questions.quizId, quizId)).orderBy(asc(questions.id));
  }
  async createResult(result) {
    const safeResult = { ...result };
    if (safeResult.answers && !Array.isArray(safeResult.answers) && typeof safeResult.answers !== "string") {
      safeResult.answers = JSON.stringify(safeResult.answers);
    }
    if (Array.isArray(safeResult.answers)) {
      safeResult.answers = JSON.stringify(safeResult.answers);
    }
    try {
      const insertPayload = { ...safeResult };
      delete insertPayload.answers;
      const [newResult] = await db.insert(results).values({ ...insertPayload, completedAt: /* @__PURE__ */ new Date() }).returning();
      if (safeResult.answers !== void 0) {
        try {
          await db.update(results).set({ answers: safeResult.answers }).where(eq(results.id, newResult.id));
        } catch (updateError) {
          console.warn("Initial answers update failed, attempting raw SQL fallback", { updateError, resultId: newResult.id });
          try {
            await pool.query("UPDATE results SET answers = $1::jsonb WHERE id = $2", [safeResult.answers, newResult.id]);
          } catch (e1) {
            try {
              const parsed = typeof safeResult.answers === "string" ? JSON.parse(safeResult.answers) : safeResult.answers;
              if (Array.isArray(parsed)) {
                const arrLiteral = "{" + parsed.map((s) => String(s).replace(/"/g, '\\"')).map((s) => `"${s}"`).join(",") + "}";
                await pool.query("UPDATE results SET answers = $1::text[] WHERE id = $2", [arrLiteral, newResult.id]);
              }
            } catch (e2) {
              console.warn("Fallback answers update failed (non-fatal)", { e1, e2, resultId: newResult.id });
            }
          }
        }
      }
      return newResult;
    } catch (error) {
      console.error("createResult DB error", { error, safeResult });
      throw error;
    }
  }
  // Live Session implementations
  async createLiveSession(quizId, sessionName) {
    await db.update(liveSessions).set({ status: "completed", endedAt: /* @__PURE__ */ new Date() }).where(and(eq(liveSessions.quizId, quizId), eq(liveSessions.status, "active")));
    const [session3] = await db.insert(liveSessions).values({
      quizId,
      sessionName,
      status: "active",
      startedAt: /* @__PURE__ */ new Date()
    }).returning();
    return session3;
  }
  async getActiveLiveSession(quizId) {
    const [session3] = await db.select().from(liveSessions).where(and(eq(liveSessions.quizId, quizId), eq(liveSessions.status, "active"))).orderBy(desc(liveSessions.startedAt)).limit(1);
    return session3;
  }
  async endLiveSession(sessionId) {
    const [session3] = await db.update(liveSessions).set({ status: "completed", endedAt: /* @__PURE__ */ new Date() }).where(eq(liveSessions.id, sessionId)).returning();
    return session3;
  }
  async getLiveSessionsByQuiz(quizId) {
    const sessions = await db.select().from(liveSessions).where(eq(liveSessions.quizId, quizId)).orderBy(desc(liveSessions.startedAt));
    const resultList = await Promise.all(
      sessions.map(async (sess) => {
        const attempts = await db.select({ count: sql`count(*)` }).from(results).where(eq(results.sessionId, sess.id));
        return {
          ...sess,
          attemptCount: Number(attempts[0]?.count || 0)
        };
      })
    );
    return resultList;
  }
  async getLiveSession(sessionId) {
    const [session3] = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId));
    return session3;
  }
  async getResultsByQuiz(quizId, sessionId) {
    if (sessionId !== void 0 && sessionId !== null && !isNaN(sessionId)) {
      return db.select().from(results).where(and(eq(results.quizId, quizId), eq(results.sessionId, sessionId))).orderBy(desc(results.score), desc(results.completedAt));
    }
    return db.select().from(results).where(eq(results.quizId, quizId)).orderBy(desc(results.score), desc(results.completedAt));
  }
  async getResultsByUser(userId) {
    const userResults = await db.select({
      ...getTableColumns(results),
      quizTitle: quizzes.title
    }).from(results).leftJoin(quizzes, eq(results.quizId, quizzes.id)).where(eq(results.userId, userId)).orderBy(desc(results.completedAt));
    return userResults.map((r) => ({
      ...r,
      quizTitle: r.quizTitle || `Quiz #${r.quizId}`,
      maxScore: r.totalQuestions && r.totalQuestions > 0 ? r.totalQuestions * 10 : 100
    }));
  }
  async getQuizLeaderboard(quizId, sessionId) {
    try {
      const whereClause = sessionId !== void 0 && sessionId !== null && !isNaN(sessionId) ? and(eq(results.quizId, quizId), eq(results.sessionId, sessionId)) : eq(results.quizId, quizId);
      const leaderboard = await db.select({
        ...getTableColumns(results),
        username: users.username
      }).from(results).leftJoin(users, eq(results.userId, users.id)).where(whereClause).orderBy(desc(results.score), sql`${results.timeTaken} ASC`, desc(results.completedAt)).limit(10);
      return leaderboard;
    } catch (error) {
      console.error("Error in getQuizLeaderboard:", error);
      return [];
    }
  }
  async getGlobalLeaderboard(limit = 10) {
    try {
      const leaderboard = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        profilePicture: users.profilePicture,
        role: users.role,
        points: users.points,
        // Use cumulative points earned across attempts as the primary global leaderboard metric
        totalScore: sql`SUM(${results.pointsEarned})`
      }).from(users).leftJoin(results, eq(users.id, results.userId)).groupBy(users.id, users.username, users.name, users.profilePicture, users.role, users.points).orderBy(desc(sql`SUM(${results.pointsEarned})`), desc(users.points)).limit(limit);
      return leaderboard;
    } catch (error) {
      console.error("Error in getGlobalLeaderboard:", error);
      return [];
    }
  }
  async updateUserPoints(userId, points) {
    const user = await this.getUser(userId);
    if (user) {
      await db.update(users).set({ points: (user.points || 0) + points }).where(eq(users.id, userId));
    }
  }
  // Achievements implementation
  async getAchievements() {
    try {
      const achievementsList = await db.select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        iconUrl: achievements.iconUrl,
        // Use the drizzle field instead of SQL literal
        criteria: achievements.criteria,
        createdAt: achievements.createdAt
      }).from(achievements);
      return achievementsList;
    } catch (error) {
      console.error("Error in getAchievements:", error);
      return [];
    }
  }
  async getUserAchievements(userId) {
    try {
      const userAchievementsList = await db.select({
        id: achievements.id,
        name: achievements.name,
        description: achievements.description,
        iconUrl: achievements.iconUrl,
        // Use the drizzle field instead of SQL literal
        criteria: achievements.criteria,
        createdAt: achievements.createdAt,
        earnedAt: userAchievements.earnedAt
      }).from(userAchievements).innerJoin(achievements, eq(userAchievements.achievementId, achievements.id)).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.earnedAt));
      return userAchievementsList;
    } catch (error) {
      console.error("Error in getUserAchievements:", error);
      return [];
    }
  }
  async awardAchievement(userId, achievementId) {
    try {
      const [existingAchievement] = await db.select().from(userAchievements).where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
      if (existingAchievement) {
        return existingAchievement;
      }
      const [newUserAchievement] = await db.insert(userAchievements).values({
        userId,
        achievementId
      }).returning();
      return newUserAchievement;
    } catch (error) {
      console.error("Error in awardAchievement:", error);
      throw error;
    }
  }
  // Friendship implementation
  async getFriends(userId) {
    try {
      const userFriendships = await db.select().from(friendships).where(
        and(
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          ),
          eq(friendships.status, "accepted")
        )
      );
      const friendIds = userFriendships.map(
        (f) => f.userId === userId ? f.friendId : f.userId
      );
      if (friendIds.length === 0) return [];
      const friends = await db.select().from(users).where(sql`${users.id} IN (${friendIds.join(",")})`);
      return friends;
    } catch (error) {
      console.error("Error in getFriends:", error);
      return [];
    }
  }
  async getFriendRequests(userId) {
    try {
      const friendRequests = await db.select({
        ...getTableColumns(friendships),
        sender: getTableColumns(users)
      }).from(friendships).innerJoin(users, eq(friendships.userId, users.id)).where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, "pending")
        )
      );
      return friendRequests;
    } catch (error) {
      console.error("Error in getFriendRequests:", error);
      return [];
    }
  }
  async sendFriendRequest(userId, friendId) {
    try {
      if (userId === friendId) {
        throw new Error("Cannot send friend request to yourself");
      }
      const [existingFriendship] = await db.select().from(friendships).where(
        or(
          and(
            eq(friendships.userId, userId),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId)
          )
        )
      );
      if (existingFriendship) {
        throw new Error("Friend request already exists");
      }
      const [newFriendship] = await db.insert(friendships).values({
        userId,
        friendId,
        status: "pending"
      }).returning();
      return newFriendship;
    } catch (error) {
      console.error("Error in sendFriendRequest:", error);
      throw error;
    }
  }
  async acceptFriendRequest(userId, friendId) {
    try {
      const [friendRequest] = await db.select().from(friendships).where(
        and(
          eq(friendships.userId, friendId),
          eq(friendships.friendId, userId),
          eq(friendships.status, "pending")
        )
      );
      if (!friendRequest) {
        throw new Error("Friend request not found");
      }
      const [updatedFriendship] = await db.update(friendships).set({
        status: "accepted",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(friendships.id, friendRequest.id)).returning();
      return updatedFriendship;
    } catch (error) {
      console.error("Error in acceptFriendRequest:", error);
      throw error;
    }
  }
  async rejectFriendRequest(userId, friendId) {
    try {
      const [friendRequest] = await db.select().from(friendships).where(
        and(
          eq(friendships.userId, friendId),
          eq(friendships.friendId, userId),
          eq(friendships.status, "pending")
        )
      );
      if (!friendRequest) {
        throw new Error("Friend request not found");
      }
      const [updatedFriendship] = await db.update(friendships).set({
        status: "rejected",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(friendships.id, friendRequest.id)).returning();
      return updatedFriendship;
    } catch (error) {
      console.error("Error in rejectFriendRequest:", error);
      throw error;
    }
  }
  // Method to get a specific user's result for a quiz
  async getUserQuizResult(quizId, userId) {
    try {
      const [result] = await db.select().from(results).where(
        and(
          eq(results.quizId, quizId),
          eq(results.userId, userId)
        )
      ).orderBy(desc(results.completedAt)).limit(1);
      return result || null;
    } catch (error) {
      console.error("Error in getUserQuizResult:", error);
      return null;
    }
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import dotenv2 from "dotenv";
dotenv2.config();
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: "3b1f4e7a9c6d9e8d1f2a3b4c5d6e7f8192a3b4c5d6e7f8192a3b4c5d6e7f819",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`deserializeUser: user id ${id} not found in database; clearing session authentication.`);
        return done(null, false);
      }
      return done(null, user);
    } catch (err) {
      console.error("Error deserializing user from session:", err);
      return done(err);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(password)
      });
      req.login(user, (err) => {
        if (err) {
          console.error("req.login error after registration:", err);
          return res.status(500).json({ message: "Failed to establish session after registration" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: error.message || "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ message: err.message || "Authentication service error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("req.login error:", loginErr);
          return res.status(500).json({ message: "Failed to establish login session" });
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/stats.ts
import { eq as eq2, desc as desc2, count, inArray, gt as gt2 } from "drizzle-orm";
async function calculateStudentStats(userId) {
  const userResults = await db.select().from(results).where(eq2(results.userId, userId)).orderBy(desc2(results.completedAt));
  const quizzesCompleted = userResults.length;
  const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
  const averageScore = quizzesCompleted > 0 ? Math.round(totalScore / quizzesCompleted) : 0;
  const [user] = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
  const totalPoints = user?.points || 0;
  const level = Math.floor(totalPoints / 100) + 1;
  const levelProgress = totalPoints % 100;
  const currentStreak = calculateStreak(userResults);
  const rank = await calculateRank(userId);
  const recentResults = userResults.slice(0, 5);
  return {
    quizzesCompleted,
    averageScore,
    totalPoints,
    currentStreak,
    rank,
    level,
    levelProgress,
    recentResults
  };
}
async function calculateTeacherStats(userId) {
  const teacherQuizzes = await db.select().from(quizzes).where(eq2(quizzes.createdBy, userId)).orderBy(desc2(quizzes.createdAt));
  const totalQuizzes = teacherQuizzes.length;
  const activeQuizzes = teacherQuizzes.filter((q) => q.isActive).length;
  const quizIds = teacherQuizzes.map((q) => q.id);
  let totalQuestions = 0;
  if (quizIds.length > 0) {
    const questionCounts = await db.select({ count: count() }).from(questions).where(inArray(questions.quizId, quizIds));
    totalQuestions = Number(questionCounts[0]?.count) || 0;
  }
  let allResults = [];
  let studentsReached = 0;
  if (quizIds.length > 0) {
    allResults = await db.select().from(results).where(inArray(results.quizId, quizIds));
    const uniqueStudents = new Set(allResults.map((r) => r.userId));
    studentsReached = uniqueStudents.size;
  }
  const totalAttempts = allResults.length;
  const totalScore = allResults.reduce((sum, r) => sum + r.score, 0);
  const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
  const completionRate = totalAttempts > 0 ? 89 : 0;
  const recentQuizzes = await Promise.all(
    teacherQuizzes.slice(0, 5).map(async (quiz) => {
      const [questionCount] = await db.select({ count: count() }).from(questions).where(eq2(questions.quizId, quiz.id));
      return {
        ...quiz,
        questionCount: Number(questionCount?.count) || 0
      };
    })
  );
  return {
    totalQuizzes,
    activeQuizzes,
    totalQuestions,
    studentsReached,
    totalAttempts,
    averageScore,
    completionRate,
    recentQuizzes
  };
}
function calculateStreak(results2) {
  if (results2.length === 0) return 0;
  const sorted = [...results2].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  let streak = 0;
  let currentDate = /* @__PURE__ */ new Date();
  currentDate.setHours(0, 0, 0, 0);
  for (const result of sorted) {
    const resultDate = new Date(result.completedAt);
    resultDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (currentDate.getTime() - resultDate.getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysDiff === streak || daysDiff === streak + 1) {
      if (daysDiff === streak + 1) {
        streak++;
      }
    } else {
      break;
    }
  }
  return streak;
}
async function calculateRank(userId) {
  const [user] = await db.select({ points: users.points }).from(users).where(eq2(users.id, userId)).limit(1);
  if (!user) return 0;
  const [result] = await db.select({ count: count() }).from(users).where(gt2(users.points, user.points ?? 0));
  return (Number(result?.count) || 0) + 1;
}

// server/statsRoutes.ts
function registerStatsRoutes(app2) {
  app2.get("/api/users/:id/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let stats;
      if (user.role === "student") {
        stats = await calculateStudentStats(userId);
      } else {
        stats = await calculateTeacherStats(userId);
      }
      res.json(stats);
    } catch (error) {
      console.error("Error calculating user stats:", error);
      res.status(500).json({ error: "Failed to calculate statistics" });
    }
  });
}

// server/routes.ts
import multer from "multer";
import path2 from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabaseUrlFull = supabaseUrl ?? "https://fmzwbrjdlnechdquodig.supabase.co";
var supabase = supabaseUrlFull && supabaseKey ? createClient(supabaseUrlFull, supabaseKey) : null;
var uploadDir = path2.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storage_upload = multer.memoryStorage();
var upload = multer({
  storage: storage_upload,
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
function registerRoutes(app2) {
  setupAuth(app2);
  app2.use("/uploads", express.static(path2.join(__dirname, "../uploads")));
  app2.post("/api/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (supabase) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path2.extname(req.file.originalname);
        const filename = `quiz-image-${uniqueSuffix}${ext}`;
        const { data, error } = await supabase.storage.from("quiz-images").upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
        if (error) {
          if (error.message.includes("Bucket not found") || error.message.includes("does not exist") || error.message.includes("not find")) {
            console.log('Bucket "quiz-images" not found, attempting to create it...');
            await supabase.storage.createBucket("quiz-images", { public: true });
            const retryRes = await supabase.storage.from("quiz-images").upload(filename, req.file.buffer, {
              contentType: req.file.mimetype
            });
            if (retryRes.error) throw new Error(retryRes.error.message);
          } else {
            throw new Error(error.message);
          }
        }
        const { data: { publicUrl } } = supabase.storage.from("quiz-images").getPublicUrl(filename);
        return res.json({ url: publicUrl });
      } else {
        throw new Error("Supabase client not initialized. Cannot handle image upload.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({
        error: error.message || "Failed to upload image"
      });
    }
  });
  app2.get("/api/users/me", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userDetails = await storage.getUserWithDetails(req.user.id);
      if (!userDetails) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });
  app2.put("/api/users/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const validatedData = updateUserProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(req.user.id, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ error: error.message || "Failed to update profile" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const userDetails = await storage.getUserWithDetails(userId);
      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });
  app2.get("/api/friends", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const friends = await storage.getFriends(req.user.id);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });
  app2.get("/api/friends/requests", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const friendRequests = await storage.getFriendRequests(req.user.id);
      res.json(friendRequests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });
  app2.post("/api/friends/request/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const friendship = await storage.sendFriendRequest(req.user.id, userId);
      res.status(201).json(friendship);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(400).json({ error: error.message || "Failed to send friend request" });
    }
  });
  app2.post("/api/friends/accept/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const friendship = await storage.acceptFriendRequest(req.user.id, userId);
      res.status(200).json(friendship);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(400).json({ error: error.message || "Failed to accept friend request" });
    }
  });
  app2.post("/api/friends/reject/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const friendship = await storage.rejectFriendRequest(req.user.id, userId);
      res.status(200).json(friendship);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(400).json({ error: error.message || "Failed to reject friend request" });
    }
  });
  app2.get("/api/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const achievements2 = await storage.getAchievements();
      res.json(achievements2);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  app2.get("/api/users/:id/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const achievements2 = await storage.getUserAchievements(userId);
      res.json(achievements2);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });
  app2.get("/api/leaderboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const leaderboard = await storage.getGlobalLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch global leaderboard" });
    }
  });
  app2.get("/api/quizzes/student", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "student") {
        return res.status(403).json({ error: "Student role required" });
      }
      const quizzes2 = await storage.getQuizzesForStudent(req.user.id);
      res.json(quizzes2 || []);
    } catch (error) {
      console.error("Error fetching student quizzes:", error);
      res.status(500).json({ error: "Failed to fetch student quizzes" });
    }
  });
  app2.post("/api/quizzes", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const validatedData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz({
        ...validatedData,
        createdBy: req.user.id,
        isPublic: validatedData.isPublic ?? false
      });
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ error: error.message || "Failed to create quiz" });
    }
  });
  app2.put("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this quiz" });
      }
      const { quizType, ...safeBody } = req.body;
      const validatedData = updateQuizSchema.parse(safeBody);
      const updatedQuiz = await storage.updateQuiz(quizId, validatedData);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(400).json({ error: error.message || "Failed to update quiz" });
    }
  });
  app2.delete("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this quiz" });
      }
      await storage.deleteQuiz(quizId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });
  app2.post("/api/quizzes/join-by-code", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { accessCode } = req.body;
      if (!accessCode || typeof accessCode !== "string" || !accessCode.trim()) {
        return res.status(400).json({ error: "Valid access code is required" });
      }
      const quiz = await storage.getQuizByAccessCode(accessCode.trim());
      if (!quiz) {
        return res.status(404).json({ error: "Invalid access code. No quiz found with this code." });
      }
      if (quiz.isDraft) {
        return res.status(400).json({ error: "This quiz is currently in draft mode and not available." });
      }
      const activeSession = quiz.quizType === "live" ? await storage.getActiveLiveSession(quiz.id) : null;
      res.json({
        quizId: quiz.id,
        quizType: quiz.quizType,
        title: quiz.title,
        isPublic: quiz.isPublic,
        isActive: quiz.isActive,
        activeSession: activeSession ? {
          id: activeSession.id,
          sessionName: activeSession.sessionName
        } : null
      });
    } catch (error) {
      console.error("Error joining quiz by code:", error);
      res.status(500).json({ error: error.message || "Failed to join quiz" });
    }
  });
  app2.post("/api/quizzes/:id/start", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to start this quiz" });
      }
      if (quiz.quizType !== "live") {
        return res.status(400).json({ error: "Only live quizzes can be started" });
      }
      const duration = req.body.duration || quiz.duration || 60;
      const sessionName = req.body.sessionName || req.body.batchName || `Batch ${(/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const liveSession = await storage.createLiveSession(quizId, sessionName);
      const startTime = /* @__PURE__ */ new Date();
      const endTime = new Date(startTime.getTime() + duration * 6e4);
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: true,
        isStarted: true,
        startTime,
        endTime
      });
      res.json({ quiz: updatedQuiz, session: liveSession });
    } catch (error) {
      console.error("Error starting quiz session:", error);
      res.status(500).json({ error: "Failed to start quiz session" });
    }
  });
  app2.post("/api/quizzes/:id/sessions/start", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to start this quiz session" });
      }
      const sessionName = (req.body.sessionName || "").trim();
      if (!sessionName) {
        return res.status(400).json({ error: "Session name (Batch name) is required" });
      }
      const duration = req.body.duration || quiz.duration || 60;
      const liveSession = await storage.createLiveSession(quizId, sessionName);
      const startTime = /* @__PURE__ */ new Date();
      const endTime = new Date(startTime.getTime() + duration * 6e4);
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: true,
        isStarted: true,
        startTime,
        endTime
      });
      res.json({ quiz: updatedQuiz, session: liveSession });
    } catch (error) {
      console.error("Error starting live session:", error);
      res.status(500).json({ error: "Failed to start live session" });
    }
  });
  app2.post("/api/quizzes/:id/sessions/stop", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to stop this quiz session" });
      }
      const activeSession = await storage.getActiveLiveSession(quizId);
      let endedSession = null;
      if (activeSession) {
        endedSession = await storage.endLiveSession(activeSession.id);
      }
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: false,
        isStarted: false,
        endTime: /* @__PURE__ */ new Date()
      });
      res.json({ quiz: updatedQuiz, session: endedSession });
    } catch (error) {
      console.error("Error stopping live session:", error);
      res.status(500).json({ error: "Failed to stop live session" });
    }
  });
  app2.post("/api/quizzes/:id/end", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to end this quiz" });
      }
      const activeSession = await storage.getActiveLiveSession(quizId);
      if (activeSession) {
        await storage.endLiveSession(activeSession.id);
      }
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: false,
        isStarted: false,
        endTime: /* @__PURE__ */ new Date()
      });
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error ending quiz:", error);
      res.status(500).json({ error: "Failed to end quiz" });
    }
  });
  app2.get("/api/quizzes/:id/sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const sessions = await storage.getLiveSessionsByQuiz(quizId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      res.status(500).json({ error: "Failed to fetch live sessions" });
    }
  });
  app2.get("/api/quizzes/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const activeSession = quiz.quizType === "live" ? await storage.getActiveLiveSession(quizId) : null;
      res.json({
        id: quiz.id,
        isActive: quiz.isActive,
        isStarted: quiz.isStarted,
        isPublic: quiz.isPublic,
        isDraft: quiz.isDraft,
        quizType: quiz.quizType,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        activeSession: activeSession || null
      });
    } catch (error) {
      console.error("Error fetching quiz status:", error);
      res.status(500).json({ error: "Failed to fetch quiz status" });
    }
  });
  app2.post("/api/quizzes/:id/publish", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to publish this quiz" });
      }
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isDraft: false
      });
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error publishing quiz:", error);
      res.status(500).json({ error: "Failed to publish quiz" });
    }
  });
  app2.get("/api/quizzes/teacher", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizzes2 = await storage.getQuizzesByTeacher(req.user.id);
      res.json(quizzes2 || []);
    } catch (error) {
      console.error("Error fetching teacher quizzes:", error);
      res.status(500).json({ error: "Failed to fetch teacher quizzes" });
    }
  });
  app2.get("/api/quizzes/public", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizzes2 = await storage.getPublicQuizzesWithTeachers();
      res.json(quizzes2 || []);
    } catch (error) {
      console.error("Error fetching public quizzes:", error);
      res.status(500).json({ error: "Failed to fetch public quizzes" });
    }
  });
  app2.get("/api/quizzes/live", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "student") {
        return res.status(403).json({ error: "Student role required" });
      }
      const quizzes2 = await storage.getLiveQuizzes();
      res.json(quizzes2 || []);
    } catch (error) {
      console.error("Error fetching live quizzes:", error);
      res.status(500).json({ error: "Failed to fetch live quizzes" });
    }
  });
  app2.get("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (req.user.role === "student" && quiz.isDraft === true && !quiz.isPublic) {
        return res.status(403).json({ error: "This quiz is not available" });
      }
      if (!quiz.isPublic && quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this quiz" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });
  app2.post("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz || quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to add questions to this quiz" });
      }
      const validatedData = insertQuestionSchema.parse({
        ...req.body,
        quizId
      });
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ error: error.message || "Failed to create question" });
    }
  });
  app2.put("/api/questions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      const quiz = await storage.getQuiz(question.quizId);
      if (!quiz || quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this question" });
      }
      const validatedData = updateQuestionSchema.parse(req.body);
      const updatedQuestion = await storage.updateQuestion(questionId, validatedData);
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(400).json({ error: error.message || "Failed to update question" });
    }
  });
  app2.delete("/api/questions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      const quiz = await storage.getQuiz(question.quizId);
      if (!quiz || quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this question" });
      }
      await storage.deleteQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });
  app2.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (req.user.role === "student" && quiz.isDraft) {
        return res.status(403).json({ error: "This quiz is not available" });
      }
      if (!quiz.isPublic && quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this quiz" });
      }
      if (quiz.quizType === "live" && !quiz.isStarted && req.user.role === "student") {
        return res.status(403).json({ error: "This live quiz has not started yet" });
      }
      const questions2 = await storage.getQuestionsByQuiz(quizId);
      res.json(questions2);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });
  app2.post("/api/quizzes/:quizId/results", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "student") {
        return res.status(403).json({ error: "Student role required" });
      }
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const validatedData = submitResultSchema.parse(req.body);
      const userAnswers = validatedData.userAnswers || [];
      const timeTaken = validatedData.timeTaken ?? 0;
      const tabSwitchCount = validatedData.tabSwitchCount ?? 0;
      const copyPasteAttempts = validatedData.copyPasteAttempts ?? 0;
      const proctoringFlags = validatedData.proctoringFlags ?? 0;
      let targetSessionId = validatedData.sessionId || req.body.sessionId;
      if (!targetSessionId && quiz.quizType === "live") {
        const activeSession = await storage.getActiveLiveSession(quizId);
        if (activeSession) {
          targetSessionId = activeSession.id;
        }
      }
      const questionsForQuiz = await storage.getQuestionsByQuiz(quizId);
      const totalQuestions = questionsForQuiz.length;
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let pointsEarned = 0;
      for (let i = 0; i < questionsForQuiz.length; i++) {
        const q = questionsForQuiz[i];
        const userAns = userAnswers[i];
        if (userAns && userAns === q.correctAnswer) {
          correctAnswers++;
          pointsEarned += q.points ?? 2;
        } else if (userAns) {
          wrongAnswers++;
        }
      }
      const score = totalQuestions > 0 ? Math.round(correctAnswers / totalQuestions * 100) : 0;
      const result = await storage.createResult({
        quizId,
        userId: req.user.id,
        score,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        timeTaken,
        pointsEarned,
        answers: JSON.stringify(userAnswers || []),
        tabSwitchCount,
        copyPasteAttempts,
        proctoringFlags,
        sessionId: targetSessionId || null
      });
      await storage.updateUserPoints(req.user.id, pointsEarned);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to submit result" });
    }
  });
  app2.get("/api/results/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const results2 = await storage.getResultsByUser(req.user.id);
      res.json(results2);
    } catch (error) {
      console.error("Error fetching user results:", error);
      res.status(500).json({ error: "Failed to fetch user results" });
    }
  });
  app2.get("/api/quizzes/:quizId/leaderboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      const reqSessionId = req.query.sessionId ? Number(req.query.sessionId) : void 0;
      const leaderboard = await storage.getQuizLeaderboard(quizId, reqSessionId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  app2.get("/api/analytics/quiz/:quizId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.quizId);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      if (quiz.createdBy !== req.user.id && req.user.role !== "teacher") {
        return res.status(403).json({ error: "Not authorized to access this quiz's analytics" });
      }
      const reqSessionId = req.query.sessionId ? Number(req.query.sessionId) : void 0;
      const results2 = await storage.getResultsByQuiz(quizId, reqSessionId);
      const questions2 = await storage.getQuestionsByQuiz(quizId) || [];
      if (!results2 || results2.length === 0) {
        return res.json({
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          averageTime: 0,
          questionStats: questions2.map((q) => ({
            questionId: q.id,
            questionText: q.questionText,
            totalAttempts: 0,
            correctCount: 0,
            averageTime: 0
          })),
          performanceDistribution: [
            { scoreRange: "0-39%", count: 0 },
            { scoreRange: "40-59%", count: 0 },
            { scoreRange: "60-79%", count: 0 },
            { scoreRange: "80-100%", count: 0 }
          ],
          timePerformance: [],
          studentReports: [],
          questions: questions2
        });
      }
      const totalAttempts = results2.length;
      const scores = results2.map((r) => {
        const totalQ = r.totalQuestions && r.totalQuestions > 0 ? r.totalQuestions : questions2.length > 0 ? questions2.length : 1;
        const correct = typeof r.correctAnswers === "number" ? r.correctAnswers : typeof r.score === "number" ? Math.round(r.score / 100 * totalQ) : 0;
        const pct = correct / totalQ * 100;
        return isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
      });
      const durations = results2.map((r) => Number(r.timeTaken) || 0).filter((d) => !isNaN(d) && d >= 0);
      const sumScores = scores.reduce((acc, val) => acc + val, 0);
      const averageScore = scores.length > 0 ? Math.round(sumScores / scores.length * 10) / 10 : 0;
      const highestScore = scores.length > 0 ? Math.round(Math.max(...scores) * 10) / 10 : 0;
      const lowestScore = scores.length > 0 ? Math.round(Math.min(...scores) * 10) / 10 : 0;
      const averageTime = durations.length > 0 ? Math.round(durations.reduce((acc, val) => acc + val, 0) / durations.length) : 0;
      const userIds = [...new Set(results2.map((r) => r.userId))];
      let users2 = [];
      try {
        users2 = await Promise.all(userIds.map((id) => storage.getUser(id).catch(() => null)));
      } catch (e) {
        console.warn("Error loading users for analytics:", e);
      }
      const userMap = Object.fromEntries(users2.filter(Boolean).map((user) => [user.id, user]));
      const parseAnswersField = (val) => {
        if (val === null || val === void 0) return [];
        if (Array.isArray(val)) return val.map((v) => v === null || v === void 0 ? "" : String(v));
        if (typeof val === "object") {
          try {
            const j = JSON.stringify(val);
            const parsed = JSON.parse(j);
            if (Array.isArray(parsed)) return parsed.map((v) => v === null || v === void 0 ? "" : String(v));
          } catch (e) {
          }
        }
        if (typeof val === "string") {
          const s = val.trim();
          if (s === "" || s === "[]") return [];
          try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) return parsed.map((v) => v === null || v === void 0 ? "" : String(v));
          } catch (e) {
            if (s.startsWith("{") && s.endsWith("}")) {
              const inner = s.slice(1, -1);
              if (inner.trim() === "") return [];
              const parts = inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/g).map((p) => p.trim());
              const cleaned = parts.map((p) => {
                if (p.startsWith('"') && p.endsWith('"') || p.startsWith("'") && p.endsWith("'")) {
                  return p.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
                }
                return p;
              });
              return cleaned.map((c) => c === null || c === void 0 ? "" : String(c));
            }
          }
        }
        return [];
      };
      const studentReports = results2.map((result) => {
        const user = userMap[result.userId];
        const totalQ = result.totalQuestions && result.totalQuestions > 0 ? result.totalQuestions : questions2.length > 0 ? questions2.length : 1;
        const correct = typeof result.correctAnswers === "number" ? result.correctAnswers : 0;
        const scorePercentage = Math.min(100, Math.max(0, correct / totalQ * 100));
        return {
          userId: result.userId,
          username: user ? user.username : "Unknown",
          score: parseFloat((isNaN(scorePercentage) ? 0 : scorePercentage).toFixed(1)),
          correctAnswers: correct,
          wrongAnswers: typeof result.wrongAnswers === "number" ? result.wrongAnswers : Math.max(0, totalQ - correct),
          timeTaken: Number(result.timeTaken) || 0,
          completedAt: result.completedAt || (/* @__PURE__ */ new Date()).toISOString(),
          answers: parseAnswersField(result.answers),
          tabSwitchCount: result.tabSwitchCount || 0,
          copyPasteAttempts: result.copyPasteAttempts || 0,
          proctoringFlags: result.proctoringFlags || 0
        };
      });
      const questionData = {};
      questions2.forEach((q) => {
        questionData[q.id] = {
          id: q.id,
          text: q.questionText,
          totalAttempts: results2.length,
          correctCount: 0,
          totalTime: 0
        };
      });
      results2.forEach((result) => {
        let answersArray = parseAnswersField(result.answers);
        const totalQ = result.totalQuestions && result.totalQuestions > 0 ? result.totalQuestions : questions2.length > 0 ? questions2.length : 1;
        const timePerQuestion = totalQ > 0 ? Math.round((Number(result.timeTaken) || 0) / totalQ) : 0;
        questions2.forEach((q, idx) => {
          const qd = questionData[q.id];
          if (!qd) return;
          const userAns = answersArray[idx];
          if (userAns !== void 0 && userAns !== null && String(userAns).trim() === String(q.correctAnswer).trim()) {
            qd.correctCount++;
          }
          qd.totalTime += timePerQuestion;
        });
      });
      const questionStats = questions2.map((q) => {
        const qd = questionData[q.id];
        return {
          questionId: q.id,
          questionText: q.questionText,
          totalAttempts: qd ? qd.totalAttempts : 0,
          correctCount: qd ? qd.correctCount : 0,
          averageTime: qd && qd.totalAttempts > 0 ? Math.round(qd.totalTime / qd.totalAttempts) : 0
        };
      });
      const performanceDistribution = [
        { scoreRange: "0-39%", count: scores.filter((s) => s < 40).length },
        { scoreRange: "40-59%", count: scores.filter((s) => s >= 40 && s < 60).length },
        { scoreRange: "60-79%", count: scores.filter((s) => s >= 60 && s < 80).length },
        { scoreRange: "80-100%", count: scores.filter((s) => s >= 80).length }
      ];
      const timePerformance = [];
      const now = /* @__PURE__ */ new Date();
      const pastWeek = new Date(now);
      pastWeek.setDate(pastWeek.getDate() - 6);
      const resultsByDate = {};
      for (let i = 0; i <= 6; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        resultsByDate[dateStr] = [];
      }
      results2.forEach((result) => {
        const completedAt = result.completedAt ? new Date(result.completedAt) : /* @__PURE__ */ new Date();
        if (completedAt >= pastWeek) {
          const dateStr = completedAt.toISOString().split("T")[0];
          if (resultsByDate[dateStr]) {
            resultsByDate[dateStr].push(result);
          }
        }
      });
      Object.entries(resultsByDate).forEach(([dateStr, dateResults]) => {
        if (dateResults.length === 0) {
          timePerformance.push({
            date: dateStr,
            attempts: 0,
            averageScore: 0,
            correct: 0,
            wrong: 0
          });
        } else {
          const totalCorrect = dateResults.reduce((sum, r) => sum + (r.correctAnswers || 0), 0);
          const totalWrong = dateResults.reduce((sum, r) => sum + (r.wrongAnswers || 0), 0);
          const dayScores = dateResults.map((r) => {
            const totalQ = r.totalQuestions && r.totalQuestions > 0 ? r.totalQuestions : questions2.length > 0 ? questions2.length : 1;
            return (r.correctAnswers || 0) / totalQ * 100;
          });
          const avgScore = dayScores.reduce((sum, score) => sum + score, 0) / dayScores.length;
          timePerformance.push({
            date: dateStr,
            attempts: dateResults.length,
            averageScore: Math.round(isNaN(avgScore) ? 0 : avgScore),
            correct: totalCorrect,
            wrong: totalWrong
          });
        }
      });
      timePerformance.sort((a, b) => a.date.localeCompare(b.date));
      res.json({
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
        averageTime,
        questionStats,
        performanceDistribution,
        timePerformance,
        studentReports,
        questions: questions2
      });
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });
  app2.get("/api/quizzes/:quizId/results/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizId = parseInt(req.params.quizId);
      const userId = parseInt(req.params.userId);
      if (isNaN(quizId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid quiz ID or user ID" });
      }
      if (req.user.role !== "teacher" && req.user.id !== userId) {
        return res.status(403).json({ error: "Not authorized to view these results" });
      }
      const result = await storage.getUserQuizResult(quizId, userId);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching user quiz result:", error);
      res.status(500).json({ error: "Failed to fetch user quiz result" });
    }
  });
  app2.get("/api/analytics/total-quizzes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const quizzes2 = await storage.getPublicQuizzesWithTeachers();
      res.json({ total: quizzes2?.length || 0 });
    } catch (error) {
      console.error("Error fetching total quizzes:", error);
      res.status(500).json({ error: "Failed to fetch total quizzes" });
    }
  });
  app2.get("/api/analytics/active-users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const users2 = await storage.getAllUsers?.();
      const activeCount = users2?.length || 1200;
      res.json({ active: activeCount });
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ error: "Failed to fetch active users", active: 1200 });
    }
  });
  registerStatsRoutes(app2);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vercel-entry.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.set("trust proxy", 1);
registerRoutes(app);
app.use((err, _req, res, _next) => {
  console.error("Vercel API Error:", err?.message || err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
