#!/usr/bin/env bun

/**
 * Claude Code hook: Architecture and naming convention checks
 * Enforces layer boundaries and naming conventions
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

interface ArchitectureIssue {
  type: "layer_violation" | "naming_convention" | "missing_lib_import";
  severity: "error" | "warning";
  line?: number;
  description: string;
  suggestion?: string;
}

// Naming convention patterns
const NAMING_PATTERNS = {
  component: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase
  hook: /^use[A-Z][a-zA-Z0-9]*$/, // useSomething
  constant: /^[A-Z][A-Z0-9_]*$/, // UPPER_SNAKE_CASE
  function: /^[a-z][a-zA-Z0-9]*$/, // camelCase
  type: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase
};

function getFileLayer(filePath: string): string | null {
  if (filePath.includes("/components/")) return "components";
  if (filePath.includes("/hooks/")) return "hooks";
  if (filePath.includes("/utils/") || filePath.includes("/lib/utils/")) return "utils";
  if (filePath.includes("/services/") || filePath.includes("/lib/db/")) return "services";
  return null;
}

function isAllowedImport(fromLayer: string, importPath: string): boolean {
  const allowedPaths =
    config.architecture.layers[fromLayer as keyof typeof config.architecture.layers];
  if (!allowedPaths) return true; // No restrictions

  // Check if import matches allowed patterns
  return allowedPaths.some((allowed) => {
    if (importPath.startsWith(allowed)) return true;
    // Also allow relative imports within same layer
    if (importPath.startsWith(".")) return true;
    // Allow node_modules
    if (!importPath.startsWith("@/") && !importPath.startsWith("/")) return true;
    return false;
  });
}

async function checkLayerBoundaries(filePath: string): Promise<ArchitectureIssue[]> {
  const issues: ArchitectureIssue[] = [];
  const layer = getFileLayer(filePath);

  if (!layer || !config.architecture.enforceLayerBoundaries) {
    return issues;
  }

  try {
    const content = await Bun.file(filePath).text();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match import statements
      const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];

        if (!isAllowedImport(layer, importPath)) {
          // Detect specific violations
          let violation = "";
          let suggestion = "";

          if (layer === "utils" && importPath.includes("/components/")) {
            violation = "Utils importing from components";
            suggestion = "Move shared logic to utils, not the other way around";
          } else if (layer === "utils" && importPath.includes("/features/")) {
            violation = "Utils importing from features";
            suggestion = "Utils should be generic and feature-agnostic";
          } else if (layer === "components" && importPath.includes("/services/")) {
            violation = "Components importing directly from services";
            suggestion = "Use hooks to access services";
          } else {
            violation = `Layer boundary violation: ${layer} importing from ${importPath}`;
            suggestion = `Check architecture.layers config for allowed imports`;
          }

          issues.push({
            type: "layer_violation",
            severity: "error",
            line: i + 1,
            description: violation,
            suggestion,
          });
        }
      }
    }
  } catch (error) {
    hookLogger.error({ error, file_path: filePath }, "Failed to check layer boundaries");
  }

  return issues;
}

async function checkNamingConventions(filePath: string): Promise<ArchitectureIssue[]> {
  const issues: ArchitectureIssue[] = [];

  if (!config.architecture.enforceNamingConventions) {
    return issues;
  }

  try {
    const content = await Bun.file(filePath).text();
    const lines = content.split("\n");

    // Check if this is a React component file
    const isComponentFile =
      filePath.includes("/components/") ||
      /^[A-Z].*\.(tsx|jsx)$/.test(filePath.split("/").pop() || "");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and imports
      if (line.startsWith("//") || line.startsWith("*") || line.startsWith("import")) {
        continue;
      }

      // Check React component naming (function/const exports)
      if (isComponentFile) {
        const componentMatch = line.match(
          /(?:export\s+)?(?:const|function)\s+([a-z][a-zA-Z0-9]*)\s*(?:=|:|\()/,
        );
        if (componentMatch && !line.includes("use")) {
          const name = componentMatch[1];
          if (!NAMING_PATTERNS.component.test(name)) {
            issues.push({
              type: "naming_convention",
              severity: "warning",
              line: i + 1,
              description: `React component '${name}' should be PascalCase`,
              suggestion: `Rename to '${name.charAt(0).toUpperCase() + name.slice(1)}'`,
            });
          }
        }
      }

      // Check hook naming
      const hookMatch = line.match(/(?:export\s+)?(?:const|function)\s+(use[a-z][a-zA-Z0-9]*)/);
      if (hookMatch) {
        const hookName = hookMatch[1];
        if (!NAMING_PATTERNS.hook.test(hookName)) {
          issues.push({
            type: "naming_convention",
            severity: "error",
            line: i + 1,
            description: `React hook '${hookName}' must start with 'use' and be camelCase`,
            suggestion: "Hooks must follow the pattern: useSomething",
          });
        }
      }

      // Check if something named like a hook but isn't in a hook file
      if (line.includes("function use") || line.includes("const use")) {
        if (!filePath.includes("/hooks/") && !filePath.startsWith("use")) {
          issues.push({
            type: "naming_convention",
            severity: "warning",
            line: i + 1,
            description: "Hook-like name outside of hooks directory",
            suggestion: "Move hooks to /hooks/ directory or rename if not a hook",
          });
        }
      }

      // Check constant naming (const declarations at module level)
      const constMatch = line.match(/^export\s+const\s+([A-Z_][A-Z0-9_]*)\s*=/);
      if (constMatch) {
        const constName = constMatch[1];
        // Constants should be UPPER_SNAKE_CASE if they're truly constant (primitives, frozen objects)
        if (line.includes("=") && !line.includes("=>") && !line.includes("function")) {
          const value = line.split("=")[1]?.trim();
          // If it looks like a constant value (string, number, boolean, object literal)
          if (value && /^(['"`]|[0-9]|true|false|{|\[)/.test(value)) {
            if (!NAMING_PATTERNS.constant.test(constName) && constName.length > 1) {
              issues.push({
                type: "naming_convention",
                severity: "warning",
                line: i + 1,
                description: `Constant '${constName}' should be UPPER_SNAKE_CASE`,
                suggestion: `Consider renaming to '${constName.toUpperCase()}'`,
              });
            }
          }
        }
      }

      // Check type/interface naming
      const typeMatch = line.match(/(?:type|interface)\s+([a-z][a-zA-Z0-9]*)/);
      if (typeMatch) {
        const typeName = typeMatch[1];
        if (!NAMING_PATTERNS.type.test(typeName)) {
          issues.push({
            type: "naming_convention",
            severity: "warning",
            line: i + 1,
            description: `Type/Interface '${typeName}' should be PascalCase`,
            suggestion: `Rename to '${typeName.charAt(0).toUpperCase() + typeName.slice(1)}'`,
          });
        }
      }
    }
  } catch (error) {
    hookLogger.error({ error, file_path: filePath }, "Failed to check naming conventions");
  }

  return issues;
}

function checkProjectInfrastructure(filePath: string, content: string): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = [];

  if (!config.projectInfrastructure.enabled) {
    return issues;
  }

  // Skip allowed patterns
  const isAllowedPath = config.projectInfrastructure.allowedDuplicatePatterns.some((pattern) =>
    filePath.includes(pattern),
  );
  if (isAllowedPath) {
    return issues;
  }

  const lines = content.split("\n");

  // Patterns that suggest you should be using lib/types
  const typePatterns = [
    { regex: /interface\s+(User|Account|Transaction|Dashboard|Balance)\b/, lib: "@/lib/types" },
    { regex: /type\s+(User|Account|Transaction|Dashboard|Balance)\b/, lib: "@/lib/types" },
    { regex: /interface\s+.*Response\b/, lib: "@/lib/types (ApiResponse, PaginatedResponse)" },
    { regex: /interface\s+.*Error\b/, lib: "@/lib/types (ApiErrorResponse)" },
  ];

  // Patterns that suggest you should be using lib/utils
  const utilPatterns = [
    {
      regex: /function\s+(formatCurrency|formatDate|formatNumber)\b/,
      lib: "@/lib/utils/formatters",
    },
    { regex: /function\s+(debounce|throttle|delay)\b/, lib: "@/lib/utils/async" },
    { regex: /function\s+cn\b/, lib: "@/lib/utils/dom/cn" },
    { regex: /class\s+.*Error\s+extends\s+Error/, lib: "@/lib/utils/errors (AppError, etc.)" },
    { regex: /new\s+Map\(\).*cache/i, lib: "@/lib/cache" },
    { regex: /const\s+cache\s*=\s*\{/, lib: "@/lib/cache" },
  ];

  // Patterns that suggest you should be using Redis/KV
  const redisPatterns = [
    { regex: /\bsetTimeout.*cache/i, lib: "@/lib/cache or Redis/KV" },
    { regex: /const\s+\w+Cache\s*=\s*new\s+Map/, lib: "@/lib/cache (Redis-backed)" },
    { regex: /localStorage\.setItem.*cache/i, lib: "@/lib/cache (server-side caching)" },
  ];

  // Check if already importing from lib
  const hasLibTypesImport = content.includes('from "@/lib/types"');
  const hasLibUtilsImport = content.includes('from "@/lib/utils');
  const hasLibCacheImport = content.includes('from "@/lib/cache"');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for type reimplementation
    if (config.projectInfrastructure.enforceTypeImports && !hasLibTypesImport) {
      for (const pattern of typePatterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            type: "missing_lib_import",
            severity: "warning",
            line: i + 1,
            description: "Reimplementing types that may exist in lib/types",
            suggestion: `Check if this type exists in ${pattern.lib} before creating it`,
          });
          break; // Only report once per line
        }
      }
    }

    // Check for util reimplementation
    if (config.projectInfrastructure.enforceUtilImports && !hasLibUtilsImport) {
      for (const pattern of utilPatterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            type: "missing_lib_import",
            severity: "warning",
            line: i + 1,
            description: "Reimplementing utility that exists in lib/utils",
            suggestion: `Use ${pattern.lib} instead of reimplementing`,
          });
          break;
        }
      }
    }

    // Check for cache/Redis reimplementation
    if (
      (config.projectInfrastructure.enforceCacheUsage ||
        config.projectInfrastructure.enforceRedisUsage) &&
      !hasLibCacheImport
    ) {
      for (const pattern of redisPatterns) {
        if (pattern.regex.test(line)) {
          issues.push({
            type: "missing_lib_import",
            severity: "warning",
            line: i + 1,
            description: "Implementing caching without using project's cache infrastructure",
            suggestion: `Use ${pattern.lib} for consistent caching`,
          });
          break;
        }
      }
    }
  }

  return issues;
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

    if (!config.architecture.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running architecture checks");
    console.log(`🏗️  Running architecture checks on ${filePath}...`);

    const content = await Bun.file(filePath).text();

    // Run checks
    const layerIssues = await checkLayerBoundaries(filePath);
    const namingIssues = await checkNamingConventions(filePath);
    const infraIssues = checkProjectInfrastructure(filePath, content);
    const allIssues = [...layerIssues, ...namingIssues, ...infraIssues];

    // Categorize
    const errors = allIssues.filter((i) => i.severity === "error");
    const warnings = allIssues.filter((i) => i.severity === "warning");

    hookLogger.info(
      {
        file_path: filePath,
        layer_violations: layerIssues.length,
        naming_issues: namingIssues.length,
        infrastructure_issues: infraIssues.length,
        errors: errors.length,
        warnings: warnings.length,
      },
      "Architecture checks completed",
    );

    // Report issues
    if (errors.length > 0) {
      console.log("");
      console.log(`❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        console.log(`   Line ${issue.line || "?"}: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.log("");
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      for (const issue of warnings.slice(0, 5)) {
        console.log(`   Line ${issue.line || "?"}: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
      if (warnings.length > 5) {
        console.log(`   ... and ${warnings.length - 5} more`);
      }
    }

    if (errors.length > 0) {
      console.log("");
      console.log("❌ Architecture checks failed. Please fix the errors above.");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (allIssues.length === 0) {
      console.log("✅ No architecture issues detected");
    } else {
      console.log("✅ Architecture checks passed (warnings only)");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during architecture checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
