/**
 * Central configuration for Claude Code hooks
 * Customize behavior, thresholds, and enabled checks here
 */

export interface HookConfig {
  // File patterns
  patterns: {
    typescript: RegExp;
    javascript: RegExp;
    styles: RegExp;
    markdown: RegExp;
    json: RegExp;
    allCode: RegExp;
  };

  // Quality checks configuration
  quality: {
    enabled: boolean;
    maxFileLines: number;
    maxFunctionLines: number;
    maxCyclomaticComplexity: number;
    maxParameterCount: number;
    maxNestingDepth: number;
    enableCircularDependencyCheck: boolean;
    enableDuplicateCodeCheck: boolean;
    duplicateCodeThreshold: number; // percentage
  };

  // Type/Lint/Format checks
  typecheck: {
    enabled: boolean;
    failOnError: boolean;
    runOnFileTypes: string[]; // ['ts', 'tsx']
  };

  lint: {
    enabled: boolean;
    failOnError: boolean;
    failOnWarning: boolean;
    autoFix: boolean;
    scope: "file" | "project"; // run on single file or whole project
  };

  format: {
    enabled: boolean;
    failOnError: boolean;
    autoFix: boolean;
  };

  // Import checks
  imports: {
    enabled: boolean;
    autoSort: boolean;
    failOnUnused: boolean;
    failOnUnorganized: boolean;
  };

  // Bundle size checks
  bundleSize: {
    enabled: boolean;
    maxFileSizeKb: number;
    maxComponentSizeKb: number;
    warnThresholdKb: number;
    failOnExceed: boolean;
  };

  // Security scanning
  security: {
    enabled: boolean;
    failOnCritical: boolean;
    failOnHigh: boolean;
    warnOnMedium: boolean;
    checks: {
      hardcodedSecrets: boolean;
      unsafePatterns: boolean;
      consoleStatements: boolean;
      dangerousHtml: boolean;
    };
  };

  // Output configuration
  output: {
    verbose: boolean;
    showDuration: boolean;
    maxOutputLines: number;
    colorize: boolean;
  };

  // Parallel execution
  parallel: {
    enabled: boolean;
    maxConcurrent: number;
  };

  // Architecture checks
  architecture: {
    enabled: boolean;
    enforceLayerBoundaries: boolean;
    enforceNamingConventions: boolean;
    layers: {
      components: string[]; // Allowed to import from
      hooks: string[];
      utils: string[];
      services: string[];
    };
  };

  // React/Frontend specific
  react: {
    enabled: boolean;
    enforceComponentTypes: boolean;
    enforcePropTypes: boolean;
    warnOnAnyProps: boolean;
    checkHookDependencies: boolean;
    detectPerformanceIssues: boolean;
    requireMemoForExpensiveComponents: boolean;
    maxComponentLines: number;
  };

  // Accessibility checks
  accessibility: {
    enabled: boolean;
    requireAltText: boolean;
    requireAriaLabels: boolean;
    checkKeyboardNav: boolean;
    failOnViolations: boolean;
  };

  // Advanced analysis
  advanced: {
    enabled: boolean;
    detectMemoryLeaks: boolean;
    detectRaceConditions: boolean;
    validateTypeNarrowing: boolean;
    checkAsyncPatterns: boolean;
  };

  // Project infrastructure usage validation
  projectInfrastructure: {
    enabled: boolean;
    enforceTypeImports: boolean; // Require using @/lib/types
    enforceUtilImports: boolean; // Require using @/lib/utils
    enforceCacheUsage: boolean; // Suggest using @/lib/cache for caching
    enforceRedisUsage: boolean; // Suggest using Redis/KV for state
    allowedDuplicatePatterns: string[]; // Patterns that are OK to reimplement
  };

  // Cache configuration for incremental checks
  cache: {
    enabled: boolean;
    maxAge: number; // Max cache age in milliseconds
  };
}

/**
 * Default configuration - modify as needed
 */
