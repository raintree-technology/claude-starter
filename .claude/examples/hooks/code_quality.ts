#!/usr/bin/env bun

/**
 * Claude Code hook: Code quality checks
 * Checks cyclomatic complexity, function length, code smells, etc.
 * OPTIMIZED: Better false positive detection, caching, conditional checks
 */

import { $ } from "bun";
import { withErrorHandlingSync } from "@/lib/utils/errors";
import { hookLogger } from "@/lib/utils/logger";
import { getCachedResult, getEligibleChecks, setCachedResult, shouldSkipFile } from "./cache";
import { config, EXIT_CODES, shouldCheckFile } from "./config";

// Types
interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
}

interface QualityIssue {
  type: string;
  severity: "error" | "warning" | "info";
  line?: number;
  description: string;
  value?: number;
  threshold?: number;
  suggestion?: string;
}

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  complexity: number;
  paramCount: number;
}

// Helper functions
async function analyzeFile(filePath: string): Promise<{
  functions: FunctionInfo[];
  nestingIssues: QualityIssue[];
  codeSmells: QualityIssue[];
}> {
  const content = await Bun.file(filePath).text();
  const lines = content.split("\n");

  const functions: FunctionInfo[] = [];
  const nestingIssues: QualityIssue[] = [];
  const codeSmells: QualityIssue[] = [];

  // Simple regex patterns for function detection
  const functionPatterns = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\((.*?)\)/,
    /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\((.*?)\)\s*=>/,
    /^\s*(\w+)\s*\((.*?)\)\s*\{/, // Method in class
  ];

  let currentFunction: { name: string; startLine: number; params: string[] } | null = null;
  let braceDepth = 0;
  let functionBraceStart = 0;

  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track multiline comments
    if (trimmed.includes("/*")) inComment = true;
    if (trimmed.includes("*/")) {
      inComment = false;
      continue;
    }

    // Skip comments and empty lines
    if (
      inComment ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Check for deep nesting (simplified - count opening braces)
    const indent = line.match(/^\s*/)?.[0].length || 0;
    const nestingLevel = Math.floor(indent / 2); // Assuming 2-space indents

    if (nestingLevel > config.quality.maxNestingDepth && trimmed.includes("{")) {
      nestingIssues.push({
        type: "deep_nesting",
        severity: "warning",
        line: i + 1,
        description: `Deep nesting detected (level ${nestingLevel})`,
        value: nestingLevel,
        threshold: config.quality.maxNestingDepth,
      });
    }

    // Detect function starts
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const funcName = match[1];
        const params = match[2] ? match[2].split(",").filter((p) => p.trim()) : [];

        // Check parameter count
        if (params.length > config.quality.maxParameterCount) {
          codeSmells.push({
            type: "long_parameter_list",
            severity: "warning",
            line: i + 1,
            description: `Function '${funcName}' has ${params.length} parameters (max: ${config.quality.maxParameterCount})`,
            value: params.length,
            threshold: config.quality.maxParameterCount,
          });
        }

        currentFunction = {
          name: funcName,
          startLine: i + 1,
          params,
        };
        functionBraceStart = i;
        braceDepth = 0;
      }
    }

    // Track brace depth for function bounds
    if (currentFunction) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Function ended
      if (braceDepth < 0 || (braceDepth === 0 && i > functionBraceStart)) {
        const lineCount = i - currentFunction.startLine + 1;

        // Calculate complexity (simplified - count conditionals and loops)
        let complexity = 1; // Base complexity
        for (let j = currentFunction.startLine - 1; j <= i; j++) {
          const funcLine = lines[j];
          complexity += (funcLine.match(/\bif\b/g) || []).length;
          complexity += (funcLine.match(/\belse\b/g) || []).length;
          complexity += (funcLine.match(/\bfor\b/g) || []).length;
          complexity += (funcLine.match(/\bwhile\b/g) || []).length;
          complexity += (funcLine.match(/\bcase\b/g) || []).length;
          complexity += (funcLine.match(/&&|\|\|/g) || []).length;
          complexity += (funcLine.match(/\?/g) || []).length; // Ternary
        }

        functions.push({
          name: currentFunction.name,
          startLine: currentFunction.startLine,
          endLine: i + 1,
          lineCount,
          complexity,
          paramCount: currentFunction.params.length,
        });

        currentFunction = null;
      }
    }

    // Check for other code smells
    // Skip TODO/FIXME checks - too noisy and often intentional

    // Only flag 'any' type if it's actually in a type annotation, not in comments or strings
    if (
      trimmed.includes("any") &&
      (trimmed.includes(": any") || trimmed.includes("<any>") || trimmed.includes("any[]")) &&
      !trimmed.startsWith("//") &&
      !trimmed.includes("//") // Ignore if commented out
    ) {
      codeSmells.push({
        type: "any_type",
        severity: "info",
        line: i + 1,
        description: "Use of 'any' type reduces type safety",
      });
    }
  }

  return { functions, nestingIssues, codeSmells };
}

