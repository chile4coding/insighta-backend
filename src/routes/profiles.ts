import { Router } from "express";
import {
  createProfile,
  getProfileById,
  getProfiles,
  deleteProfile,
  searchProfiles,
  exportProfiles,
} from "../controllers/profileController";
import { requireApiVersion } from "../middleware/version";
import { requireAdmin, requireAnalystOrAdmin } from "../middleware/rbac";
import { authenticateSession } from "../middleware/auth";

const router = Router();

router.use(requireAnalystOrAdmin);

// All profile routes require API version header (except in middleware chain after auth)
router.use(requireApiVersion);

router.post("/profiles", requireAdmin, createProfile);
router.get("/profiles", getProfiles);
router.get("/profiles/search", searchProfiles);
router.get("/profiles/export", exportProfiles); // Must come BEFORE /profiles/:id
router.get("/profiles/:id", getProfileById);
router.delete("/profiles/:id", requireAdmin, deleteProfile);

export default router;
