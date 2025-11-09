#!/usr/bin/env bun

/**
 * Claude Code hook: Run type/lint/format checks after file edits
 * This hook runs after Edit or Write tool calls to ensure code quality
 * OPTIMIZED: Caching, conditional checks, parallel execution
 */

import { $ } from "bun";
import { withErrorHandlingSync } from "@/lib/utils/errors";
import { hookLogger } from "@/lib/utils/logger";
import { getCachedResult, getEligibleChecks, setCachedResult, shouldSkipFile } from "./cache";
import { config, EXIT_CODES, getFileExtension, shouldCheckFile } from "./config";

// Types
interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
}

interface CheckResult {
  name: string;
  passed: boolean;
  duration: number;
  output?: string;
  severity?: "error" | "warning" | "info";
}

interface MeasureResult<T> {
  result: T;
  duration: number;
}

/**
 * Wrapper around measureAsync that returns both result and duration
 */
async function measureWithDuration<T>(
  log: typeof hookLogger,
  label: string,
  fn: () => Promise<T>,
): Promise<MeasureResult<T>> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    log.debug({ label, durationMs: duration }, `${label} completed`);
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    log.error({ label, durationMs: duration, err: error }, `${label} failed`);
    throw error; // Proper error propagation
  }
}

// Main execution
async function main() {
  try {
    const stdinText = await Bun.stdin.text();
    const input = withErrorHandlingSync<HookInput>(
      () => JSON.parse(stdinText),
      "Failed to parse hook input",
      { rethrow: true },
    );

    if (!input) {
      process.exit(EXIT_CODES.CONFIG_ERROR);
    }

    const { tool_name, tool_input } = input;
    const filePath = tool_input.file_path;

    // Skip generated/build files entirely
    if (!filePath || shouldSkipFile(filePath)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Only run checks on configured file types
    if (!shouldCheckFile(filePath, config.patterns.allCode)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check cache if enabled
    if (config.cache.enabled) {
      const cached = await getCachedResult("check_after_edit", filePath);
      if (cached) {
        console.log(`✅ Cached: All checks passed (${filePath})`);
        process.exit(cached.passed ? EXIT_CODES.SUCCESS : EXIT_CODES.CHECK_FAILURE);
      }
    }

    const fileExt = getFileExtension(filePath);
    const isTypeScriptFile = ["ts", "tsx"].includes(fileExt);
    const eligibility = getEligibleChecks(filePath);

    hookLogger.info(
      { tool_name, file_path: filePath, file_type: fileExt, eligible: eligibility },
      "Running post-edit checks",
    );
    console.log(`🔍 Checking ${filePath}...`);

    // Check file length before running other checks
    if (config.quality.enabled) {
      try {
        const fileContent = await Bun.file(filePath).text();
        const lineCount = fileContent.split("\n").length;

        if (lineCount > config.quality.maxFileLines) {
          console.log("");
          console.log(`❌ File exceeds ${config.quality.maxFileLines} lines (${lineCount} lines)`);
          console.log("   Please break this file into smaller modules.");
          console.log("");
          hookLogger.error(
            {
              file_path: filePath,
              line_count: lineCount,
              max_lines: config.quality.maxFileLines,
            },
            "File exceeds maximum line count",
          );
          process.exit(EXIT_CODES.CHECK_FAILURE);
        }

        console.log(`✅ File length OK (${lineCount} lines)`);
      } catch (error) {
        console.log(`⚠️  Could not check file length: ${error}`);
      }
    }

    const checks: CheckResult[] = [];
    const checkPromises: Promise<MeasureResult<CheckResult>>[] = [];

    // Build array of checks to run in parallel
    // Only run TypeScript check if file is TS and eligible
    if (config.typecheck.enabled && isTypeScriptFile && eligibility.typescript) {
      checkPromises.push(
        measureWithDuration(hookLogger, "TypeScript check", async () => {
          console.log("  → TypeScript...");
          try {
            const result = await $`bun run typecheck`.quiet();
            const output = result.stdout.toString();
            const lines = output.split("\n").slice(-config.output.maxOutputLines).join("\n");

            console.log("✅ TypeScript");
            return {
              name: "TypeScript",
              passed: true,
              duration: 0,
              output: lines,
              severity: "error" as const,
            };
          } catch (error: any) {
            const output = error.stderr?.toString() || error.stdout?.toString() || "";
            const lines = output.split("\n").slice(-config.output.maxOutputLines).join("\n");

            console.log("❌ TypeScript errors");
            console.log(lines);

            return {
              name: "TypeScript",
              passed: false,
              duration: 0,
              output: lines,
              severity: "error" as const,
            };
          }
        }),
      );
    }

    if (config.lint.enabled) {
      checkPromises.push(
        measureWithDuration(hookLogger, "Biome lint", async () => {
          console.log("  → Biome lint...");
          try {
            // Run on file scope for faster checks
            const lintCommand =
              config.lint.scope === "file"
                ? `bunx biome lint ${filePath}`
                : `bun run biome lint --reporter=summary`;
            const result = await $`${lintCommand}`.quiet();
            const output = result.stdout.toString();
            const lines = output.split("\n").slice(-3).join("\n");

            console.log("✅ Lint");
            return {
              name: "Lint",
              passed: true,
              duration: 0,
              output: lines,
              severity: config.lint.failOnWarning ? ("error" as const) : ("warning" as const),
            };
          } catch (error: any) {
            const output = error.stderr?.toString() || error.stdout?.toString() || "";
            const lines = output.split("\n").slice(-3).join("\n");

            console.log("❌ Lint issues");
            console.log(lines);

            return {
              name: "Lint",
              passed: false,
              duration: 0,
              output: lines,
              severity: config.lint.failOnWarning ? ("error" as const) : ("warning" as const),
            };
          }
        }),
      );
    }

    if (config.format.enabled) {
      checkPromises.push(
        measureWithDuration(hookLogger, "Biome format", async () => {
          console.log("  → Biome format...");
          try {
            await $`bunx biome check ${filePath}`.quiet();
            console.log("✅ Format");

            return {
              name: "Format",
              passed: true,
              duration: 0,
              severity: "info" as const,
            };
          } catch {
            if (config.format.autoFix) {
              // Auto-fix format issues
              console.log("  → Fixing format...");
              try {
                await $`bunx biome check --write ${filePath}`.quiet();
                console.log("✅ Format fixed");

                return {
                  name: "Format",
                  passed: true,
                  duration: 0,
                  output: "Auto-fixed formatting",
                  severity: "info" as const,
                };
              } catch (error: any) {
                console.log("❌ Format failed");

                return {
                  name: "Format",
                  passed: false,
                  duration: 0,
                  output: error.stderr?.toString() || "Unknown format error",
                  severity: "error" as const,
                };
              }
            } else {
              return {
                name: "Format",
                passed: false,
                duration: 0,
                output: "Format check failed (auto-fix disabled)",
                severity: "error" as const,
              };
            }
          }
        }),
      );
    }

    // Run all checks in parallel
    const results = config.parallel.enabled
      ? await Promise.all(checkPromises)
      : await Promise.all(checkPromises.map((p) => p)); // Fallback to sequential if needed

    // Extract results and durations
    for (const { result, duration } of results) {
      result.duration = duration;
      checks.push(result);
    }

    // Determine if there are failures based on severity
    const hasErrors = checks.some((c) => !c.passed && c.severity === "error");
    const hasWarnings = checks.some((c) => !c.passed && c.severity === "warning");

    // Log summary
    const totalDuration = checks.reduce((sum, c) => sum + c.duration, 0);
    hookLogger.info(
      {
        file_path: filePath,
        checks: checks.map((c) => ({
          name: c.name,
          passed: c.passed,
          severity: c.severity,
          duration: c.duration,
        })),
        total_duration: totalDuration,
        has_errors: hasErrors,
        has_warnings: hasWarnings,
      },
      "Checks completed",
    );

    if (config.output.showDuration) {
      console.log(`⏱️  Total check time: ${totalDuration.toFixed(2)}ms`);
    }

    // Cache result if enabled
    const finalResult = { passed: !hasErrors, issues: checks, output: "" };
    if (config.cache.enabled) {
      await setCachedResult("check_after_edit", filePath, finalResult);
    }

    if (hasErrors) {
      console.log("");
      console.log("❌ Some checks failed");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (hasWarnings) {
      console.log("⚠️  Warnings (non-blocking)");
    }

    console.log("✅ All checks passed");
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
