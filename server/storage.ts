import { InsertUser, User, Quiz, Question, Result } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: number): Promise<Quiz[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  
  createQuestion(question: Omit<Question, "id">): Promise<Question>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;
  
  createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result>;
  getResultsByQuiz(quizId: number): Promise<Result[]>;
  getResultsByUser(userId: number): Promise<Result[]>;
  
  updateUserPoints(userId: number, points: number): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private results: Map<number, Result>;
  private currentId: { [key: string]: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.results = new Map();
    this.currentId = { users: 1, quizzes: 1, questions: 1, results: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, points: 0 };
    this.users.set(id, user);
    return user;
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const id = this.currentId.quizzes++;
    const newQuiz: Quiz = { ...quiz, id, createdAt: new Date() };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(
      (quiz) => quiz.createdBy === teacherId,
    );
  }

  async getPublicQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter((quiz) => quiz.isPublic);
  }

  async createQuestion(question: Omit<Question, "id">): Promise<Question> {
    const id = this.currentId.questions++;
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }

  async getQuestionsByQuiz(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.quizId === quizId,
    );
  }

  async createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result> {
    const id = this.currentId.results++;
    const newResult: Result = { ...result, id, completedAt: new Date() };
    this.results.set(id, newResult);
    return newResult;
  }

  async getResultsByQuiz(quizId: number): Promise<Result[]> {
    return Array.from(this.results.values()).filter(
      (result) => result.quizId === quizId,
    );
  }

  async getResultsByUser(userId: number): Promise<Result[]> {
    return Array.from(this.results.values()).filter(
      (result) => result.userId === userId,
    );
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.points += points;
      this.users.set(userId, user);
    }
  }
}

export const storage = new MemStorage();
