#!/usr/bin/env bun

/**
 * Next.js 16 Best Practices Audit Script
 *
 * Systematically reviews all TypeScript/TSX files for compliance with:
 * - Next.js 16.0.1 App Router patterns
 * - React 19.0.0 best practices
 * - Clarity codebase conventions
 *
 * Usage:
 *   bun run .claude/skills/nextjs-16-audit/audit.ts [--fix] [--category=<category>]
 *
 * Options:
 *   --fix              Apply auto-fixes where possible
 *   --category=<name>  Audit specific category only (e.g., --category=caching)
 *   --severity=<level> Filter by severity: error|warning|info
 *   --format=<type>    Output format: table|json|markdown (default: table)
 */

import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { glob } from "glob";

// ============================================================================
// Types
// ============================================================================

type Severity = "error" | "warning" | "info";
type Category =
  | "app-router"
  | "caching"
  | "data-fetching"
  | "server-functions"
  | "streaming"
  | "auth"
  | "react-19"
  | "database"
  | "types"
  | "api-routes"
  | "state-management"
  | "performance"
  | "error-handling"
  | "accessibility"
  | "security"
  | "imports";

interface Violation {
  file: string;
  line: number;
  category: Category;
  severity: Severity;
  rule: string;
  message: string;
  code: string;
  fix?: {
    description: string;
    before: string;
    after: string;
  };
}

interface AuditResult {
  totalFiles: number;
  violations: Violation[];
  summary: Record<Category, { error: number; warning: number; info: number }>;
}

// ============================================================================
// Audit Rules
// ============================================================================

