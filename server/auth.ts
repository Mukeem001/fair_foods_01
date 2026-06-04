import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export type AuthUser = {
  userId: string;
};

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  if (!decoded?.userId) throw new Error("Invalid token payload");
  return { userId: String(decoded.userId) };
}

declare module "express" {
  interface Request {
    authUser?: AuthUser;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header) {
    const [type, value] = String(header).split(" ");
    if (type === "Bearer" && value) return value;
  }

  // dev/browser setup me kabhi-kabhi token query param / cookie me aa sakta hai
  const qToken = (req.query?.token ? String(req.query.token) : "");
  if (qToken) return qToken;

  const cookieToken = (req as any)?.cookies?.token;
  if (cookieToken) return String(cookieToken);

  return null;
}


// JWT Middleware for User Protected Routes
export function protectUserRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const authUser = verifyToken(token);
    req.authUser = authUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

