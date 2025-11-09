#!/usr/bin/env bun

/**
 * Claude Code hook: Check bundle size impact
 * Warns or fails if file size exceeds thresholds
 */

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

interface FileSizeInfo {
  sizeKb: number;
  lines: number;
  isComponent: boolean;
  isLarge: boolean;
  exceedsThreshold: boolean;
}

// Helper functions
function getFileSizeKb(filePath: string): number {
  try {
    const file = Bun.file(filePath);
    return file.size / 1024;
  } catch {
    return 0;
  }
}

function isComponentFile(filePath: string): boolean {
  // Check if file is in components directory or has component-like name
  return (
    filePath.includes("/components/") ||
    filePath.includes("/ui/") ||
    /^[A-Z].*\.(tsx|jsx)$/.test(filePath.split("/").pop() || "")
  );
}

function getFileLines(filePath: string): number {
  try {
    const content = Bun.file(filePath).text();
    return content.then((text) => text.split("\n").length);
  } catch {
    return 0;
  }
}

async function analyzeFileSize(filePath: string): Promise<FileSizeInfo> {
  const sizeKb = getFileSizeKb(filePath);
  const lines = await getFileLines(filePath);
  const isComponent = isComponentFile(filePath);

  const threshold = isComponent
    ? config.bundleSize.maxComponentSizeKb
    : config.bundleSize.maxFileSizeKb;

  const warnThreshold = config.bundleSize.warnThresholdKb;

  return {
    sizeKb,
    lines,
    isComponent,
    isLarge: sizeKb > warnThreshold,
    exceedsThreshold: sizeKb > threshold,
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

    // Only run on code files
    if (!filePath || !shouldCheckFile(filePath, config.patterns.allCode)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.bundleSize.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Checking bundle size");
    console.log(`📊 Checking file size for ${filePath}...`);

    const info = await analyzeFileSize(filePath);

    hookLogger.info(
      {
        file_path: filePath,
        size_kb: info.sizeKb,
        lines: info.lines,
        is_component: info.isComponent,
        is_large: info.isLarge,
        exceeds_threshold: info.exceedsThreshold,
      },
      "File size analyzed",
    );

    // Report size
    console.log(`  → File size: ${info.sizeKb.toFixed(2)} KB (${info.lines} lines)`);

    if (info.isComponent) {
      console.log(`  → Component file (max: ${config.bundleSize.maxComponentSizeKb} KB)`);
    } else {
      console.log(`  → Code file (max: ${config.bundleSize.maxFileSizeKb} KB)`);
    }

    // Check thresholds
    if (info.exceedsThreshold) {
      const threshold = info.isComponent
        ? config.bundleSize.maxComponentSizeKb
        : config.bundleSize.maxFileSizeKb;

      console.log("");
      console.log(
        `❌ File exceeds size threshold (${info.sizeKb.toFixed(2)} KB > ${threshold} KB)`,
      );
      console.log("   Consider:");
      console.log("   • Breaking into smaller modules");
      console.log("   • Lazy loading components");
      console.log("   • Moving large data structures to separate files");
      console.log("   • Code splitting");
      console.log("");

      if (config.bundleSize.failOnExceed) {
        hookLogger.error(
          {
            file_path: filePath,
            size_kb: info.sizeKb,
            threshold_kb: threshold,
          },
          "File exceeds size threshold",
        );
        process.exit(EXIT_CODES.CHECK_FAILURE);
      }
    } else if (info.isLarge) {
      console.log(
        `⚠️  File is getting large (${info.sizeKb.toFixed(2)} KB) - consider breaking it down`,
      );
    } else {
      console.log("✅ File size is acceptable");
    }

    console.log("✅ Bundle size check passed!");
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during bundle size check");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