async function checkCircularDependencies(filePath: string): Promise<boolean> {
  if (!config.quality.enableCircularDependencyCheck) {
    return true;
  }

  try {
    // Use madge to detect circular dependencies
    // First check if madge is available
    const madgeCheck = await $`which madge`.quiet().nothrow();
    if (madgeCheck.exitCode !== 0) {
      console.log("ℹ️  madge not installed - skipping circular dependency check");
      console.log("   Install with: npm install -g madge");
      return true;
    }

    const result = await $`madge --circular ${filePath}`.quiet().nothrow();
    const output = result.stdout.toString();

    if (output.includes("No circular dependency")) {
      return true;
    } else if (output.trim() !== "") {
      console.log("⚠️  Circular dependencies detected:");
      console.log(output.split("\n").slice(0, 5).join("\n"));
      return false;
    }

    return true;
  } catch {
    return true; // Don't fail on errors
  }
}

function checkUtilityReimplementation(filePath: string, content: string): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (!config.projectInfrastructure.enabled || !config.projectInfrastructure.enforceUtilImports) {
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
  const hasLibUtilsImport = content.includes('from "@/lib/utils');

  // Common utility patterns that suggest reimplementation
  const utilityPatterns = [
    {
      regex: /function\s+clsx\b|function\s+classNames\b|function\s+cn\b/,
      lib: "@/lib/utils/dom/cn",
      description: "Class name utility (cn/clsx)",
    },
    {
      regex: /function\s+formatCurrency\b/,
      lib: "@/lib/utils/formatters",
      description: "Currency formatting",
    },
    {
      regex: /function\s+formatDate\b|function\s+parseDate\b/,
      lib: "@/lib/utils/date or @/lib/utils/formatters",
      description: "Date formatting/parsing",
    },
    {
      regex: /function\s+debounce\b/,
      lib: "@/lib/utils/async",
      description: "Debounce utility",
    },
    {
      regex: /function\s+throttle\b/,
      lib: "@/lib/utils/async",
      description: "Throttle utility",
    },
    {
      regex: /function\s+sleep\b|function\s+delay\b/,
      lib: "@/lib/utils/async",
      description: "Async delay utility",
    },
    {
      regex: /function\s+chunk\b|function\s+groupBy\b|function\s+uniq\b/,
      lib: "@/lib/utils/collections",
      description: "Collection utility",
    },
    {
      regex: /function\s+copyToClipboard\b/,
      lib: "@/lib/utils/dom/clipboard",
      description: "Clipboard utility",
    },
    {
      regex: /function\s+downloadFile\b|function\s+downloadJSON\b/,
      lib: "@/lib/utils/dom/download",
      description: "Download utility",
    },
    {
      regex: /function\s+validateEmail\b|function\s+validatePassword\b/,
      lib: "@/lib/utils/validation",
      description: "Validation utility",
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of utilityPatterns) {
      if (pattern.regex.test(line)) {
        issues.push({
          type: "utility_reimplementation",
          severity: "warning",
          line: i + 1,
          description: `${pattern.description} may already exist in lib/utils`,
          suggestion: `Check ${pattern.lib} before implementing. Import with: import { ... } from "${pattern.lib}"`,
        });
      }
    }

    // Check for manual error classes
    if (
      !hasLibUtilsImport &&
      line.includes("class") &&
      line.includes("Error") &&
      line.includes("extends")
    ) {
      issues.push({
        type: "error_class_reimplementation",
        severity: "warning",
        line: i + 1,
        description: "Custom error class - project has standardized error classes",
        suggestion: "Use @/lib/utils/errors (AppError, ValidationError, etc.) for consistency",
      });
    }

    // Check for manual retry logic
    if (line.match(/for\s*\(.*retry|while.*retry|attempts.*\+\+/)) {
      issues.push({
        type: "retry_logic_reimplementation",
        severity: "info",
        line: i + 1,
        description: "Manual retry logic detected",
        suggestion: "Consider using @/lib/utils/async retry utilities if available",
      });
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

    // Skip generated/build files
    if (!filePath || shouldSkipFile(filePath)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Only run on TypeScript/JavaScript files
    if (!shouldCheckFile(filePath, [config.patterns.typescript, config.patterns.javascript])) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check eligibility
    const eligibility = getEligibleChecks(filePath);
    if (!eligibility.quality) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.quality.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check cache
    if (config.cache.enabled) {
      const cached = await getCachedResult("code_quality", filePath);
      if (cached) {
        console.log(`✅ Cached: Code quality passed`);
        process.exit(cached.passed ? EXIT_CODES.SUCCESS : EXIT_CODES.CHECK_FAILURE);
      }
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running code quality checks");
    console.log(`🎯 Code quality checks...`);

    const content = await Bun.file(filePath).text();
    const { functions, nestingIssues, codeSmells } = await analyzeFile(filePath);
    const utilIssues = checkUtilityReimplementation(filePath, content);
    const issues: QualityIssue[] = [...nestingIssues, ...codeSmells, ...utilIssues];

    // Check function metrics
    console.log(`  → Analyzed ${functions.length} functions`);

    for (const func of functions) {
      // Check function length
      if (func.lineCount > config.quality.maxFunctionLines) {
        issues.push({
          type: "long_function",
          severity: "warning",
          line: func.startLine,
          description: `Function '${func.name}' is too long (${func.lineCount} lines, max: ${config.quality.maxFunctionLines})`,
          value: func.lineCount,
          threshold: config.quality.maxFunctionLines,
        });
      }

      // Check cyclomatic complexity
      if (func.complexity > config.quality.maxCyclomaticComplexity) {
        issues.push({
          type: "high_complexity",
          severity: "warning",
          line: func.startLine,
          description: `Function '${func.name}' has high complexity (${func.complexity}, max: ${config.quality.maxCyclomaticComplexity})`,
          value: func.complexity,
          threshold: config.quality.maxCyclomaticComplexity,
        });
      }
    }

    // Check circular dependencies
    console.log("  → Checking circular dependencies...");
    const noCircular = await checkCircularDependencies(filePath);
    if (!noCircular) {
      issues.push({
        type: "circular_dependency",
        severity: "error",
        description: "Circular dependencies detected",
      });
    }

    // Report issues
    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");
    const info = issues.filter((i) => i.severity === "info");

    hookLogger.info(
      {
        file_path: filePath,
        functions_count: functions.length,
        utility_issues: utilIssues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      },
      "Code quality checks completed",
    );

    if (errors.length > 0) {
      console.log("");
      console.log(`❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        console.log(`   Line ${issue.line || "?"}: ${issue.description}`);
      }
    }

    if (warnings.length > 0) {
      console.log("");
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      for (const issue of warnings.slice(0, 5)) {
        console.log(`   Line ${issue.line || "?"}: ${issue.description}`);
      }
      if (warnings.length > 5) {
        console.log(`   ... and ${warnings.length - 5} more`);
      }
    }

    if (info.length > 0) {
      console.log(`ℹ️  INFO: ${info.length} suggestions`);
    }

    // Cache result
    const finalResult = { passed: errors.length === 0, issues };
    if (config.cache.enabled) {
      await setCachedResult("code_quality", filePath, finalResult);
    }

    if (errors.length > 0) {
      console.log("");
      console.log("❌ Code quality failed");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (issues.length === 0) {
      console.log("✅ No quality issues");
    } else {
      console.log("✅ Code quality passed");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during code quality checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
