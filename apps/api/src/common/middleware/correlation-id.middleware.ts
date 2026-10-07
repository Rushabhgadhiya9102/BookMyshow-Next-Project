import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerId = req.headers["x-request-id"];
    const requestId =
      (Array.isArray(headerId) ? headerId[0] : headerId) ||
      crypto.randomUUID();

    (req as any).id = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  }
}
