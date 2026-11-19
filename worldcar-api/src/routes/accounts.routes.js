import { Router } from "express";
import {
  activate,
  getById,
  getList,
  register,
  remove,
  update,
} from "../controllers/accounts.controllers.js";
import { requireAdmin } from "../middleware/admin-auth.middleware.js";

const router = Router();

router.post("/register", register);
router.get("/activate", activate);
router.get("/", requireAdmin, getList);
router.get("/:id", requireAdmin, getById);
router.patch("/:id", requireAdmin, update);
router.delete("/:id", requireAdmin, remove);

export default router;
