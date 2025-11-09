#!/usr/bin/env bun

/**
 * Claude Code hook: React/Frontend quality checks
 * Validates props, hooks, and performance patterns
 * OPTIMIZED: Better pattern detection, reduced false positives, caching
 */

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

interface ReactIssue {
  type: string;
  severity: "error" | "warning" | "info";
  line: number;
  description: string;
  suggestion?: string;
}

function isReactFile(filePath: string, content: string): boolean {
  return (
    (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) &&
    (content.includes("import React") ||
      content.includes("from 'react'") ||
      content.includes('from "react"'))
  );
}

function _isComponentFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";
  return /^[A-Z].*\.(tsx|jsx)$/.test(fileName) || filePath.includes("/components/");
}

function checkPropTypes(filePath: string, content: string): ReactIssue[] {
  const issues: ReactIssue[] = [];
  const lines = content.split("\n");

  if (!config.react.enforcePropTypes && !config.react.warnOnAnyProps) {
    return issues;
  }

  // Find component definitions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match function components with props
    const componentMatch = line.match(
      /(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*[=:]?\s*\(?([^)]*)\)?/,
    );

    if (componentMatch) {
      const componentName = componentMatch[1];
      const propsParam = componentMatch[2];

      // Only check props typing if there actually ARE props (not empty parens)
      if (propsParam && propsParam.trim().length > 0) {
        // Check if props use 'any' type
        if (config.react.warnOnAnyProps && propsParam.includes(": any")) {
          issues.push({
            type: "any_props",
            severity: "warning",
            line: i + 1,
            description: `Component '${componentName}' uses 'any' for props type`,
            suggestion: "Define a proper interface or type for component props",
          });
        }

        // Check if props are typed at all (TypeScript)
        // But skip if it's just empty parens or has no props param
        if (
          config.react.enforcePropTypes &&
          filePath.endsWith(".tsx") &&
          propsParam.includes("props") &&
          !propsParam.includes(":") &&
          !propsParam.includes("=") // Skip default params
        ) {
          issues.push({
            type: "missing_prop_types",
            severity: "warning",
            line: i + 1,
            description: `Component '${componentName}' props lack type definition`,
            suggestion: "Add a type or interface for props: function Component(props: Props)",
          });
        }

        // Check for destructured props without types - but be more conservative
        if (
          propsParam.includes("{") &&
          !propsParam.includes(":") &&
          propsParam.split(",").length > 2
        ) {
          // Only flag if there are multiple destructured props (likely needs typing)
          issues.push({
            type: "untyped_destructured_props",
            severity: "warning",
            line: i + 1,
            description: `Component '${componentName}' has untyped destructured props`,
            suggestion: "Add types: ({ prop1, prop2 }: Props)",
          });
        }
      }
    }
  }

  return issues;
}

function checkHookDependencies(_filePath: string, content: string): ReactIssue[] {
  const issues: ReactIssue[] = [];
  const lines = content.split("\n");

  if (!config.react.checkHookDependencies) {
    return issues;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match useEffect, useMemo, useCallback
    const hookMatch = line.match(/use(Effect|Memo|Callback)\s*\(/);
    if (!hookMatch) continue;

    // Find the dependency array on this or following lines
    let depArrayLine = i;
    let foundDeps = false;
    let depsContent = "";

    // Look ahead up to 10 lines for the dependency array
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      const currentLine = lines[j];
      if (currentLine.includes("], [")) {
        // Found inline deps
        const match = currentLine.match(/],\s*\[([^\]]*)\]/);
        if (match) {
          depsContent = match[1];
          depArrayLine = j;
          foundDeps = true;
          break;
        }
      } else if (currentLine.trim().match(/^\[.*\]\s*\)?[;,]?\s*$/)) {
        // Found deps on separate line
        const match = currentLine.match(/\[([^\]]*)\]/);
        if (match) {
          depsContent = match[1];
          depArrayLine = j;
          foundDeps = true;
          break;
        }
      }
    }

    if (!foundDeps) {
      // No dependency array found
      if (hookMatch[1] === "Effect") {
        issues.push({
          type: "missing_deps",
          severity: "warning",
          line: i + 1,
          description: "useEffect missing dependency array",
          suggestion: "Add dependency array to prevent infinite loops",
        });
      }
      continue;
    }

    // Check for empty deps when there might be dependencies
    const hookBody = lines.slice(i, depArrayLine).join(" ");
    if (depsContent.trim() === "") {
      // Empty dependency array - check if intentional
      const hasVariables = hookBody.match(/\b([a-z][a-zA-Z0-9]*)\b/g);
      if (hasVariables && hasVariables.length > 5) {
        issues.push({
          type: "potentially_missing_deps",
          severity: "info",
          line: depArrayLine + 1,
          description: `${hookMatch[0]} has empty deps but references variables`,
          suggestion: "Verify all dependencies are included or add eslint-disable comment",
        });
      }
    }

    // Check for object/array literals in deps (referential equality issue)
    if (depsContent.includes("{") || depsContent.includes("[")) {
      issues.push({
        type: "object_in_deps",
        severity: "warning",
        line: depArrayLine + 1,
        description: "Object or array literal in dependency array",
        suggestion:
          "Objects/arrays recreate on every render. Use useMemo or move outside component",
      });
    }
  }

  return issues;
}

