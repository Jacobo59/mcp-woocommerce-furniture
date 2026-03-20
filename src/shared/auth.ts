import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "./errors";

export function requireBearerToken(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("AUTH_ERROR", "Unauthorized", 401));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (token !== env.MCP_AUTH_TOKEN) {
    return next(new AppError("AUTH_ERROR", "Unauthorized", 401));
  }

  next();
}
