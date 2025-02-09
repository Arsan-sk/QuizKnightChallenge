import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertQuizSchema, insertQuestionSchema, insertResultSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Quiz routes
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "teacher") {
      return res.sendStatus(403);
    }
    
    const validatedData = insertQuizSchema.parse(req.body);
    const quiz = await storage.createQuiz({
      ...validatedData,
      createdBy: req.user.id,
    });
    res.status(201).json(quiz);
  });

  app.get("/api/quizzes/teacher", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "teacher") {
      return res.sendStatus(403);
    }
    const quizzes = await storage.getQuizzesByTeacher(req.user.id);
    res.json(quizzes);
  });

  app.get("/api/quizzes/public", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quizzes = await storage.getPublicQuizzes();
    res.json(quizzes);
  });

  // Question routes
  app.post("/api/quizzes/:quizId/questions", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "teacher") {
      return res.sendStatus(403);
    }
    
    const quiz = await storage.getQuiz(parseInt(req.params.quizId));
    if (!quiz || quiz.createdBy !== req.user.id) {
      return res.sendStatus(403);
    }

    const validatedData = {
      ...req.body,
      quizId: parseInt(req.params.quizId)
    };
    const question = await storage.createQuestion(validatedData);
    res.status(201).json(question);
  });

  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const questions = await storage.getQuestionsByQuiz(parseInt(req.params.quizId));
    res.json(questions);
  });

  // Results routes
  app.post("/api/quizzes/:quizId/results", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "student") {
      return res.sendStatus(403);
    }

    const validatedData = insertResultSchema.parse(req.body);
    const result = await storage.createResult({
      ...validatedData,
      userId: req.user.id,
      quizId: parseInt(req.params.quizId),
    });

    // Award points based on score
    const pointsEarned = Math.floor(result.score * 10);
    await storage.updateUserPoints(req.user.id, pointsEarned);

    res.status(201).json(result);
  });

  app.get("/api/results/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const results = await storage.getResultsByUser(req.user.id);
    res.json(results);
  });

  const httpServer = createServer(app);
  return httpServer;
}
