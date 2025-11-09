#!/usr/bin/env bun

/**
 * Claude Code hook: Advanced static analysis
 * Detects memory leaks, race conditions, and type safety issues
 * OPTIMIZED: Smarter pattern detection, reduced false positives, caching
 */

import { withErrorHandlingSync } from "@/lib/utils/errors";
import { hookLogger } from "@/lib/utils/logger";
import { getCachedResult, setCachedResult, shouldSkipFile } from "./cache";
import { config, EXIT_CODES, shouldCheckFile } from "./config";

// Types
interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
}

interface AdvancedIssue {
  type: string;
  severity: "error" | "warning" | "info";
  line: number;
  description: string;
  suggestion?: string;
  category: "memory" | "async" | "type_safety";
}

function detectMemoryLeaks(_filePath: string, content: string): AdvancedIssue[] {
  const issues: AdvancedIssue[] = [];
  const lines = content.split("\n");

  if (!config.advanced.detectMemoryLeaks) {
    return issues;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    // Check for event listeners without cleanup
    if (trimmed.includes("addEventListener")) {
      // Check if we're in a useEffect
      let inUseEffect = false;
      let hasCleanup = false;

      // Look backwards to see if we're in useEffect
      for (let j = Math.max(0, i - 20); j < i; j++) {
        if (lines[j].includes("useEffect")) {
          inUseEffect = true;
          break;
        }
      }

      // Look forwards to see if there's cleanup
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        if (
          lines[j].includes("removeEventListener") ||
          lines[j].includes("return () =>") ||
          lines[j].includes("return function")
        ) {
          hasCleanup = true;
          break;
        }
        if (lines[j].trim() === "};") break; // End of effect
      }

      if (inUseEffect && !hasCleanup) {
        issues.push({
          type: "missing_event_cleanup",
          severity: "error",
          line: i + 1,
          description: "addEventListener in useEffect without cleanup",
          suggestion: "Return cleanup function: return () => element.removeEventListener(...)",
          category: "memory",
        });
      }
    }

    // Check for intervals/timers without cleanup
    if (
      trimmed.includes("setInterval") ||
      trimmed.includes("setTimeout") ||
      trimmed.includes("requestAnimationFrame")
    ) {
      // Check if interval ID is stored
      const hasVarDeclaration =
        trimmed.includes("const ") || trimmed.includes("let ") || trimmed.includes("var ");

      if (!hasVarDeclaration && !trimmed.includes("return")) {
        issues.push({
          type: "untracked_timer",
          severity: "warning",
          line: i + 1,
          description: "Timer/interval created without storing ID for cleanup",
          suggestion:
            "Store ID and clear in cleanup: const id = setInterval(...); return () => clearInterval(id)",
          category: "memory",
        });
      }
    }

    // Check for subscriptions without unsubscribe
    if (trimmed.includes(".subscribe(") || trimmed.includes(".on(")) {
      let hasUnsubscribe = false;

      // Look forward for unsubscribe/off
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        if (lines[j].includes(".unsubscribe()") || lines[j].includes(".off(")) {
          hasUnsubscribe = true;
          break;
        }
      }

      if (!hasUnsubscribe) {
        issues.push({
          type: "missing_unsubscribe",
          severity: "warning",
          line: i + 1,
          description: "Subscription without unsubscribe in cleanup",
          suggestion: "Store subscription and unsubscribe in cleanup function",
          category: "memory",
        });
      }
    }

    // Check for DOM refs that might leak
    if (trimmed.includes("document.querySelector") || trimmed.includes("document.getElementById")) {
      // If in a useEffect, should cleanup references
      issues.push({
        type: "potential_dom_leak",
        severity: "info",
        line: i + 1,
        description: "Direct DOM query - ensure refs are cleaned up",
        suggestion: "Use React refs or clear DOM references in cleanup",
        category: "memory",
      });
    }

    // Check for closures capturing large objects
    if (trimmed.match(/=>\s*\{/) && line.length > 100) {
      issues.push({
        type: "large_closure",
        severity: "info",
        line: i + 1,
        description: "Large inline function may capture unnecessary variables",
        suggestion: "Extract to named function or use useCallback",
        category: "memory",
      });
    }
  }

  return issues;
}

