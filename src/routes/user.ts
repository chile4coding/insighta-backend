import { Router } from "express";
import { getCurrentUser } from "../controllers/userControllers";
import { authenticateSession } from "../middleware/auth";
import { requireAnalystOrAdmin } from "../middleware/rbac";

const router = Router();

router.use(authenticateSession);
router.use(requireAnalystOrAdmin);

router.get("/me", getCurrentUser);

export default router;
