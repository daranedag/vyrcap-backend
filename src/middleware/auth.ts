import type { NextFunction, Request, Response } from "express";
import { resolveUserFromToken } from "../modules/auth/auth.service.js";

export type RequestUser = {
  id: string;
  email?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const authorization = req.header("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({
      ok: false,
      error: { message: "Missing bearer token" }
    });
    return;
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    res.status(401).json({
      ok: false,
      error: { message: "Invalid token" }
    });
    return;
  }

  req.user = user;
  next();
}

export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    next();
    return;
  }

  const user = await resolveUserFromToken(token);
  if (user) {
    req.user = user;
  }

  next();
}
