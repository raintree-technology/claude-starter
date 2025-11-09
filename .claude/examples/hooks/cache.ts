/**
 * Simple file-based caching for hook results
 * Caches check results by file hash to avoid redundant checks
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hookLogger } from "@/lib/utils/logger";

const CACHE_DIR = join(process.cwd(), ".claude/hooks/.cache");
const CACHE_VERSION = "1"; // Increment when check logic changes

interface CacheEntry {
  version: string;
  fileHash: string;
  timestamp: number;
  result: {
    passed: boolean;
    issues?: unknown[];
    output?: string;
  };
}

/**
 * Get file content hash using Bun's built-in Hasher
 */
async function getFileHash(filePath: string): Promise<string> {
  try {
    const file = Bun.file(filePath);
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(await file.text());
    return hasher.digest("hex");
  } catch {
    return "";
  }
}

/**
 * Get cache file path for a check
 */
function getCachePath(hookName: string, filePath: string): string {
  const sanitized = filePath.replace(/[^a-zA-Z0-9]/g, "_");
  return join(CACHE_DIR, `${hookName}_${sanitized}.json`);
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cached result for a file
 * Returns null if cache miss or invalid
 */
export async function getCachedResult(
  hookName: string,
  filePath: string,
): Promise<CacheEntry["result"] | null> {
  try {
    const cachePath = getCachePath(hookName, filePath);

    if (!existsSync(cachePath)) {
      return null;
    }

    const cacheContent = await readFile(cachePath, "utf-8");
    const entry: CacheEntry = JSON.parse(cacheContent);

    // Check version
    if (entry.version !== CACHE_VERSION) {
      hookLogger.debug({ hookName, filePath }, "Cache version mismatch");
      return null;
    }

    // Check if file changed
    const currentHash = await getFileHash(filePath);
    if (currentHash !== entry.fileHash) {
      hookLogger.debug({ hookName, filePath }, "File hash changed");
      return null;
    }

    // Check if cache is too old (1 hour)
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - entry.timestamp > maxAge) {
      hookLogger.debug({ hookName, filePath }, "Cache expired");
      return null;
    }

    hookLogger.debug({ hookName, filePath }, "Cache hit");
    return entry.result;
  } catch (error) {
    hookLogger.error({ error, hookName, filePath }, "Failed to read cache");
    return null;
  }
}

/**
 * Save result to cache
 */
export async function setCachedResult(
  hookName: string,
  filePath: string,
  result: CacheEntry["result"],
): Promise<void> {
  try {
    await ensureCacheDir();

    const fileHash = await getFileHash(filePath);
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      fileHash,
      timestamp: Date.now(),
      result,
    };

    const cachePath = getCachePath(hookName, filePath);
    await writeFile(cachePath, JSON.stringify(entry, null, 2));

    hookLogger.debug({ hookName, filePath }, "Result cached");
  } catch (error) {
    // Cache write failures are non-fatal
    hookLogger.warn({ error, hookName, filePath }, "Failed to write cache");
  }
}

/**
 * Clear all cached results
 */
export async function clearCache(): Promise<void> {
  try {
    if (existsSync(CACHE_DIR)) {
      const { rmdir } = await import("node:fs/promises");
      await rmdir(CACHE_DIR, { recursive: true });
      hookLogger.info("Cache cleared");
    }
  } catch (error) {
    hookLogger.error({ error }, "Failed to clear cache");
  }
}

/**
 * Check if file should skip all checks (generated files, etc.)
 */
export function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    "/node_modules/",
    "/.next/",
    "/dist/",
    "/build/",
    "/.velite/",
    ".generated.",
    ".min.",
    ".bundle.",
  ];

  return skipPatterns.some((pattern) => filePath.includes(pattern));
}

/**
 * Get conditional check eligibility based on file path and type
 */
export function getEligibleChecks(filePath: string): {
  typescript: boolean;
  react: boolean;
  accessibility: boolean;
  architecture: boolean;
  quality: boolean;
  security: boolean;
} {
  const ext = filePath.split(".").pop() || "";
  const isTS = ["ts", "tsx"].includes(ext);
  const isJS = ["js", "jsx", "ts", "tsx"].includes(ext);
  const isReact = ["tsx", "jsx"].includes(ext);
  const isComponent =
    filePath.includes("/components/") || /^[A-Z]/.test(filePath.split("/").pop() || "");
  const isTest =
    filePath.includes("__tests__") || filePath.includes(".test.") || filePath.includes(".spec.");
  const isConfig = filePath.includes("config") || filePath.endsWith(".config.ts");

  return {
    typescript: isTS && !isTest && !isConfig,
    react: isReact,
    accessibility: isReact && isComponent,
    architecture: isJS && !isTest && !isConfig,
    quality: isJS && !isTest,
    security: isJS && !isTest,
  };
}
