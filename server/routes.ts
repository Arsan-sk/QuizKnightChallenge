import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertQuizSchema, 
  insertQuestionSchema, 
  insertResultSchema,
  updateQuizSchema,
  updateQuestionSchema,
  updateUserProfileSchema
} from "@shared/schema";

// Helper middleware to check if user is authenticated with specific role
const requireAuth = (req: Request, res: Response, next: Function, role?: "teacher" | "student") => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (role && req.user.role !== role) {
    return res.status(403).json({ error: `${role} role required` });
  }
  
  next();
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // User profile routes
  app.get("/api/users/me", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userDetails = await storage.getUserWithDetails(req.user.id);
      res.json(userDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  app.put("/api/users/profile", async (req, res) => {
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

  app.get("/api/users/:id", async (req, res) => {
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

  // Social features routes
  app.get("/api/friends", async (req, res) => {
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

  app.get("/api/friends/requests", async (req, res) => {
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

  app.post("/api/friends/request/:userId", async (req, res) => {
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

  app.post("/api/friends/accept/:userId", async (req, res) => {
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

  app.post("/api/friends/reject/:userId", async (req, res) => {
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

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/users/:id/achievements", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  // Global leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getGlobalLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch global leaderboard" });
    }
  });

  // Targeted quizzes for student
  app.get("/api/quizzes/student", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "student") {
        return res.status(403).json({ error: "Student role required" });
      }
      
      const quizzes = await storage.getQuizzesForStudent(req.user.id);
      res.json(quizzes || []);
    } catch (error) {
      console.error("Error fetching student quizzes:", error);
      res.status(500).json({ error: "Failed to fetch student quizzes" });
    }
  });

  // Quiz routes
  app.post("/api/quizzes", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const validatedData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz({
        ...validatedData,
        createdBy: req.user.id,
        isPublic: validatedData.isPublic ?? false,
      });
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(400).json({ error: error.message || "Failed to create quiz" });
    }
  });

  // Update quiz
  app.put("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      // Check if the quiz exists and belongs to this teacher
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to update this quiz" });
      }

      const validatedData = updateQuizSchema.parse(req.body);
      const updatedQuiz = await storage.updateQuiz(quizId, validatedData);
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(400).json({ error: error.message || "Failed to update quiz" });
    }
  });

  // Delete quiz
  app.delete("/api/quizzes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      // Check if the quiz exists and belongs to this teacher
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

  // Start a live quiz
  app.post("/api/quizzes/:id/start", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      // Check if the quiz exists and belongs to this teacher
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

      const duration = req.body.duration || quiz.duration;
      if (!duration) {
        return res.status(400).json({ error: "Duration is required for live quizzes" });
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60000); // convert minutes to milliseconds
      
      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: true,
        startTime,
        endTime,
      });
      
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({ error: "Failed to start quiz" });
    }
  });

  // End a live quiz
  app.post("/api/quizzes/:id/end", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const quizId = parseInt(req.params.id);
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }

      // Check if the quiz exists and belongs to this teacher
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      if (quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to end this quiz" });
      }
      
      if (!quiz.isActive) {
        return res.status(400).json({ error: "Quiz is not active" });
      }

      const updatedQuiz = await storage.updateQuiz(quizId, {
        isActive: false,
        endTime: new Date(),
      });
      
      res.json(updatedQuiz);
    } catch (error) {
      console.error("Error ending quiz:", error);
      res.status(500).json({ error: "Failed to end quiz" });
    }
  });

  app.get("/api/quizzes/teacher", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }
      
      const quizzes = await storage.getQuizzesByTeacher(req.user.id);
      res.json(quizzes || []);
    } catch (error) {
      console.error("Error fetching teacher quizzes:", error);
      res.status(500).json({ error: "Failed to fetch teacher quizzes" });
    }
  });

  app.get("/api/quizzes/public", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const quizzes = await storage.getPublicQuizzesWithTeachers();
      res.json(quizzes || []);
    } catch (error) {
      console.error("Error fetching public quizzes:", error);
      res.status(500).json({ error: "Failed to fetch public quizzes" });
    }
  });

  // Get active live quizzes
  app.get("/api/quizzes/live", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "student") {
        return res.status(403).json({ error: "Student role required" });
      }
      
      const quizzes = await storage.getLiveQuizzes();
      res.json(quizzes || []);
    } catch (error) {
      console.error("Error fetching live quizzes:", error);
      res.status(500).json({ error: "Failed to fetch live quizzes" });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
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

      // Check if user has access to this quiz
      if (!quiz.isPublic && quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this quiz" });
      }

      // For live quizzes, check if the quiz is active
      if (quiz.quizType === "live" && !quiz.isActive && req.user.role === "student") {
        return res.status(403).json({ error: "This live quiz is not currently active" });
      }

      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Question routes
  app.post("/api/quizzes/:quizId/questions", async (req, res) => {
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
        quizId: quizId
      });
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(400).json({ error: error.message || "Failed to create question" });
    }
  });

  // Update question
  app.put("/api/questions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      // Check if the question exists
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Check if the quiz belongs to this teacher
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

  // Delete question
  app.delete("/api/questions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "teacher") {
        return res.status(403).json({ error: "Teacher role required" });
      }

      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question ID" });
      }

      // Check if the question exists
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Check if the quiz belongs to this teacher
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

  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
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

      // Check if user has access to this quiz
      if (!quiz.isPublic && quiz.createdBy !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to access this quiz" });
      }

      // For live quizzes, check if the quiz is active
      if (quiz.quizType === "live" && !quiz.isActive && req.user.role === "student") {
        return res.status(403).json({ error: "This live quiz is not currently active" });
      }

      const questions = await storage.getQuestionsByQuiz(quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Results routes
  app.post("/api/quizzes/:quizId/results", async (req, res) => {
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

      // For live quizzes, check if the quiz is active
      if (quiz.quizType === "live" && !quiz.isActive) {
        return res.status(403).json({ error: "This live quiz is not currently active" });
      }

      const validatedData = insertResultSchema.parse(req.body);
      const result = await storage.createResult({
        ...validatedData,
        userId: req.user.id,
        quizId: quizId,
      });

      // Award points based on score
      const pointsEarned = Math.floor(result.score * 10);
      await storage.updateUserPoints(req.user.id, pointsEarned);

      res.status(201).json(result);
    } catch (error) {
      console.error("Error submitting result:", error);
      res.status(400).json({ error: error.message || "Failed to submit result" });
    }
  });

  app.get("/api/results/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const results = await storage.getResultsByUser(req.user.id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching user results:", error);
      res.status(500).json({ error: "Failed to fetch user results" });
    }
  });

  // Get leaderboard for a specific quiz
  app.get("/api/quizzes/:quizId/leaderboard", async (req, res) => {
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

      const leaderboard = await storage.getQuizLeaderboard(quizId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/quiz/:quizId", async (req, res) => {
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

      // If user is not the creator of the quiz and not a teacher, deny access
      if (quiz.createdBy !== req.user.id && req.user.role !== "teacher") {
        return res.status(403).json({ error: "Not authorized to access this quiz's analytics" });
      }

      // Get all results for this quiz
      const results = await storage.getResultsByQuiz(quizId);
      
      if (!results || results.length === 0) {
        return res.json({
          totalAttempts: 0,
          averageScore: null,
          highestScore: null,
          lowestScore: null,
          averageTime: null,
          questionStats: [],
          performanceDistribution: [
            { scoreRange: "0-59%", count: 0 },
            { scoreRange: "60-69%", count: 0 },
            { scoreRange: "70-79%", count: 0 },
            { scoreRange: "80-89%", count: 0 },
            { scoreRange: "90-100%", count: 0 }
          ],
          timePerformance: []
        });
      }

      // Calculate basic statistics
      const totalAttempts = results.length;
      const scores = results.map(r => r.score * 100); // Convert to percentage
      const durations = results.map(r => r.timeTaken);
      
      const averageScore = scores.reduce((acc, val) => acc + val, 0) / totalAttempts;
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);
      const averageTime = durations.reduce((acc, val) => acc + val, 0) / totalAttempts;

      // Get questions for this quiz
      const questions = await storage.getQuestionsByQuiz(quizId);
      
      // Calculate statistics for each question
      const questionStats = questions.map(question => {
        // In a real implementation, you would analyze actual question results
        // This is a simplified version that generates mock data
        const totalAttempts = results.length;
        const correctCount = Math.floor(Math.random() * totalAttempts);
        const averageTime = Math.floor(Math.random() * 30) + 5; // 5-35 seconds
        
        return {
          questionId: question.id,
          questionText: question.questionText,
          totalAttempts,
          correctCount,
          averageTime
        };
      });

      // Calculate performance distribution
      const performanceDistribution = [
        { scoreRange: "0-59%", count: scores.filter(s => s < 60).length },
        { scoreRange: "60-69%", count: scores.filter(s => s >= 60 && s < 70).length },
        { scoreRange: "70-79%", count: scores.filter(s => s >= 70 && s < 80).length },
        { scoreRange: "80-89%", count: scores.filter(s => s >= 80 && s < 90).length },
        { scoreRange: "90-100%", count: scores.filter(s => s >= 90).length }
      ];

      // Generate time performance data
      // In a real implementation, this would come from actual timestamps in the results
      const timePerformance = [];
      const now = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Generate random stats for this day
        const attempts = Math.floor(Math.random() * 10);
        const avgScore = Math.floor(Math.random() * 30) + 70; // 70-100%
        const correct = Math.floor(Math.random() * 50) + 50; // 50-100
        const wrong = Math.floor(Math.random() * 30); // 0-30
        
        timePerformance.push({
          date: dateStr,
          attempts,
          averageScore: avgScore,
          correct,
          wrong
        });
      }

      res.json({
        totalAttempts,
        averageScore,
        highestScore,
        lowestScore,
        averageTime,
        questionStats,
        performanceDistribution,
        timePerformance
      });
    } catch (error) {
      console.error("Error generating analytics:", error);
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}