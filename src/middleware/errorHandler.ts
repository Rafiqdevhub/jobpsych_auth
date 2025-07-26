import { Request, Response, NextFunction } from "express";

// Async handler utility for Express routes
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// You can add more error handling utilities here as needed.
