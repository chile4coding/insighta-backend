import { Router } from "express";
import {
  githubOAuthRedirect,
  githubOAuthCallback,
  refreshToken,
  logout,
} from "../controllers/authController";
import { authenticateSession } from "../middleware/auth";

const router = Router();

router.get("/github", githubOAuthRedirect);
router.get("/github/callback", githubOAuthCallback);
router.post("/refresh", refreshToken);

// Protected auth endpoints
router.use(authenticateSession);

router.post("/logout", logout);

export default router;
