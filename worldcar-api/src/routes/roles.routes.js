import { Router } from "express";
import {
  create,
  getById,
  getList,
  remove,
  update,
} from "../controllers/roles.controllers.js";
import { requireAdmin } from "../middleware/admin-auth.middleware.js";

const router = Router();

router.post("/", requireAdmin, create);
router.get("/", requireAdmin, getList);
router.get("/:id", requireAdmin, getById);
router.patch("/:id", requireAdmin, update);
router.delete("/:id", requireAdmin, remove);

export default router;