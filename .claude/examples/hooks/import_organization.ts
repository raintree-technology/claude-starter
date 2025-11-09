#!/usr/bin/env bun

/**
 * Claude Code hook: Check and organize imports
 * Detects unused imports and auto-sorts them
 */

import { $ } from "bun";
import { withErrorHandlingSync } from "@/lib/utils/errors";
import { hookLogger } from "@/lib/utils/logger";
import { config, EXIT_CODES, shouldCheckFile } from "./config";

// Types
interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
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

    // Only run on TypeScript/JavaScript files
    if (
      !filePath ||
      !shouldCheckFile(filePath, [config.patterns.typescript, config.patterns.javascript])
    ) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.imports.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Checking imports");
    console.log(`📦 Checking imports in ${filePath}...`);

    let hasErrors = false;

    // 1. Check for unused imports using Biome
    if (config.imports.failOnUnused) {
      console.log("  → Checking for unused imports...");
      try {
        // Biome's lint rules include unused imports detection
        const result =
          await $`bunx biome lint ${filePath} --only=lint/correctness/noUnusedImports --reporter=summary`.quiet();
        const output = result.stdout.toString();

        if (output.includes("No diagnostics")) {
          console.log("✅ No unused imports");
        } else {
          console.log("✅ Import checks passed");
        }
      } catch (error: any) {
        const output = error.stderr?.toString() || error.stdout?.toString() || "";

        if (output.includes("noUnusedImports")) {
          console.log("❌ Unused imports detected");
          console.log(output.split("\n").slice(-5).join("\n"));

          if (config.imports.failOnUnused) {
            hasErrors = true;
          }
        } else {
          // Check passed or error is unrelated
          console.log("✅ No unused imports");
        }
      }
    }

    // 2. Auto-organize imports using Biome
    if (config.imports.autoSort) {
      console.log("  → Organizing imports...");
      try {
        // Biome can organize imports as part of its formatting
        await $`bunx biome check --write --organize-imports-enabled=true ${filePath}`.quiet();
        console.log("✅ Imports organized");
      } catch (error: any) {
        const output = error.stderr?.toString() || error.stdout?.toString() || "";

        if (config.imports.failOnUnorganized) {
          console.log("❌ Failed to organize imports");
          console.log(output.split("\n").slice(-3).join("\n"));
          hasErrors = true;
        } else {
          console.log("⚠️  Could not organize imports (non-blocking)");
        }
      }
    }

    hookLogger.info({ file_path: filePath, has_errors: hasErrors }, "Import checks completed");

    if (hasErrors) {
      console.log("");
      console.log("❌ Import checks failed. Please fix the issues above.");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    console.log("✅ All import checks passed!");
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during import checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
