Failed to parse stored answers for result 221 SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at <anonymous> (D:\Projects\QuizKnightChallenge\server\routes.ts:884:33)
    at Array.forEach (<anonymous>)
    at <anonymous> (D:\Projects\QuizKnightChallenge\server\routes.ts:880:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
7:42:28 PM [express] GET /api/analytics/quiz/14 200 in 36ms :: {"totalAttempts":1,"averageScore":100…-- Migration: 0004_remove_students.sql
-- Purpose: Permanently remove all users with role = 'student' and related data
-- WARNING: This is destructive. BACKUP your database before running.
BEGIN;

-- Delete dependent rows first to avoid FK constraint errors
DELETE FROM results WHERE user_id IN (SELECT id FROM users WHERE role = 'student');
DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM users WHERE role = 'student');
DELETE FROM friendships WHERE user_id IN (SELECT id FROM users WHERE role = 'student') OR friend_id IN (SELECT id FROM users WHERE role = 'student');

-- If you have any other tables that reference users (sessions, messages, etc.), add deletes here.
-- Example for connect-pg-simple session table if you store user id inside the session jsonb under key 'userId':
-- DELETE FROM session WHERE (sess::jsonb)->>'userId' IN (SELECT id::text FROM users WHERE role = 'student');

-- Finally delete the student user rows
DELETE FROM users WHERE role = 'student';

COMMIT;
COMMIT;
