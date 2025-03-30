import { users, quizzes, questions, results, achievements, userAchievements, friendships, type User, type Quiz, type Question, type Result, type UpdateQuiz, type UpdateQuestion, type UpdateUserProfile, type Achievement, type UserAchievement, type Friendship } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gt, lt, or } from "drizzle-orm";
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
  getQuizzesByTeacher(teacherId: number): Promise<Quiz[]>;
  getPublicQuizzes(): Promise<Quiz[]>;
  getPublicQuizzesWithTeachers(): Promise<(Quiz & { teacherName: string })[]>;
  getLiveQuizzes(): Promise<(Quiz & { teacherName: string })[]>;
  getQuizzesForStudent(userId: number): Promise<Quiz[]>;

  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: Omit<Question, "id">): Promise<Question>;
  updateQuestion(id: number, question: UpdateQuestion): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  getQuestionsByQuiz(quizId: number): Promise<Question[]>;

  createResult(result: Omit<Result, "id" | "completedAt">): Promise<Result>;
  getResultsByQuiz(quizId: number): Promise<Result[]>;
  getResultsByUser(userId: number): Promise<Result[]>;
  getQuizLeaderboard(quizId: number): Promise<(Result & { username: string })[]>;
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

  async getUserWithDetails(userId: number): Promise<any> {
    try {
      // Get user details
      const user = await this.getUser(userId);
      if (!user) throw new Error("User not found");

      // Get user's achievements
      const userAchievementsList = await this.getUserAchievements(userId);
      
      // Get user's statistics
      const results = await this.getResultsByUser(userId);
      
      const quizzesTaken = results.length;
      const totalScore = results.reduce((sum, result) => sum + result.score, 0);
      const averageScore = quizzesTaken > 0 
        ? Math.round((totalScore / quizzesTaken) * 100) / 100 
        : 0;
        
      // Get global rank
      const leaderboard = await this.getGlobalLeaderboard(100);
      const rank = leaderboard.findIndex(entry => entry.id === userId) + 1;
      
      return {
        ...user,
        stats: {
          quizzesTaken,
          totalScore,
          averageScore,
          globalRank: rank > 0 ? rank : null
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

  async getQuizzesForStudent(userId: number): Promise<Quiz[]> {
    try {
      // Get user's branch and year
      const user = await this.getUser(userId);
      
      if (!user) return [];
      
      // Get quizzes that are either:
      // 1. Public with no target branch/year, OR
      // 2. Public with matching target branch/year
      return await db
        .select()
        .from(quizzes)
        .where(
          and(
            eq(quizzes.isPublic, true),
            or(
              // No targeting
              and(
                sql`${quizzes.targetBranch} IS NULL`,
                sql`${quizzes.targetYear} IS NULL`
              ),
              // Branch targeting matches
              and(
                eq(quizzes.targetBranch, user.branch),
                sql`${quizzes.targetYear} IS NULL`
              ),
              // Year targeting matches
              and(
                eq(quizzes.targetYear, user.year),
                sql`${quizzes.targetBranch} IS NULL`
              ),
              // Both branch and year targeting match
              and(
                eq(quizzes.targetBranch, user.branch),
                eq(quizzes.targetYear, user.year)
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

  async getGlobalLeaderboard(limit: number = 10): Promise<(User & { totalScore: number })[]> {
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
          totalScore: sql<number>`SUM(${results.score})`,
        })
        .from(users)
        .leftJoin(results, eq(users.id, results.userId))
        .groupBy(users.id, users.username, users.name, users.profilePicture, users.role, users.points)
        .orderBy(desc(sql`SUM(${results.score})`), desc(users.points))
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
      const friendships = await db
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
      const friendIds = friendships.map(f => 
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
          ...friendships,
          sender: users,
        })
        .from(friendships)
        .innerJoin(users, eq(friendships.userId, users.id))
        .where(
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
}

export const storage = new DatabaseStorage();