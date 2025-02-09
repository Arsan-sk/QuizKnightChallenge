import { users, quizzes, questions, results, type User, type Quiz, type Question, type Result } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "points">): Promise<User>;

  createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: number): Promise<Quiz[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string })[]>;

  createQuestion(question: Omit<Question, "id">): Promise<Question>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;

  createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result>;
  getResultsByQuiz(quizId: number): Promise<Result[]>;
  getResultsByUser(userId: number): Promise<Result[]>;

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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: Omit<User, "id" | "points">): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, points: 0 })
      .returning();
    return user;
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const [newQuiz] = await db
      .insert(quizzes)
      .values({ ...quiz, createdAt: new Date() })
      .returning();
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    try {
      return await db.select().from(quizzes).where(eq(quizzes.createdBy, teacherId));
    } catch (error) {
      console.error("Error in getQuizzesByTeacher:", error);
      return [];
    }
  }

  async getPublicQuizzes(): Promise<Quiz[]> {
    try {
      return await db.select().from(quizzes).where(eq(quizzes.isPublic, true));
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
        .where(eq(quizzes.isPublic, true));
      return quizzesWithTeachers;
    } catch (error) {
      console.error("Error in getPublicQuizzesWithTeachers:", error);
      return [];
    }
  }

  async createQuestion(question: Omit<Question, "id">): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
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
    return db.select().from(results).where(eq(results.quizId, quizId));
  }

  async getResultsByUser(userId: number): Promise<Result[]> {
    return db.select().from(results).where(eq(results.userId, userId));
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