export const config: HookConfig = {
  patterns: {
    typescript: /\.(ts|tsx)$/,
    javascript: /\.(js|jsx)$/,
    styles: /\.(css|scss|sass|less)$/,
    markdown: /\.md$/,
    json: /\.json$/,
    allCode: /\.(ts|tsx|js|jsx|css|scss|sass|less|json)$/,
  },

  quality: {
    enabled: true,
    maxFileLines: 500,
    maxFunctionLines: 50,
    maxCyclomaticComplexity: 15,
    maxParameterCount: 4,
    maxNestingDepth: 3,
    enableCircularDependencyCheck: true,
    enableDuplicateCodeCheck: true,
    duplicateCodeThreshold: 5, // 5% duplicate code threshold
  },

  typecheck: {
    enabled: true,
    failOnError: true,
    runOnFileTypes: ["ts", "tsx"],
  },

  lint: {
    enabled: true,
    failOnError: true,
    failOnWarning: false,
    autoFix: true,
    scope: "file", // Changed from 'project' to 'file' for faster checks
  },

  format: {
    enabled: true,
    failOnError: false, // Usually auto-fixable
    autoFix: true,
  },

  imports: {
    enabled: true,
    autoSort: true,
    failOnUnused: true,
    failOnUnorganized: false, // Just fix it automatically
  },

  bundleSize: {
    enabled: true,
    maxFileSizeKb: 100,
    maxComponentSizeKb: 50,
    warnThresholdKb: 30,
    failOnExceed: true,
  },

  security: {
    enabled: true,
    failOnCritical: true,
    failOnHigh: true,
    warnOnMedium: true,
    checks: {
      hardcodedSecrets: true,
      unsafePatterns: true,
      consoleStatements: false, // Often legitimate in dev
      dangerousHtml: true,
    },
  },

  output: {
    verbose: false,
    showDuration: true,
    maxOutputLines: 5,
    colorize: true,
  },

  parallel: {
    enabled: true,
    maxConcurrent: 4,
  },

  architecture: {
    enabled: true,
    enforceLayerBoundaries: true,
    enforceNamingConventions: true,
    layers: {
      components: ["@/components", "@/hooks", "@/lib/utils", "@/types"],
      hooks: ["@/lib", "@/types", "@/config"],
      utils: ["@/types", "@/config"], // Utils should NOT import from features/components
      services: ["@/lib/db", "@/lib/api", "@/types", "@/config"],
    },
  },

  react: {
    enabled: true,
    enforceComponentTypes: true,
    enforcePropTypes: true,
    warnOnAnyProps: true,
    checkHookDependencies: true,
    detectPerformanceIssues: true,
    requireMemoForExpensiveComponents: false, // Can be noisy
    maxComponentLines: 300,
  },

  accessibility: {
    enabled: true,
    requireAltText: true,
    requireAriaLabels: true,
    checkKeyboardNav: true,
    failOnViolations: false, // Warn by default
  },

  advanced: {
    enabled: true,
    detectMemoryLeaks: true,
    detectRaceConditions: true,
    validateTypeNarrowing: true,
    checkAsyncPatterns: true,
  },

  projectInfrastructure: {
    enabled: true,
    enforceTypeImports: true,
    enforceUtilImports: true,
    enforceCacheUsage: true,
    enforceRedisUsage: true,
    allowedDuplicatePatterns: [
      "components/", // UI components can have local utils
      "app/api/", // API routes can have local helpers
      "__tests__/", // Test files can have test helpers
      ".claude/hooks/", // Hooks themselves are OK
    ],
  },

  cache: {
    enabled: true,
    maxAge: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Exit codes used by hooks
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  CHECK_FAILURE: 1,
  UNEXPECTED_ERROR: 2,
  CONFIG_ERROR: 3,
} as const;

/**
 * Helper to check if a file matches a pattern
 */
export function matchesPattern(filePath: string, pattern: RegExp): boolean {
  return pattern.test(filePath);
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? match[1] : "";
}

/**
 * Check if file should be checked based on config
 */
export function shouldCheckFile(filePath: string, patterns: RegExp | RegExp[]): boolean {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  return patternsArray.some((pattern) => matchesPattern(filePath, pattern));
}
