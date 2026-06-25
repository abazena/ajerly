import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config";

export interface Storage {
  put(key: string, body: Buffer, contentType?: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

class LocalStorage implements Storage {
  constructor(private dir: string) {}
  async put(key: string, body: Buffer): Promise<string> {
    const full = path.join(this.dir, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    return `/uploads/${key}`;
  }
  async getUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }
  async delete(key: string): Promise<void> {
    const full = path.join(this.dir, key);
    await fs.rm(full, { force: true });
  }
}

class S3Storage implements Storage {
  // Stub — real S3 client wiring lands when image uploads ship.
  async put(): Promise<string> {
    throw new Error("S3Storage.put not implemented");
  }
  async getUrl(): Promise<string> {
    throw new Error("S3Storage.getUrl not implemented");
  }
  async delete(): Promise<void> {
    throw new Error("S3Storage.delete not implemented");
  }
}

export const storage: Storage =
  config.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage(config.STORAGE_LOCAL_DIR);
