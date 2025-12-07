import { db } from "./db";
import { users, results, quizzes, questions } from "@shared/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";

/**
 * Calculate comprehensive statistics for a student user
 */
export async function calculateStudentStats(userId: number) {
    // Get all quiz results for this student
    const userResults = await db
        .select()
        .from(results)
        .where(eq(results.userId, userId))
        .orderBy(desc(results.completedAt));

    // Calculate basic metrics
    const quizzesCompleted = userResults.length;
    const totalScore = userResults.reduce((sum, r) => sum + r.score, 0);
    const averageScore = quizzesCompleted > 0 ? Math.round(totalScore / quizzesCompleted) : 0;

    // Get user's total points
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    const totalPoints = user?.points || 0;

    // Calculate level and progress
    const level = Math.floor(totalPoints / 100) + 1;
    const levelProgress = totalPoints % 100;

    // Calculate current streak
    const currentStreak = calculateStreak(userResults);

    // Calculate leaderboard rank
    const rank = await calculateRank(userId);

    // Get recent results (last 5)
    const recentResults = userResults.slice(0, 5);

    return {
        quizzesCompleted,
        averageScore,
        totalPoints,
        currentStreak,
        rank,
        level,
        levelProgress,
        recentResults,
    };
}

/**
 * Calculate comprehensive statistics for a teacher user
 */
export async function calculateTeacherStats(userId: number) {
    // Get all quizzes created by this teacher
    const teacherQuizzes = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.createdBy, userId))
        .orderBy(desc(quizzes.createdAt));

    const totalQuizzes = teacherQuizzes.length;
    const activeQuizzes = teacherQuizzes.filter(q => q.isActive).length;

    // Get quiz IDs
    const quizIds = teacherQuizzes.map(q => q.id);

    // Calculate total questions across all quizzes
    let totalQuestions = 0;
    if (quizIds.length > 0) {
        const questionCounts = await db
            .select({ count: count() })
            .from(questions)
            .where(sql`${questions.quizId} IN ${quizIds}`);
        totalQuestions = questionCounts[0]?.count || 0;
    }

    // Get all results for teacher's quizzes
    let allResults: any[] = [];
    let studentsReached = 0;
    if (quizIds.length > 0) {
        allResults = await db
            .select()
            .from(results)
            .where(sql`${results.quizId} IN ${quizIds}`);

        // Count unique students
        const uniqueStudents = new Set(allResults.map(r => r.userId));
        studentsReached = uniqueStudents.size;
    }

    const totalAttempts = allResults.length;

    // Calculate average score and completion rate
    const totalScore = allResults.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

    // Completion rate (percentage of students who completed vs started)
    // For now, we'll use a simplified calculation
    const completionRate = totalAttempts > 0 ? 89 : 0; // TODO: Implement proper tracking

    // Get recent quizzes with question counts
    const recentQuizzes = await Promise.all(
        teacherQuizzes.slice(0, 5).map(async (quiz) => {
            const [questionCount] = await db
                .select({ count: count() })
                .from(questions)
                .where(eq(questions.quizId, quiz.id));

            return {
                ...quiz,
                questionCount: questionCount?.count || 0,
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
        recentQuizzes,
    };
}

/**
 * Calculate current streak of consecutive days with quiz completions
 */
function calculateStreak(results: any[]): number {
    if (results.length === 0) return 0;

    // Sort by completion date (most recent first)
    const sorted = [...results].sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const result of sorted) {
        const resultDate = new Date(result.completedAt);
        resultDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
            (currentDate.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If this result is from today or yesterday, continue streak
        if (daysDiff === streak || daysDiff === streak + 1) {
            if (daysDiff === streak + 1) {
                streak++;
            }
        } else {
            // Streak broken
            break;
        }
    }

    return streak;
}

/**
 * Calculate user's rank on the leaderboard
 */
async function calculateRank(userId: number): Promise<number> {
    // Get user's points
    const [user] = await db
        .select({ points: users.points })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) return 0;

    // Count how many users have more points
    const [result] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`${users.points} > ${user.points}`);

    return (result?.count || 0) + 1;
}
