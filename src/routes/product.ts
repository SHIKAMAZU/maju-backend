import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/multer";
import { getProducts, createProduct } from "../controllers/product.controller";

const router = Router();

// Sesuai tugas backend, endpoint produk juga dilindungi JWT.
router.use(authenticateToken);

router.get("/", getProducts);
router.post("/", uploadSingleImage, createProduct);

export default router;
