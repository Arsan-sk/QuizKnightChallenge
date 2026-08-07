import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export type StudentStatus = 'waiting' | 'verifying' | 'in_quiz' | 'submitted';

export interface Participant {
  userId: number;
  username: string;
  joinedAt: string;
  status: StudentStatus;
  score?: number;
  totalQuestions?: number;
  durationSeconds?: number;
  completedAt?: string;
}

export interface SessionState {
  quizId: number;
  sessionId?: number;
  batchName?: string;
  state: 'waiting' | 'active' | 'completed';
  participants: Map<number, Participant>;
}

// In-memory registry for high-performance concurrent session tracking
const sessionRegistry = new Map<number, SessionState>();
const roomSockets = new Map<number, Set<WebSocket>>();
const socketMetadata = new Map<WebSocket, { quizId: number; userId: number; role: 'teacher' | 'student'; username: string }>();

function getOrCreateSession(quizId: number): SessionState {
  let session = sessionRegistry.get(quizId);
  if (!session) {
    session = {
      quizId,
      state: 'waiting',
      participants: new Map(),
    };
    sessionRegistry.set(quizId, session);
  }
  return session;
}

function getRoomSockets(quizId: number): Set<WebSocket> {
  let sockets = roomSockets.get(quizId);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(quizId, sockets);
  }
  return sockets;
}

function broadcastToRoom(quizId: number, message: any) {
  const sockets = roomSockets.get(quizId);
  if (!sockets || sockets.size === 0) return;
  const data = JSON.stringify(message);

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  }
}

function buildParticipantList(session: SessionState): Participant[] {
  return Array.from(session.participants.values()).sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
}

function buildLeaderboard(session: SessionState): (Participant & { rank: number })[] {
  const submitted = Array.from(session.participants.values())
    .filter((p) => p.status === 'submitted' && p.score !== undefined)
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0); // Higher score first
      }
      return (a.durationSeconds || 0) - (b.durationSeconds || 0); // Faster duration tiebreaker
    });

  return submitted.map((p, index) => ({
    ...p,
    rank: index + 1,
  }));
}

export function setupWebSockets(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (rawMessage: string) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        const { type, quizId, userId, username, role, status, sessionId, batchName, score, totalQuestions, durationSeconds } = data;

        if (!quizId) return;

        const session = getOrCreateSession(quizId);
        const sockets = getRoomSockets(quizId);

        switch (type) {
          case 'JOIN_ROOM': {
            sockets.add(ws);
            socketMetadata.set(ws, { quizId, userId, role, username });

            if (role === 'student' && userId) {
              const existing = session.participants.get(userId);
              const participant: Participant = {
                userId,
                username: username || `Student #${userId}`,
                joinedAt: existing?.joinedAt || new Date().toISOString(),
                status: existing?.status || (session.state === 'active' ? 'in_quiz' : 'waiting'),
                score: existing?.score,
                totalQuestions: existing?.totalQuestions,
                durationSeconds: existing?.durationSeconds,
                completedAt: existing?.completedAt,
              };
              session.participants.set(userId, participant);
            }

            // Send initial room snapshot to joining client
            ws.send(
              JSON.stringify({
                type: 'ROOM_SNAPSHOT',
                quizId,
                state: session.state,
                sessionId: session.sessionId,
                batchName: session.batchName,
                participants: buildParticipantList(session),
                leaderboard: buildLeaderboard(session),
              })
            );

            // Broadcast updated participant list to room
            broadcastToRoom(quizId, {
              type: 'PARTICIPANTS_UPDATED',
              quizId,
              state: session.state,
              participants: buildParticipantList(session),
            });
            break;
          }

          case 'LEAVE_ROOM': {
            sockets.delete(ws);
            socketMetadata.delete(ws);
            if (role === 'student' && userId && session.state === 'waiting') {
              const p = session.participants.get(userId);
              if (p && p.status === 'waiting') {
                session.participants.delete(userId);
                broadcastToRoom(quizId, {
                  type: 'PARTICIPANTS_UPDATED',
                  quizId,
                  state: session.state,
                  participants: buildParticipantList(session),
                });
              }
            }
            break;
          }

          case 'UPDATE_STATUS': {
            if (userId && status) {
              const participant = session.participants.get(userId);
              if (participant) {
                participant.status = status as StudentStatus;
                session.participants.set(userId, participant);

                broadcastToRoom(quizId, {
                  type: 'PARTICIPANT_STATUS_CHANGED',
                  quizId,
                  userId,
                  username: participant.username,
                  status,
                  participants: buildParticipantList(session),
                });
              }
            }
            break;
          }

          case 'LAUNCH_SESSION': {
            session.state = 'active';
            if (sessionId) session.sessionId = sessionId;
            if (batchName) session.batchName = batchName;

            // Transition all currently waiting participants to verifying / active
            for (const [pId, p] of session.participants.entries()) {
              if (p.status === 'waiting') {
                p.status = 'verifying';
                session.participants.set(pId, p);
              }
            }

            broadcastToRoom(quizId, {
              type: 'SESSION_LAUNCHED',
              quizId,
              sessionId: session.sessionId,
              batchName: session.batchName,
              participants: buildParticipantList(session),
              leaderboard: buildLeaderboard(session),
            });
            break;
          }

          case 'SUBMIT_QUIZ': {
            if (userId) {
              const existing = session.participants.get(userId);
              const participant: Participant = {
                userId,
                username: username || existing?.username || `Student #${userId}`,
                joinedAt: existing?.joinedAt || new Date().toISOString(),
                status: 'submitted',
                score: Number(score || 0),
                totalQuestions: Number(totalQuestions || 0),
                durationSeconds: Number(durationSeconds || 0),
                completedAt: new Date().toISOString(),
              };
              session.participants.set(userId, participant);

              const leaderboard = buildLeaderboard(session);

              broadcastToRoom(quizId, {
                type: 'SUBMISSION_RECEIVED',
                quizId,
                userId,
                username: participant.username,
                score: participant.score,
                durationSeconds: participant.durationSeconds,
                participants: buildParticipantList(session),
                leaderboard,
              });
            }
            break;
          }

          case 'END_SESSION': {
            session.state = 'completed';
            broadcastToRoom(quizId, {
              type: 'SESSION_ENDED',
              quizId,
              sessionId: session.sessionId,
              participants: buildParticipantList(session),
              leaderboard: buildLeaderboard(session),
            });
            // Cleanly delete the ended session from registry so future session launches start fresh
            sessionRegistry.delete(quizId);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      const meta = socketMetadata.get(ws);
      if (meta) {
        const { quizId, userId, role } = meta;
        const sockets = roomSockets.get(quizId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            roomSockets.delete(quizId);
          }
        }
        socketMetadata.delete(ws);

        // Phase 1: Immediately remove student from waiting room on disconnect if session hasn't launched yet
        if (role === 'student' && userId) {
          const session = sessionRegistry.get(quizId);
          if (session && session.state === 'waiting') {
            const p = session.participants.get(userId);
            if (p && p.status === 'waiting') {
              session.participants.delete(userId);
              broadcastToRoom(quizId, {
                type: 'PARTICIPANTS_UPDATED',
                quizId,
                state: session.state,
                participants: buildParticipantList(session),
              });
            }
          }
        }
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  return wss;
}