function detectRaceConditions(_filePath: string, content: string): AdvancedIssue[] {
  const issues: AdvancedIssue[] = [];
  const lines = content.split("\n");

  if (!config.advanced.detectRaceConditions) {
    return issues;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    // Skip Promise.all mutation check - too noisy and hard to detect accurately

    // Check for missing Promise.allSettled when you need all results
    if (trimmed.includes("Promise.all") && trimmed.includes(".catch")) {
      issues.push({
        type: "promise_all_error_handling",
        severity: "warning",
        line: i + 1,
        description: "Promise.all fails on first rejection",
        suggestion: "Consider Promise.allSettled to handle all results even with failures",
        category: "async",
      });
    }

    // Skip missing await check - too many false positives with intentional fire-and-forget calls

    // Check for state updates after async operations without cleanup check
    if (trimmed.includes("await") && (trimmed.includes("set") || trimmed.includes("setState"))) {
      // Check if there's an isMounted or similar check
      let hasCleanupCheck = false;

      for (let j = Math.max(0, i - 5); j <= Math.min(i + 2, lines.length - 1); j++) {
        if (
          lines[j].includes("isMounted") ||
          lines[j].includes("isActive") ||
          lines[j].includes("aborted")
        ) {
          hasCleanupCheck = true;
          break;
        }
      }

      if (!hasCleanupCheck) {
        issues.push({
          type: "state_update_after_unmount",
          severity: "warning",
          line: i + 1,
          description: "State update after async operation without cleanup check",
          suggestion: "Use cleanup flag: let isMounted = true; ... if (isMounted) setState(...)",
          category: "async",
        });
      }
    }

    // Skip sequential awaits check - often intentional for error handling or dependencies
  }

  return issues;
}

function validateTypeNarrowing(filePath: string, content: string): AdvancedIssue[] {
  const issues: AdvancedIssue[] = [];
  const lines = content.split("\n");

  if (
    !config.advanced.validateTypeNarrowing ||
    (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx"))
  ) {
    return issues;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    // Check for unsafe type assertions
    if (trimmed.includes(" as ") && !trimmed.includes(" as const")) {
      // Type assertions can be unsafe
      issues.push({
        type: "type_assertion",
        severity: "warning",
        line: i + 1,
        description: "Type assertion (as) bypasses type checking",
        suggestion: "Use type guards or validate at runtime instead",
        category: "type_safety",
      });
    }

    // Check for non-null assertions
    if (trimmed.includes("!.") || trimmed.match(/\w!\s*[;)\],]/)) {
      issues.push({
        type: "non_null_assertion",
        severity: "warning",
        line: i + 1,
        description: "Non-null assertion (!) can cause runtime errors",
        suggestion: "Use optional chaining (?.) or explicit null check instead",
        category: "type_safety",
      });
    }

    // Check for missing type guards before narrowing
    if (trimmed.includes("typeof") && !trimmed.includes("===") && !trimmed.includes("!==")) {
      issues.push({
        type: "incomplete_type_guard",
        severity: "info",
        line: i + 1,
        description: "typeof check without strict equality",
        suggestion: "Use === or !== for type guards: if (typeof x === 'string')",
        category: "type_safety",
      });
    }

    // Check for array access without bounds checking
    if (trimmed.match(/\[[0-9]+\]/) && !trimmed.includes("?.")) {
      // Look back to see if there's a length check
      let hasLengthCheck = false;
      for (let j = Math.max(0, i - 3); j < i; j++) {
        if (lines[j].includes(".length")) {
          hasLengthCheck = true;
          break;
        }
      }

      if (!hasLengthCheck) {
        issues.push({
          type: "unsafe_array_access",
          severity: "info",
          line: i + 1,
          description: "Array access without length check",
          suggestion: "Check array length or use optional chaining: array[0]",
          category: "type_safety",
        });
      }
    }

    // Check for JSON.parse without try-catch
    if (trimmed.includes("JSON.parse(")) {
      let hasTryCatch = false;

      // Look back for try statement
      for (let j = Math.max(0, i - 5); j < i; j++) {
        if (lines[j].trim().startsWith("try")) {
          hasTryCatch = true;
          break;
        }
      }

      if (!hasTryCatch) {
        issues.push({
          type: "unsafe_json_parse",
          severity: "warning",
          line: i + 1,
          description: "JSON.parse without try-catch can throw",
          suggestion: "Wrap in try-catch or use safe parsing utility",
          category: "type_safety",
        });
      }
    }

    // Skip deep property access check - too noisy, often data is guaranteed to exist

    // Check for parseInt/parseFloat without radix or validation
    if (trimmed.includes("parseInt(") && !trimmed.includes(", 10")) {
      issues.push({
        type: "parse_int_no_radix",
        severity: "warning",
        line: i + 1,
        description: "parseInt without radix can produce unexpected results",
        suggestion: "Always specify radix: parseInt(value, 10)",
        category: "type_safety",
      });
    }
  }

  return issues;
}

