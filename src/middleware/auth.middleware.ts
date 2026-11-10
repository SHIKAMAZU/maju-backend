import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Data yang kita simpan di dalam token
export interface AuthUser {
  userId: number;
  username: string;
  email: string;
}

// Supaya TypeScript tahu bahwa req.user bisa dipakai
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware ini dipasang di endpoint yang wajib login
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan. Silakan login." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
}
