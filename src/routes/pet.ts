import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  getPets,
  getPetDetail,
  createPet,
  updatePet,
  deletePet,
} from "../controllers/pet.controller";

const router = Router();

// Semua endpoint hewan wajib login.
router.use(authenticateToken);

router.get("/", getPets);
router.get("/:id", getPetDetail);
router.post("/", createPet);
router.put("/:id", updatePet);
router.delete("/:id", deletePet);

export default router;
