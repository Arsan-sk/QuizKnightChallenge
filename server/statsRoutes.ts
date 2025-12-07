import type { Express } from "express";
import { storage } from "./storage";
import { calculateStudentStats, calculateTeacherStats } from "./stats";

/**
 * Register stats-related routes
 * Separated to avoid editing the main routes.ts file
 */
export function registerStatsRoutes(app: Express) {
    // Get user statistics (dynamic profile data)
    app.get("/api/users/:id/stats", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ error: "Authentication required" });
            }

            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }

            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Calculate stats based on user role
            let stats;
            if (user.role === "student") {
                stats = await calculateStudentStats(userId);
            } else {
                stats = await calculateTeacherStats(userId);
            }

            res.json(stats);
        } catch (error) {
            console.error("Error calculating user stats:", error);
            res.status(500).json({ error: "Failed to calculate statistics" });
        }
    });
}
