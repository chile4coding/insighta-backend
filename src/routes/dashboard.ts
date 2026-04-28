import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { requireApiVersion } from "../middleware/version";
import { requireAnalystOrAdmin } from "../middleware/rbac";

const router = Router();

// Dashboard routes require authentication and appropriate role

router.use(requireAnalystOrAdmin);
router.use(requireApiVersion);

// GET /api/dashboard/stats - Get dashboard statistics
router.get("/dashboard/stats", getDashboardStats);

export default router;