function checkPerformancePatterns(_filePath: string, content: string): ReactIssue[] {
  const issues: ReactIssue[] = [];
  const lines = content.split("\n");

  if (!config.react.detectPerformanceIssues) {
    return issues;
  }

  let componentLineCount = 0;
  let inComponent = false;
  let componentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track component boundaries
    if (line.match(/(?:export\s+)?(?:function|const)\s+[A-Z]/)) {
      inComponent = true;
      componentStart = i;
      componentLineCount = 0;
    }

    if (inComponent) {
      componentLineCount++;

      // Skip inline function/style checks - too noisy and often acceptable in modern React
      // These are micro-optimizations that rarely matter in practice

      // Check if component is very long and might need memo
      if (componentLineCount > config.react.maxComponentLines) {
        if (config.react.requireMemoForExpensiveComponents) {
          // Check if component uses React.memo
          const componentContent = lines.slice(componentStart, i + 1).join("\n");
          if (!componentContent.includes("React.memo") && !componentContent.includes("memo(")) {
            issues.push({
              type: "missing_memo",
              severity: "warning",
              line: componentStart + 1,
              description: `Large component (${componentLineCount} lines) without React.memo`,
              suggestion: "Consider wrapping with React.memo to prevent unnecessary re-renders",
            });
          }
        }
      }
    }

    // Detect component end
    if (inComponent && line.trim() === "}") {
      const openBraces = lines
        .slice(componentStart, i + 1)
        .join("")
        .split("{").length;
      const closeBraces = lines
        .slice(componentStart, i + 1)
        .join("")
        .split("}").length;

      if (openBraces === closeBraces) {
        inComponent = false;
      }
    }

    // Detect .map() without keys - but check if it's actually JSX
    if (line.includes(".map(") && (line.includes("return <") || line.includes("=> <"))) {
      // Look ahead a few lines to see if there's a key prop
      const nextFewLines = lines.slice(i, Math.min(i + 3, lines.length)).join(" ");
      if (!nextFewLines.includes("key=")) {
        issues.push({
          type: "missing_key",
          severity: "error",
          line: i + 1,
          description: "Array .map() without key prop",
          suggestion: "Add unique key prop to prevent rendering issues",
        });
      }
    }

    // Skip useState object checks - too opinionated and often fine
  }

  return issues;
}

function checkComponentStructure(_filePath: string, content: string): ReactIssue[] {
  const issues: ReactIssue[] = [];
  const lines = content.split("\n");

  // Check for missing display names in exported components
  let _hasExportedComponent = false;
  let _hasDisplayName = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/export\s+(?:default\s+)?(?:function|const)\s+[A-Z]/)) {
      _hasExportedComponent = true;
    }

    if (line.includes(".displayName")) {
      _hasDisplayName = true;
    }

    // Check for multiple return statements in component (code smell)
    if (line.trim().startsWith("return") && line.includes("(")) {
      // This is simplified - in production you'd want better parsing
    }
  }

  // Note: Display names are primarily for debugging and are optional
  // We'll skip this check as it can be noisy

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

    // Only run on React files
    if (
      !filePath ||
      !shouldCheckFile(filePath, [config.patterns.typescript, config.patterns.javascript])
    ) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check eligibility
    const eligibility = getEligibleChecks(filePath);
    if (!eligibility.react) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    const content = await Bun.file(filePath).text();

    if (!isReactFile(filePath, content)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.react.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check cache
    if (config.cache.enabled) {
      const cached = await getCachedResult("react_quality", filePath);
      if (cached) {
        console.log(`✅ Cached: React checks passed`);
        process.exit(cached.passed ? EXIT_CODES.SUCCESS : EXIT_CODES.CHECK_FAILURE);
      }
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running React quality checks");
    console.log(`⚛️  React checks...`);

    // Run all checks
    const propIssues = checkPropTypes(filePath, content);
    const hookIssues = checkHookDependencies(filePath, content);
    const perfIssues = checkPerformancePatterns(filePath, content);
    const structureIssues = checkComponentStructure(filePath, content);

    const allIssues = [...propIssues, ...hookIssues, ...perfIssues, ...structureIssues];

    // Categorize
    const errors = allIssues.filter((i) => i.severity === "error");
    const warnings = allIssues.filter((i) => i.severity === "warning");
    const info = allIssues.filter((i) => i.severity === "info");

    hookLogger.info(
      {
        file_path: filePath,
        prop_issues: propIssues.length,
        hook_issues: hookIssues.length,
        perf_issues: perfIssues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      },
      "React quality checks completed",
    );

    // Report issues
    if (errors.length > 0) {
      console.log("");
      console.log(`❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.log("");
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      for (const issue of warnings.slice(0, 5)) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
      if (warnings.length > 5) {
        console.log(`   ... and ${warnings.length - 5} more`);
      }
    }

    if (info.length > 0) {
      console.log(`ℹ️  INFO: ${info.length} performance suggestions`);
    }

    // Cache result
    const finalResult = { passed: errors.length === 0, issues: allIssues };
    if (config.cache.enabled) {
      await setCachedResult("react_quality", filePath, finalResult);
    }

    if (errors.length > 0) {
      console.log("");
      console.log("❌ React checks failed");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (allIssues.length === 0) {
      console.log("✅ No React issues");
    } else {
      console.log("✅ React checks passed");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during React quality checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