const RULES = {
  // App Router patterns
  "use-server-components": {
    category: "app-router" as Category,
    severity: "warning" as Severity,
    message: 'Prefer Server Components (remove "use client" if hooks/events not needed)',
    patterns: [
      {
        regex:
          /^["']use client["'];?\s*\n(?!.*use(State|Effect|Context|Ref|Callback|Memo|Reducer|Id|ImperativeHandle|LayoutEffect|DebugValue|Transition|DeferredValue|SyncExternalStore|Optimistic|FormStatus)\()/m,
        context: 20,
      },
    ],
  },
  "async-server-component": {
    category: "app-router" as Category,
    severity: "info" as Severity,
    message: "Consider making Server Component async for data fetching",
    patterns: [
      {
        regex: /export\s+default\s+function\s+\w+\([^)]*\)\s*{[^}]*(?:const|let)\s+\w+\s+=\s+await/,
        context: 10,
      },
    ],
  },

  // Caching patterns
  "use-cache-directive": {
    category: "caching" as Category,
    severity: "error" as Severity,
    message: 'Migrate from cacheWrap to "use cache" directive (Cache Components)',
    patterns: [
      {
        regex: /import\s+{[^}]*cacheWrap[^}]*}\s+from\s+['"]@\/lib\/cache['"]/,
        context: 5,
      },
      {
        regex: /cacheWrap\(/,
        context: 3,
      },
    ],
  },
  "cache-life": {
    category: "caching" as Category,
    severity: "warning" as Severity,
    message: 'Add cacheLife() to "use cache" functions',
    patterns: [
      {
        regex: /["']use cache["'];?\s*\n(?!.*cacheLife\()/m,
        context: 10,
      },
    ],
  },
  "cache-tag": {
    category: "caching" as Category,
    severity: "warning" as Severity,
    message: "Add cacheTag() for surgical cache invalidation",
    patterns: [
      {
        regex: /["']use cache["'];?\s*\n.*cacheLife\([^)]+\)(?!.*cacheTag\()/m,
        context: 10,
      },
    ],
  },
  "no-dynamic-in-cache": {
    category: "caching" as Category,
    severity: "error" as Severity,
    message: 'Cannot use cookies(), headers(), or searchParams in "use cache" functions',
    patterns: [
      {
        regex: /["']use cache["'];[\s\S]{0,300}\b(cookies|headers|searchParams)\(/m,
        context: 15,
      },
    ],
  },

  // Data Fetching
  "parallel-fetching": {
    category: "data-fetching" as Category,
    severity: "info" as Severity,
    message: "Consider parallel fetching with Promise.all() for independent requests",
    patterns: [
      {
        regex:
          /const\s+\w+\s*=\s*await\s+\w+\([^)]*\);?\s*\n\s*const\s+\w+\s*=\s*await\s+\w+\([^)]*\)/,
        context: 10,
      },
    ],
  },
  "request-memoization": {
    category: "data-fetching" as Category,
    severity: "info" as Severity,
    message: "Consider wrapping data fetching function with React cache() for request memoization",
    patterns: [
      {
        regex: /export\s+(async\s+)?function\s+get\w+\([^)]*\)\s*{[\s\S]{0,200}await\s+db\./m,
        context: 15,
      },
    ],
  },
  "fetch-cache-option": {
    category: "data-fetching" as Category,
    severity: "warning" as Severity,
    message: "Specify cache option in fetch() - not cached by default in Next.js 16",
    patterns: [
      {
        regex: /await\s+fetch\([^,)]+\)(?!\s*,\s*{[^}]*cache:)/,
        context: 5,
      },
    ],
  },

  // Server Functions & Actions
  "use-server-auth": {
    category: "server-functions" as Category,
    severity: "error" as Severity,
    message: "Always validate auth in Server Actions before mutations",
    patterns: [
      {
        regex:
          /["']use server["'];[\s\S]{0,200}(export\s+)?async\s+function\s+\w+\([^)]*FormData[^)]*\)[\s\S]{0,300}db\.(insert|update|delete)(?![\s\S]{0,200}getUserId|verifySession)/m,
        context: 20,
      },
    ],
  },
  "revalidate-after-mutation": {
    category: "server-functions" as Category,
    severity: "warning" as Severity,
    message: "Call revalidatePath() or revalidateTag() after data mutations",
    patterns: [
      {
        regex:
          /["']use server["'];[\s\S]{0,300}db\.(insert|update|delete)[\s\S]{0,100}(?!revalidate)/m,
        context: 15,
      },
    ],
  },

  // Streaming
  "use-suspense-boundary": {
    category: "streaming" as Category,
    severity: "info" as Severity,
    message: "Consider wrapping async components in <Suspense> for streaming",
    patterns: [
      {
        regex:
          /export\s+default\s+async\s+function\s+\w+\([^)]*\)\s*{[\s\S]{0,500}await\s+(?!.*<Suspense)/m,
        context: 20,
      },
    ],
  },
  "use-hook-client": {
    category: "streaming" as Category,
    severity: "info" as Severity,
    message: "Consider using React.use() hook to unwrap promises in Client Components",
    patterns: [
      {
        regex: /["']use client["'];[\s\S]{0,300}props:\s*{[^}]*Promise<[^>]+>[^}]*}/m,
        context: 15,
      },
    ],
  },

  // Authentication & DAL
  "use-dal": {
    category: "auth" as Category,
    severity: "error" as Severity,
    message:
      "Use DAL functions (verifySession, getUserId, getUser) instead of direct Supabase auth",
    patterns: [
      {
        regex: /supabase\.auth\.getUser\(\)/,
        context: 5,
      },
      {
        regex: /supabase\.auth\.getSession\(\)/,
        context: 5,
      },
    ],
  },
  "use-auth-hook": {
    category: "auth" as Category,
    severity: "warning" as Severity,
    message: "Use useAuthUser() or useAuth() instead of manual Supabase auth in Client Components",
    patterns: [
      {
        regex: /["']use client["'];[\s\S]*useEffect\([^)]*supabase\.auth/m,
        context: 10,
      },
    ],
  },

  // React 19 patterns
  "remove-unnecessary-useeffect": {
    category: "react-19" as Category,
    severity: "warning" as Severity,
    message: "Remove unnecessary useEffect (derive state, move to event handlers, or use keys)",
    patterns: [
      {
        regex: /useEffect\(\(\)\s*=>\s*{\s*set\w+\(/,
        context: 10,
      },
    ],
  },
  "derive-state": {
    category: "react-19" as Category,
    severity: "info" as Severity,
    message: "Consider deriving this state instead of useState",
    patterns: [
      {
        regex:
          /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\([^)]+\);[\s\S]{0,200}useEffect\([^)]*\1/m,
        context: 15,
      },
    ],
  },

  // Database patterns
  "use-dal-in-server": {
    category: "database" as Category,
    severity: "error" as Severity,
    message: "Always use DAL (verifySession, getUserId) in Server Components",
    patterns: [
      {
        regex:
          /export\s+default\s+async\s+function[^{]*{[\s\S]{0,300}createClient\(\)[\s\S]{0,100}auth\.getUser/m,
        context: 20,
      },
    ],
  },
  "use-repositories": {
    category: "database" as Category,
    severity: "warning" as Severity,
    message: "Use repositories (@/lib/db/repositories) instead of queries module",
    patterns: [
      {
        regex: /import\s+{[^}]*Queries[^}]*}\s+from\s+['"]@\/lib\/db\/queries['"]/,
        context: 5,
      },
    ],
  },
  "import-drizzle-operators": {
    category: "database" as Category,
    severity: "error" as Severity,
    message: 'Import Drizzle operators from "drizzle-orm" not "@/lib/db"',
    patterns: [
      {
        regex:
          /import\s+{[^}]*\b(eq|and|or|not|gt|gte|lt|lte|like|ilike|sql)\b[^}]*}\s+from\s+['"]@\/lib\/db['"]/,
        context: 3,
      },
    ],
  },

  // Type safety
  "avoid-any": {
    category: "types" as Category,
    severity: "warning" as Severity,
    message: 'Avoid "any" type - use unknown or proper types',
    patterns: [
      {
        regex: /:\s*any\b(?!\s*\/\/)/,
        context: 3,
      },
    ],
  },
  "canonical-types": {
    category: "types" as Category,
    severity: "error" as Severity,
    message: "Import types from @/lib/types (canonical location)",
    patterns: [
      {
        regex: /export\s+(interface|type)\s+(Transaction|Account|User|Asset|Connection)\b/,
        context: 5,
      },
    ],
  },

  // API routes
  "use-cache-in-routes": {
    category: "api-routes" as Category,
    severity: "warning" as Severity,
    message: 'Extract cacheable logic to "use cache" helper function',
    patterns: [
      {
        regex:
          /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*{[\s\S]{0,300}cacheWrap/m,
        context: 15,
      },
    ],
  },

  // Imports
  "no-direct-kv": {
    category: "imports" as Category,
    severity: "error" as Severity,
    message: "Import from @/lib/utils/kv not @vercel/kv directly",
    patterns: [
      {
        regex: /import\s+{[^}]*kv[^}]*}\s+from\s+['"]@vercel\/kv['"]/,
        context: 3,
      },
    ],
  },

  // Performance
  "next-image": {
    category: "performance" as Category,
    severity: "warning" as Severity,
    message: "Use next/image instead of <img> tag",
    patterns: [
      {
        regex: /<img\s+src=/,
        context: 3,
      },
    ],
  },
  "dynamic-import": {
    category: "performance" as Category,
    severity: "info" as Severity,
    message: "Consider dynamic import for heavy client-side components",
    patterns: [
      {
        regex:
          /["']use client["'];[\s\S]{0,100}import\s+{[^}]*}\s+from\s+['"](?:recharts|d3|framer-motion)['"]/m,
        context: 10,
      },
    ],
  },

  // Security
  "no-dangerous-html": {
    category: "security" as Category,
    severity: "error" as Severity,
    message: "Sanitize HTML with isomorphic-dompurify before dangerouslySetInnerHTML",
    patterns: [
      {
        regex: /dangerouslySetInnerHTML={{[^}]*__html:/,
        context: 5,
      },
    ],
  },
  "validate-input": {
    category: "security" as Category,
    severity: "error" as Severity,
    message: "Validate user input with Zod schema",
    patterns: [
      {
        regex:
          /export\s+async\s+function\s+(POST|PUT|PATCH)\s*\([^)]*request[^)]*\)\s*{[\s\S]{0,200}await\s+request\.json\(\)(?![\s\S]{0,100}\.parse\()/m,
        context: 15,
      },
    ],
  },

  // Accessibility
  "button-not-div": {
    category: "accessibility" as Category,
    severity: "error" as Severity,
    message: "Use <button> instead of <div onClick>",
    patterns: [
      {
        regex: /<div[^>]*onClick={/,
        context: 3,
      },
    ],
  },
  "form-labels": {
    category: "accessibility" as Category,
    severity: "warning" as Severity,
    message: "Form inputs should have associated labels with htmlFor",
    patterns: [
      {
        regex: /<input[^>]*(?!.*id=)/,
        context: 5,
      },
    ],
  },
};

// ============================================================================
// Audit Logic
// ============================================================================

async function auditFile(filePath: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  for (const [ruleName, rule] of Object.entries(RULES)) {
    // Skip certain rules for specific paths
    const relativePath = relative(process.cwd(), filePath);

    // Skip canonical-types check for files in lib/types/* (they ARE the canonical location)
    if (ruleName === "canonical-types" && relativePath.startsWith("lib/types/")) {
      continue;
    }

    // Skip canonical-types for schema files (they define DB schema types, not business types)
    if (ruleName === "canonical-types" && relativePath.startsWith("lib/db/schema/")) {
      continue;
    }

    // Skip DAL errors for dal.ts itself (it's the implementation)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("lib/data/dal.ts")
    ) {
      continue;
    }

    // Skip DAL errors for middleware (can't use DAL in middleware)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("proxy.ts")
    ) {
      continue;
    }

    // Skip DAL errors for API auth handlers (they implement the auth wrapper)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("lib/api/next/handlers.ts")
    ) {
      continue;
    }

    // Skip DAL errors for public pages with optional auth
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("app/(public)/page.tsx")
    ) {
      continue;
    }

    // Skip DAL errors for client-side hooks (they use browser Supabase client, called from client components)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      (relativePath.includes("lib/hooks/") || relativePath.startsWith("hooks/"))
    ) {
      continue;
    }

    // Skip DAL errors for health check endpoint (it tests Supabase connection directly)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("app/api/health/")
    ) {
      continue;
    }

    // Skip DAL errors for public layouts with optional auth (help, blog)
    if (
      (ruleName === "use-dal" || ruleName === "use-dal-in-server") &&
      relativePath.includes("app/(public)/") &&
      relativePath.includes("/layout.tsx")
    ) {
      continue;
    }

    // Skip canonical-types for deprecated types (already marked for removal)
    if (ruleName === "canonical-types" && content.includes("@deprecated")) {
      continue;
    }

    // Skip canonical-types for presentation layer types in formatters (distinct from domain types)
    if (
      ruleName === "canonical-types" &&
      relativePath.includes("/formatters/") &&
      content.includes("presentation layer")
    ) {
      continue;
    }

    // Skip use-cache-in-routes for cache/index.ts (it's the deprecated implementation itself)
    if (ruleName === "use-cache-in-routes" && relativePath.includes("lib/cache/index.ts")) {
      continue;
    }

    // Skip fetch-cache-option for client components (browser cache handles it)
    if (ruleName === "fetch-cache-option" && content.includes('"use client"')) {
      continue;
    }

    // Skip no-dangerous-html for JSON-LD scripts (type="application/ld+json" is data, not code)
    if (
      ruleName === "no-dangerous-html" &&
      content.includes('type="application/ld+json"') &&
      content.includes("JSON.stringify")
    ) {
      continue;
    }

    for (const pattern of rule.patterns) {
      const matches = content.matchAll(new RegExp(pattern.regex, "gm"));

      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split("\n").length;

        // Skip violations on lines with biome-ignore or eslint-disable comments
        const line = lines[lineNumber - 1] || "";
        const prevLine = lines[lineNumber - 2] || "";
        if (
          line.includes("biome-ignore") ||
          line.includes("eslint-disable") ||
          prevLine.includes("biome-ignore") ||
          prevLine.includes("eslint-disable")
        ) {
          continue;
        }

        // Skip button-not-div check for divs with proper ARIA (already accessible)
        if (ruleName === "button-not-div") {
          const snippet = content.substring(match.index, match.index + 300);
          // Skip if has aria-hidden (backdrop), or has role="button" with tabIndex and keyboard handler
          if (
            snippet.includes('aria-hidden="true"') ||
            (snippet.includes('role="button"') &&
              snippet.includes("tabIndex") &&
              snippet.includes("onKeyDown"))
          ) {
            continue;
          }
        }

        const startLine = Math.max(0, lineNumber - pattern.context);
        const endLine = Math.min(lines.length, lineNumber + pattern.context);
        const code = lines.slice(startLine, endLine).join("\n");

        violations.push({
          file: relative(process.cwd(), filePath),
          line: lineNumber,
          category: rule.category,
          severity: rule.severity,
          rule: ruleName,
          message: rule.message,
          code,
        });
      }
    }
  }

  return violations;
}

async function audit(): Promise<AuditResult> {
  // Find all TypeScript/TSX files
  const files = await glob("**/*.{ts,tsx}", {
    ignore: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      ".turbo/**",
      "coverage/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "scripts/**", // Skip utility scripts (not production code)
    ],
  });

  const violations: Violation[] = [];

  for (const file of files) {
    const fileViolations = await auditFile(file);
    violations.push(...fileViolations);
  }

  // Build summary
  const summary: Record<Category, { error: number; warning: number; info: number }> = {
    "app-router": { error: 0, warning: 0, info: 0 },
    caching: { error: 0, warning: 0, info: 0 },
    "data-fetching": { error: 0, warning: 0, info: 0 },
    "server-functions": { error: 0, warning: 0, info: 0 },
    streaming: { error: 0, warning: 0, info: 0 },
    auth: { error: 0, warning: 0, info: 0 },
    "react-19": { error: 0, warning: 0, info: 0 },
    database: { error: 0, warning: 0, info: 0 },
    types: { error: 0, warning: 0, info: 0 },
    "api-routes": { error: 0, warning: 0, info: 0 },
    "state-management": { error: 0, warning: 0, info: 0 },
    performance: { error: 0, warning: 0, info: 0 },
    "error-handling": { error: 0, warning: 0, info: 0 },
    accessibility: { error: 0, warning: 0, info: 0 },
    security: { error: 0, warning: 0, info: 0 },
    imports: { error: 0, warning: 0, info: 0 },
  };

  for (const violation of violations) {
    summary[violation.category][violation.severity]++;
  }

  return {
    totalFiles: files.length,
    violations,
    summary,
  };
}

// ============================================================================
// Output Formatters
// ============================================================================

function printTableReport(result: AuditResult) {
  for (const [_category, counts] of Object.entries(result.summary)) {
    const total = counts.error + counts.warning + counts.info;
    if (total > 0) {
    }
  }

  // Violations by severity
  const errors = result.violations.filter((v) => v.severity === "error");
  const warnings = result.violations.filter((v) => v.severity === "warning");
  const _infos = result.violations.filter((v) => v.severity === "info");

  if (errors.length > 0) {
    for (const _violation of errors.slice(0, 10)) {
    }
    if (errors.length > 10) {
    }
  }

  if (warnings.length > 0) {
    for (const _violation of warnings.slice(0, 5)) {
    }
    if (warnings.length > 5) {
    }
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const result = await audit();
  printTableReport(result);

  // Exit code based on errors
  const errorCount = result.violations.filter((v) => v.severity === "error").length;
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
