import { Router } from "express";
import {
  githubOAuthRedirect,
  githubOAuthCallback,
  refreshToken,
  logout,
  getCurrentUser,
} from "../controllers/authController";
import { authenticateSession } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimit";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

// Auth endpoints - rate limited
router.get("/github", authLimiter, githubOAuthRedirect);
router.get("/github/callback", apiLimiter, githubOAuthCallback);
router.post("/refresh", apiLimiter, refreshToken);

// Protected auth endpoints
router.use(authenticateSession);

router.post("/logout", logout);
router.get("/me", getCurrentUser);

export default router;
