import { Router } from "express";
import { getCurrentUser } from "../controllers/userControllers";

const router = Router();

router.get("/me", getCurrentUser);

export default router;