function checkCacheRedisUsage(filePath: string, content: string): AdvancedIssue[] {
  const issues: AdvancedIssue[] = [];

  if (
    !config.projectInfrastructure.enabled ||
    (!config.projectInfrastructure.enforceCacheUsage &&
      !config.projectInfrastructure.enforceRedisUsage)
  ) {
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
  const hasLibCacheImport = content.includes('from "@/lib/cache"');
  const hasKvImport = content.includes('from "@/lib/utils/kv"');

  // Patterns that indicate manual caching (should use lib/cache)
  const cachingPatterns = [
    {
      pattern: /const\s+\w+Cache\s*=\s*new\s+Map\(/,
      description: "In-memory Map cache",
      suggestion: "Use @/lib/cache (Redis-backed) for persistent, distributed caching",
    },
    {
      pattern: /const\s+cache\s*=\s*\{/,
      description: "Object-based cache",
      suggestion: "Use @/lib/cache for consistent caching with TTL and invalidation",
    },
    {
      pattern: /localStorage\.setItem.*cache|localStorage\.getItem.*cache/i,
      description: "localStorage for server-side caching",
      suggestion: "Use @/lib/cache (Redis) for server-side caching, localStorage is client-only",
    },
    {
      pattern: /\bsetTimeout.*clear.*cache|setInterval.*cache/i,
      description: "Manual cache expiration with setTimeout",
      suggestion: "Use @/lib/cache with TTL (ex: cacheSet(key, data, { ex: 300 }))",
    },
  ];

  // Patterns that suggest state management needs Redis
  const redisPatterns = [
    {
      pattern: /\bqueue\s*=\s*\[|\bqueue\.push\(/i,
      description: "In-memory queue",
      suggestion: "For distributed systems, use Redis lists or @/lib/cache for queues",
    },
    {
      pattern: /rateLimitMap|rateLimit\s*=\s*new\s+Map/i,
      description: "In-memory rate limiting",
      suggestion: "Use @/lib/utils/rate-limiter (Redis-backed) for distributed rate limiting",
    },
    {
      pattern: /sessionStore|sessions\s*=\s*\{/i,
      description: "In-memory session storage",
      suggestion: "Use Redis/KV for session storage in production (see @/lib/utils/kv)",
    },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for manual caching
    if (!hasLibCacheImport) {
      for (const { pattern, description, suggestion } of cachingPatterns) {
        if (pattern.test(line)) {
          issues.push({
            type: "manual_caching",
            severity: "warning",
            line: i + 1,
            description: `${description} - project has centralized caching`,
            suggestion,
            category: "memory",
          });
        }
      }
    }

    // Check for state that needs Redis
    if (!hasKvImport && !hasLibCacheImport) {
      for (const { pattern, description, suggestion } of redisPatterns) {
        if (pattern.test(line)) {
          issues.push({
            type: "needs_redis",
            severity: "info",
            line: i + 1,
            description: `${description} may not work in distributed/serverless environments`,
            suggestion,
            category: "memory",
          });
        }
      }
    }

    // Check for hardcoded cache keys (should use buildCacheKey)
    if (hasLibCacheImport && line.match(/(get|set|del)\s*\(\s*['"`]cache:/)) {
      issues.push({
        type: "hardcoded_cache_key",
        severity: "info",
        line: i + 1,
        description: "Hardcoded cache key string",
        suggestion:
          "Use buildCacheKey({ userId, resource, identifiers }) for consistent key formatting",
        category: "type_safety",
      });
    }

    // Check for missing TTL on cache set
    if (
      hasLibCacheImport &&
      line.includes("cacheSet(") &&
      !line.includes("ex:") &&
      !line.includes("CACHE_TTL")
    ) {
      issues.push({
        type: "missing_cache_ttl",
        severity: "warning",
        line: i + 1,
        description: "cacheSet without explicit TTL",
        suggestion:
          "Always specify TTL: cacheSet(key, data, { ex: CACHE_TTL.SHORT }) to prevent unbounded growth",
        category: "memory",
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
    if (
      !filePath ||
      !shouldCheckFile(filePath, [config.patterns.typescript, config.patterns.javascript])
    ) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.advanced.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Check cache
    if (config.cache.enabled) {
      const cached = await getCachedResult("advanced_analysis", filePath);
      if (cached) {
        console.log(`✅ Cached: Advanced analysis passed`);
        process.exit(cached.passed ? EXIT_CODES.SUCCESS : EXIT_CODES.CHECK_FAILURE);
      }
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running advanced analysis");
    console.log(`🔬 Advanced analysis...`);

    const content = await Bun.file(filePath).text();

    // Run all analyses
    const memoryIssues = detectMemoryLeaks(filePath, content);
    const asyncIssues = detectRaceConditions(filePath, content);
    const typeIssues = validateTypeNarrowing(filePath, content);
    const cacheIssues = checkCacheRedisUsage(filePath, content);

    const allIssues = [...memoryIssues, ...asyncIssues, ...typeIssues, ...cacheIssues];

    // Categorize
    const errors = allIssues.filter((i) => i.severity === "error");
    const warnings = allIssues.filter((i) => i.severity === "warning");
    const info = allIssues.filter((i) => i.severity === "info");

    hookLogger.info(
      {
        file_path: filePath,
        memory_issues: memoryIssues.length,
        async_issues: asyncIssues.length,
        type_issues: typeIssues.length,
        cache_issues: cacheIssues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      },
      "Advanced analysis completed",
    );

    // Report by category
    if (errors.length > 0) {
      console.log("");
      console.log(`❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        console.log(`   Line ${issue.line} [${issue.category}]: ${issue.description}`);
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.log("");
      console.log(`⚠️  WARNINGS (${warnings.length}):`);

      // Group by category
      const memWarnings = warnings.filter((w) => w.category === "memory");
      const asyncWarnings = warnings.filter((w) => w.category === "async");
      const typeWarnings = warnings.filter((w) => w.category === "type_safety");

      if (memWarnings.length > 0) {
        console.log(`   Memory (${memWarnings.length}):`);
        for (const issue of memWarnings.slice(0, 3)) {
          console.log(`     Line ${issue.line}: ${issue.description}`);
        }
      }

      if (asyncWarnings.length > 0) {
        console.log(`   Async/Concurrency (${asyncWarnings.length}):`);
        for (const issue of asyncWarnings.slice(0, 3)) {
          console.log(`     Line ${issue.line}: ${issue.description}`);
        }
      }

      if (typeWarnings.length > 0) {
        console.log(`   Type Safety (${typeWarnings.length}):`);
        for (const issue of typeWarnings.slice(0, 3)) {
          console.log(`     Line ${issue.line}: ${issue.description}`);
        }
      }
    }

    if (info.length > 0) {
      console.log(`ℹ️  INFO: ${info.length} suggestions for improved safety`);
    }

    // Cache result
    const finalResult = { passed: errors.length === 0, issues: allIssues };
    if (config.cache.enabled) {
      await setCachedResult("advanced_analysis", filePath, finalResult);
    }

    if (errors.length > 0) {
      console.log("");
      console.log("❌ Advanced analysis failed");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (allIssues.length === 0) {
      console.log("✅ No advanced issues");
    } else {
      console.log("✅ Advanced analysis passed");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during advanced analysis");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
