import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequest } from "../lib/errors";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Reassign — preserves downstream typed access via the schema.
      (req as unknown as Record<Source, unknown>)[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(BadRequest("VALIDATION", "Invalid input", err.flatten()));
      } else {
        next(err);
      }
    }
  };
}
