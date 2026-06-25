import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1),

  TENANT_JWT_SECRET: z.string().min(16),
  OPERATOR_JWT_SECRET: z.string().min(16),
  TENANT_JWT_TTL: z.string().default("30d"),
  OPERATOR_JWT_TTL: z.string().default("7d"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),

  TRIAL_DAYS: z.coerce.number().int().positive().default(14),
  PRICE_PER_MONTH_LYD: z.coerce.number().positive().default(100),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
};

export type Config = typeof config;
