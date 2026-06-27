import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequest } from "../lib/errors";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Express 5: req.query/params are prototype getters. Define an own data
      // property so the validated/coerced/defaulted object is what the route sees.
      Object.defineProperty(req, source, {
        value: data,
        configurable: true,
        writable: true,
        enumerable: true,
      });
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
