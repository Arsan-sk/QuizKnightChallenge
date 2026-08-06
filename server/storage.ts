import { users, quizzes, questions, results, achievements, userAchievements, friendships, liveSessions, type User, type Quiz, type Question, type Result, type UpdateQuiz, type UpdateQuestion, type UpdateUserProfile, type Achievement, type UserAchievement, type Friendship, type LiveSession, type InsertLiveSession } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, lt, or, asc, getTableColumns, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "points">): Promise<User>;
  getUserWithDetails(userId: number): Promise<any>;
  updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User>;

  createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<UpdateQuiz>): Promise<Quiz>;
  deleteQuiz(id: number): Promise<void>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByAccessCode(code: string): Promise<Quiz | undefined>;
  getQuizzesByTeacher(teacherId: number): Promise<(Quiz & { attemptCount?: number })[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string; attemptCount?: number })[]>;
  getLiveQuizzes(): Promise<(Quiz & { teacherName: string })[]>;
  getQuizzesForStudent(userId: number): Promise<Quiz[]>;

  // Live Session methods
  createLiveSession(quizId: number, sessionName: string): Promise<LiveSession>;
  getActiveLiveSession(quizId: number): Promise<LiveSession | undefined>;
  endLiveSession(sessionId: number): Promise<LiveSession | undefined>;
  getLiveSessionsByQuiz(quizId: number): Promise<(LiveSession & { attemptCount: number })[]>;
  getLiveSession(sessionId: number): Promise<LiveSession | undefined>;

  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: Omit<Question, "id">): Promise<Question>;
  updateQuestion(id: number, question: UpdateQuestion): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;

  createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result>;
  getResultsByQuiz(quizId: number, sessionId?: number): Promise<Result[]>;
  getResultsByUser(userId: number): Promise<(Result & { quizTitle?: string; maxScore?: number })[]>;
  getQuizLeaderboard(quizId: number, sessionId?: number): Promise<(Result & { username: string })[]>;
  getGlobalLeaderboard(limit?: number): Promise<(User & { totalScore: number })[]>;

  updateUserPoints(userId: number, points: number): Promise<void>;

  // Achievement methods
  getAchievements(): Promise<any[]>;
  getUserAchievements(userId: number): Promise<any[]>;
  awardAchievement(userId: number, achievementId: number): Promise<UserAchievement>;

  // Friendship methods
  getFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<(Friendship & { sender: User })[]>;
  sendFriendRequest(userId: number, friendId: number): Promise<Friendship>;
  acceptFriendRequest(userId: number, friendId: number): Promise<Friendship>;
  rejectFriendRequest(userId: number, friendId: number): Promise<Friendship>;

  sessionStore: session.Store;

  // Method to get a specific user's result for a quiz
  getUserQuizResult(quizId: number, userId: number): Promise<Result | null>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      errorLog: (err: any) => console.error("Postgres session store error:", err),
    });

    // Handle generic store errors to prevent process crashes
    this.sessionStore.on('error', (err: any) => {
      console.error("Session store error:", err);
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

  async getUserWithDetails(userId: number): Promise<any> {
    try {
      // Get user details
      const user = await this.getUser(userId);
      if (!user) {
        console.warn(`getUserWithDetails: user ${userId} not found`);
        return null;
      }

      // Get user's achievements
      const userAchievementsList = await this.getUserAchievements(userId);
      
      // Get user's statistics
      const results = await this.getResultsByUser(userId);
      
      const quizzesTaken = results.length;
      
      // Calculate totalScore based on cumulative points earned (authoritative metric)
      const totalScore = results.reduce((sum, result) => sum + (result.pointsEarned || 0), 0);

      // Average score as percentage (based on stored percentage score values)
      const averageScore = quizzesTaken > 0
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / quizzesTaken)
        : 0;
        
      // Calculate winning streak (consecutive quizzes with 80%+ accuracy, most recent first)
      let winStreak = 0;
      const sortedResults = results.sort((a, b) => (b.completedAt ? new Date(b.completedAt).getTime() : 0) - (a.completedAt ? new Date(a.completedAt).getTime() : 0));
      
      for (const r of sortedResults) {
        if (r.score >= 80) {
          winStreak++;
        } else {
          break; // Streak broken
        }
      }
      
      // Get global rank
      const leaderboard = await this.getGlobalLeaderboard(0);
      const rank = leaderboard.findIndex(entry => entry.id === userId) + 1;
      
      return {
        ...user,
        stats: {
          quizzesTaken,
          totalScore,
          averageScore,
          globalRank: rank > 0 ? rank : undefined,
          winStreak: winStreak
        },
        achievements: userAchievementsList
      };
    } catch (error) {
      console.error("Error in getUserWithDetails:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    try {
      // If username is included, check that it's not already taken by another user
      if (profile.username) {
        const existingUser = await this.getUserByUsername(profile.username);
        if (existingUser && existingUser.id !== userId) {
          throw new Error("Username already taken");
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({ 
          ...profile,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  async updateLoginStreak(userId: number): Promise<User> {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastLogin = (user as any).lastLoginDate ? new Date((user as any).lastLoginDate) : null;
      if (lastLogin) lastLogin.setHours(0, 0, 0, 0);
      
      let newStreak = (user as any).loginStreak || 0;
      
      if (!lastLogin || lastLogin.getTime() < today.getTime()) {
        // Not logged in today
        if (lastLogin && lastLogin.getTime() === new Date(today.getTime() - 24 * 60 * 60 * 1000).getTime()) {
          // Logged in yesterday, increment streak
          newStreak = (newStreak || 0) + 1;
        } else if (!lastLogin) {
          // First login ever
          newStreak = 1;
        } else {
          // Break in streak, reset to 1
          newStreak = 1;
        }
        
        // Update user's last login and streak
        const [updatedUser] = await db
          .update(users)
          .set({
            lastLoginDate: new Date(),
            loginStreak: newStreak,
            updatedAt: new Date()
          } as any)
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser;
      }
      
      // Already logged in today, return user as is
      return user;
    } catch (error) {
      console.error("Error in updateLoginStreak:", error);
      throw error;
    }
  }

  async createQuiz(quiz: Omit<Quiz, "id" | "createdAt">): Promise<Quiz> {
    const now = new Date();
    let accessCode = (quiz as any).accessCode || '';
    if (!accessCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 6; i++) {
        accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const [newQuiz] = await db
      .insert(quizzes)
      .values({ 
        ...quiz, 
        accessCode,
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

  async getQuizByAccessCode(code: string): Promise<Quiz | undefined> {
    try {
      const cleanCode = code.trim().toUpperCase();
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(sql`UPPER(${quizzes.accessCode}) = ${cleanCode}`);
      return quiz;
    } catch (error) {
      console.error("Error in getQuizByAccessCode:", error);
      return undefined;
    }
  }

  async getQuizzesByTeacher(teacherId: number): Promise<(Quiz & { attemptCount: number })[]> {
    try {
      const teacherQuizzes = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.createdBy, teacherId))
        .orderBy(desc(quizzes.createdAt));

      const quizzesWithAttempts = await Promise.all(
        teacherQuizzes.map(async (q) => {
          const attempts = await db
            .select({ count: sql<number>`count(*)` })
            .from(results)
            .where(eq(results.quizId, q.id));

          return {
            ...q,
            attemptCount: Number(attempts[0]?.count || 0),
          };
        })
      );

      return quizzesWithAttempts;
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

  async getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string; attemptCount: number })[]> {
    try {
      const quizzesWithTeachers = await db
        .select({
          ...getTableColumns(quizzes),
          teacherName: users.username,
        })
        .from(quizzes)
        .leftJoin(users, eq(quizzes.createdBy, users.id))
        .where(
          and(
            eq(quizzes.isPublic, true),
            or(eq(quizzes.isDraft, false), isNull(quizzes.isDraft))
          )
        )
        .orderBy(desc(quizzes.createdAt));

      const resultList = await Promise.all(
        quizzesWithTeachers.map(async (q) => {
          const attempts = await db
            .select({ count: sql<number>`count(*)` })
            .from(results)
            .where(eq(results.quizId, q.id));

          return {
            ...(q as any),
            attemptCount: Number(attempts[0]?.count || 0),
          };
        })
      );

      return resultList;
    } catch (error) {
      console.error("Error in getPublicQuizzesWithTeachers:", error);
      return [];
    }
  }

  async getQuizzesForStudent(userId: number): Promise<Quiz[]> {
    try {
      // Get user's branch and year
      const user = await this.getUser(userId);
      
      if (!user) return [];
      
      // Get quizzes that are public and not drafts
      return await db
        .select()
        .from(quizzes)
        .where(
          and(
            eq(quizzes.isPublic, true),
            or(eq(quizzes.isDraft, false), isNull(quizzes.isDraft)),
            or(
              // No targeting
              and(
                sql`${quizzes.targetBranch} IS NULL`,
                sql`${quizzes.targetYear} IS NULL`
              ),
              // Branch targeting matches
              and(
                eq(quizzes.targetBranch, user.branch as any),
                sql`${quizzes.targetYear} IS NULL`
              ),
              // Year targeting matches
              and(
                eq(quizzes.targetYear, user.year as any),
                sql`${quizzes.targetBranch} IS NULL`
              ),
              // Both branch and year targeting match
              and(
                eq(quizzes.targetBranch, user.branch as any),
                eq(quizzes.targetYear, user.year as any)
              )
            )
          )
        )
        .orderBy(desc(quizzes.createdAt));
    } catch (error) {
      console.error("Error in getQuizzesForStudent:", error);
      return [];
    }
  }

  async getLiveQuizzes(): Promise<(Quiz & { teacherName: string })[]> {
    try {
      const liveQuizzes = await db
        .select({
          ...getTableColumns(quizzes),
          teacherName: users.username,
        })
        .from(quizzes)
        .leftJoin(users, eq(quizzes.createdBy, users.id))
        .where(
          and(
            eq(quizzes.quizType, "live"),
            eq(quizzes.isPublic, true),
            eq(quizzes.isDraft, false),
            eq(quizzes.isActive, true)
          )
        )
        .orderBy(desc(quizzes.startTime));
      return liveQuizzes as (Quiz & { teacherName: string })[];
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
    // Return questions in stable insertion order (ascending id)
    return db.select().from(questions).where(eq(questions.quizId, quizId)).orderBy(asc(questions.id));
  }

  async createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result> {
    // Ensure answers is stored as a JSON string to avoid array literal issues
    const safeResult = { ...result } as any;
    if (safeResult.answers && !Array.isArray(safeResult.answers) && typeof safeResult.answers !== 'string') {
      // If it's some unexpected type, stringify it
      safeResult.answers = JSON.stringify(safeResult.answers);
    }
    if (Array.isArray(safeResult.answers)) {
      // Coerce arrays to JSON string explicitly
      safeResult.answers = JSON.stringify(safeResult.answers);
    }

    try {
      // Insert without 'answers' first to avoid issues when the column
      // doesn't exist or has an incompatible type in the DB.
      const insertPayload: any = { ...safeResult };
      delete insertPayload.answers;

      const [newResult] = await db
        .insert(results)
        .values({ ...insertPayload, completedAt: new Date() })
        .returning();

      // If answers were provided, try to update the row separately.
      if (safeResult.answers !== undefined) {
        try {
          await db
            .update(results)
            .set({ answers: safeResult.answers })
            .where(eq(results.id, newResult.id));
        } catch (updateError) {
          // Try raw SQL fallbacks: jsonb then text[] literal
          console.warn("Initial answers update failed, attempting raw SQL fallback", { updateError, resultId: newResult.id });
          try {
            // Try casting to jsonb (works if column is jsonb or text)
            await pool.query('UPDATE results SET answers = $1::jsonb WHERE id = $2', [safeResult.answers, newResult.id]);
          } catch (e1) {
            try {
              // If answers is an array JSON, convert to Postgres array literal for text[] columns
              const parsed = typeof safeResult.answers === 'string' ? JSON.parse(safeResult.answers) : safeResult.answers;
              if (Array.isArray(parsed)) {
                const arrLiteral = '{' + parsed.map((s: any) => String(s).replace(/"/g, '\\"')).map((s: string) => `"${s}"`).join(',') + '}';
                await pool.query('UPDATE results SET answers = $1::text[] WHERE id = $2', [arrLiteral, newResult.id]);
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
  async createLiveSession(quizId: number, sessionName: string): Promise<LiveSession> {
    await db
      .update(liveSessions)
      .set({ status: 'completed', endedAt: new Date() })
      .where(and(eq(liveSessions.quizId, quizId), eq(liveSessions.status, 'active')));

    const [session] = await db
      .insert(liveSessions)
      .values({
        quizId,
        sessionName,
        status: 'active',
        startedAt: new Date(),
      })
      .returning();

    return session;
  }

  async getActiveLiveSession(quizId: number): Promise<LiveSession | undefined> {
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(and(eq(liveSessions.quizId, quizId), eq(liveSessions.status, 'active')))
      .orderBy(desc(liveSessions.startedAt))
      .limit(1);

    return session;
  }

  async endLiveSession(sessionId: number): Promise<LiveSession | undefined> {
    const [session] = await db
      .update(liveSessions)
      .set({ status: 'completed', endedAt: new Date() })
      .where(eq(liveSessions.id, sessionId))
      .returning();

    return session;
  }

  async getLiveSessionsByQuiz(quizId: number): Promise<(LiveSession & { attemptCount: number })[]> {
    const sessions = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.quizId, quizId))
      .orderBy(desc(liveSessions.startedAt));

    const resultList = await Promise.all(
      sessions.map(async (sess) => {
        const attempts = await db
          .select({ count: sql<number>`count(*)` })
          .from(results)
          .where(eq(results.sessionId, sess.id));

        return {
          ...sess,
          attemptCount: Number(attempts[0]?.count || 0),
        };
      })
    );

    return resultList;
  }

  async getLiveSession(sessionId: number): Promise<LiveSession | undefined> {
    const [session] = await db
      .select()
      .from(liveSessions)
      .where(eq(liveSessions.id, sessionId));

    return session;
  }

  async getResultsByQuiz(quizId: number, sessionId?: number): Promise<Result[]> {
    if (sessionId !== undefined && sessionId !== null && !isNaN(sessionId)) {
      return db
        .select()
        .from(results)
        .where(and(eq(results.quizId, quizId), eq(results.sessionId, sessionId)))
        .orderBy(desc(results.score), desc(results.completedAt));
    }
    return db
      .select()
      .from(results)
      .where(eq(results.quizId, quizId))
      .orderBy(desc(results.score), desc(results.completedAt));
  }

  async getResultsByUser(userId: number): Promise<(Result & { quizTitle: string; maxScore: number })[]> {
    const userResults = await db
      .select({
        ...getTableColumns(results),
        quizTitle: quizzes.title,
      })
      .from(results)
      .leftJoin(quizzes, eq(results.quizId, quizzes.id))
      .where(eq(results.userId, userId))
      .orderBy(desc(results.completedAt));

    return userResults.map((r) => ({
      ...r,
      quizTitle: r.quizTitle || `Quiz #${r.quizId}`,
      maxScore: (r.totalQuestions && r.totalQuestions > 0) ? (r.totalQuestions * 10) : 100,
    })) as (Result & { quizTitle: string; maxScore: number })[];
  }

  async getQuizLeaderboard(quizId: number, sessionId?: number): Promise<(Result & { username: string })[]> {
    try {
      const whereClause = (sessionId !== undefined && sessionId !== null && !isNaN(sessionId))
        ? and(eq(results.quizId, quizId), eq(results.sessionId, sessionId))
        : eq(results.quizId, quizId);

      const leaderboard = await db
        .select({
          ...getTableColumns(results),
          username: users.username,
        })
        .from(results)
        .leftJoin(users, eq(results.userId, users.id))
        .where(whereClause)
        .orderBy(desc(results.score), sql`${results.timeTaken} ASC`, desc(results.completedAt))
        .limit(10);
      return leaderboard as (Result & { username: string })[];
    } catch (error) {
      console.error("Error in getQuizLeaderboard:", error);
      return [];
    }
  }

  async getGlobalLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      // Group by user and sum scores
      const leaderboard = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          profilePicture: users.profilePicture,
          role: users.role,
          points: users.points,
          // Use cumulative points earned across attempts as the primary global leaderboard metric
          totalScore: sql<number>`SUM(${results.pointsEarned})`,
        })
        .from(users)
        .leftJoin(results, eq(users.id, results.userId))
        .groupBy(users.id, users.username, users.name, users.profilePicture, users.role, users.points)
        .orderBy(desc(sql`SUM(${results.pointsEarned})`), desc(users.points))
        .limit(limit);
        
      return leaderboard;
    } catch (error) {
      console.error("Error in getGlobalLeaderboard:", error);
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

  // Achievements implementation
  async getAchievements(): Promise<any[]> {
    try {
      // Use explicit columns to handle the icon_url field correctly
      const achievementsList = await db
        .select({
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          iconUrl: achievements.iconUrl, // Use the drizzle field instead of SQL literal
          criteria: achievements.criteria,
          createdAt: achievements.createdAt,
        })
        .from(achievements);

      return achievementsList;
    } catch (error) {
      console.error("Error in getAchievements:", error);
      return [];
    }
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    try {
      // Need to use sql literal to reference the actual column name
      const userAchievementsList = await db
        .select({
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          iconUrl: achievements.iconUrl, // Use the drizzle field instead of SQL literal
          criteria: achievements.criteria,
          createdAt: achievements.createdAt,
          earnedAt: userAchievements.earnedAt,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.earnedAt));
        
      return userAchievementsList;
    } catch (error) {
      console.error("Error in getUserAchievements:", error);
      return [];
    }
  }

  async awardAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    try {
      // Check if user already has this achievement
      const [existingAchievement] = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievementId)
          )
        );
        
      if (existingAchievement) {
        return existingAchievement;
      }
      
      // Award new achievement
      const [newUserAchievement] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
        })
        .returning();
        
      return newUserAchievement;
    } catch (error) {
      console.error("Error in awardAchievement:", error);
      throw error;
    }
  }

  // Friendship implementation
  async getFriends(userId: number): Promise<User[]> {
    try {
      // Get all accepted friendships where the user is either the sender or receiver
      const userFriendships = await db
        .select()
        .from(friendships)
        .where(
          and(
            or(
              eq(friendships.userId, userId),
              eq(friendships.friendId, userId)
            ),
            eq(friendships.status, "accepted")
          )
        );
        
      // Extract the IDs of all friends
      const friendIds = userFriendships.map(f => 
        f.userId === userId ? f.friendId : f.userId
      );
      
      if (friendIds.length === 0) return [];
      
      // Get all users who are friends
      const friends = await db
        .select()
        .from(users)
        .where(sql`${users.id} IN (${friendIds.join(',')})`);
        
      return friends;
    } catch (error) {
      console.error("Error in getFriends:", error);
      return [];
    }
  }

  async getFriendRequests(userId: number): Promise<(Friendship & { sender: User })[]> {
    try {
      // Get all pending friend requests where this user is the receiver
      const friendRequests = await db
        .select({
          ...getTableColumns(friendships),
          sender: getTableColumns(users),
        })
        .from(friendships)
        .innerJoin(users, eq(friendships.userId, users.id))
        .where(
          and(
            eq(friendships.friendId, userId),
            eq(friendships.status, "pending")
          )
        );
        
      return friendRequests as (Friendship & { sender: User })[];
    } catch (error) {
      console.error("Error in getFriendRequests:", error);
      return [];
    }
  }

  async sendFriendRequest(userId: number, friendId: number): Promise<Friendship> {
    try {
      // Check if users are the same
      if (userId === friendId) {
        throw new Error("Cannot send friend request to yourself");
      }
      
      // Check if friendship already exists
      const [existingFriendship] = await db
        .select()
        .from(friendships)
        .where(
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
      
      // Send new friend request
      const [newFriendship] = await db
        .insert(friendships)
        .values({
          userId,
          friendId,
          status: "pending",
        })
        .returning();
        
      return newFriendship;
    } catch (error) {
      console.error("Error in sendFriendRequest:", error);
      throw error;
    }
  }

  async acceptFriendRequest(userId: number, friendId: number): Promise<Friendship> {
    try {
      // Find the pending friend request
      const [friendRequest] = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId),
            eq(friendships.status, "pending")
          )
        );
        
      if (!friendRequest) {
        throw new Error("Friend request not found");
      }
      
      // Accept the friend request
      const [updatedFriendship] = await db
        .update(friendships)
        .set({
          status: "accepted",
          updatedAt: new Date(),
        })
        .where(eq(friendships.id, friendRequest.id))
        .returning();
        
      return updatedFriendship;
    } catch (error) {
      console.error("Error in acceptFriendRequest:", error);
      throw error;
    }
  }

  async rejectFriendRequest(userId: number, friendId: number): Promise<Friendship> {
    try {
      // Find the pending friend request
      const [friendRequest] = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, userId),
            eq(friendships.status, "pending")
          )
        );
        
      if (!friendRequest) {
        throw new Error("Friend request not found");
      }
      
      // Reject the friend request
      const [updatedFriendship] = await db
        .update(friendships)
        .set({
          status: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(friendships.id, friendRequest.id))
        .returning();
        
      return updatedFriendship;
    } catch (error) {
      console.error("Error in rejectFriendRequest:", error);
      throw error;
    }
  }

  // Method to get a specific user's result for a quiz
  async getUserQuizResult(quizId: number, userId: number): Promise<Result | null> {
    try {
      const [result] = await db
        .select()
        .from(results)
        .where(
          and(
            eq(results.quizId, quizId),
            eq(results.userId, userId)
          )
        )
        .orderBy(desc(results.completedAt))
        .limit(1);
        
      return result || null;
    } catch (error) {
      console.error("Error in getUserQuizResult:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();
