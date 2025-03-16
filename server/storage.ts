import { users, quizzes, questions, results, type User, type Quiz, type Question, type Result, type UpdateQuiz, type UpdateQuestion } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, lt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "points">): Promise<User>;

  createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<UpdateQuiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: number): Promise<Quiz[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string })[]>;
  getLiveQuizzes(): Promise<(Quiz & { teacherName: string })[]>;

  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: Omit<Question, "id">): Promise<Question>;
  updateQuestion(id: number, question: UpdateQuestion): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;

  createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result>;
  getResultsByQuiz(quizId: number): Promise<Result[]>;
  getResultsByUser(userId: number): Promise<Result[]>;
  getQuizLeaderboard(quizId: number): Promise<(Result & { username: string })[]>;

  updateUserPoints(userId: number, points: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Database error in getUserByUsername:", error);
      // Return undefined instead of failing completely
      return undefined;
    }
  }

  async createUser(insertUser: Omit<User, "id" | "points">): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, points: 0 })
      .returning();
    return user;
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const now = new Date();
    const [newQuiz] = await db
      .insert(quizzes)
      .values({ 
        ...quiz, 
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newQuiz;
  }

  async updateQuiz(id: number, quizUpdate: Partial<UpdateQuiz>): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({ 
        ...quizUpdate,
        updatedAt: new Date() 
      })
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    // First delete all questions associated with this quiz
    await db.delete(questions).where(eq(questions.quizId, id));
    // Then delete all results associated with this quiz
    await db.delete(results).where(eq(results.quizId, id));
    // Finally delete the quiz itself
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    try {
      return await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.createdBy, teacherId))
        .orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error in getQuizzesByTeacher:", error);
      return [];
    }
  }

  async getPublicQuizzes(): Promise<Quiz[]> {
    try {
      return await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.isPublic, true))
        .orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error in getPublicQuizzes:", error);
      return [];
    }
  }

  async getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string })[]> {
    try {
      const quizzesWithTeachers = await db
        .select({
          ...quizzes,
          teacherName: users.username,
        })
        .from(quizzes)
        .leftJoin(users, eq(quizzes.createdBy, users.id))
        .where(eq(quizzes.isPublic, true))
        .orderBy(desc(quizzes.createdAt));
      return quizzesWithTeachers;
    } catch (error) {
      console.error("Error in getPublicQuizzesWithTeachers:", error);
      return [];
    }
  }

  async getLiveQuizzes(): Promise<(Quiz & { teacherName: string })[]> {
    try {
      const now = new Date();
      const liveQuizzes = await db
        .select({
          ...quizzes,
          teacherName: users.username,
        })
        .from(quizzes)
        .leftJoin(users, eq(quizzes.createdBy, users.id))
        .where(
          and(
            eq(quizzes.quizType, "live"),
            eq(quizzes.isActive, true),
            eq(quizzes.isPublic, true),
            gt(quizzes.endTime, now)
          )
        )
        .orderBy(desc(quizzes.startTime));
      return liveQuizzes;
    } catch (error) {
      console.error("Error in getLiveQuizzes:", error);
      return [];
    }
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: Omit<Question, "id">): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values({ 
        ...question,
        createdAt: new Date()
      })
      .returning();
    return newQuestion;
  }

  async updateQuestion(id: number, questionUpdate: UpdateQuestion): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(questionUpdate)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.quizId, quizId));
  }

  async createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result> {
    const [newResult] = await db
      .insert(results)
      .values({ ...result, completedAt: new Date() })
      .returning();
    return newResult;
  }

  async getResultsByQuiz(quizId: number): Promise<Result[]> {
    return db
      .select()
      .from(results)
      .where(eq(results.quizId, quizId))
      .orderBy(desc(results.score), desc(results.completedAt));
  }

  async getResultsByUser(userId: number): Promise<Result[]> {
    return db
      .select()
      .from(results)
      .where(eq(results.userId, userId))
      .orderBy(desc(results.completedAt));
  }

  async getQuizLeaderboard(quizId: number): Promise<(Result & { username: string })[]> {
    try {
      const leaderboard = await db
        .select({
          ...results,
          username: users.username,
        })
        .from(results)
        .leftJoin(users, eq(results.userId, users.id))
        .where(eq(results.quizId, quizId))
        .orderBy(desc(results.score), sql`${results.timeTaken} ASC`, desc(results.completedAt))
        .limit(10);
      return leaderboard;
    } catch (error) {
      console.error("Error in getQuizLeaderboard:", error);
      return [];
    }
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ points: (user.points || 0) + points })
        .where(eq(users.id, userId));
    }
  }
}

export const storage = new DatabaseStorage();