/**
 * Complextropy Metrics Calculator
 *
 * Implements resource-bounded sophistication metrics for code analysis
 */

import { gzipSync } from "node:zlib";

export interface ComplextropyMetrics {
  // Kolmogorov complexity proxies
  fileSize: number;
  compressedSize: number;
  compressionRatio: number;

  // Sophistication indicators
  patternCount: number;
  patternCoverage: number;
  abstractionLayers: number;

  // Entropy metrics
  uniqueTokens: number;
  totalTokens: number;
  shannonEntropy: number;
  cyclomaticComplexity: number;
  nestingDepth: number;

  // Derived scores (0-100)
  sophisticationScore: number;
  entropyScore: number;
  complextropyZone: "too-simple" | "optimal" | "too-chaotic";
}

export interface CodePattern {
  type: string;
  occurrences: number;
  coverage: number; // % of code following this pattern
  example: string;
}

/**
 * Calculate Kolmogorov complexity proxy using gzip compression
 */
export function calculateCompressionMetrics(code: string): {
  fileSize: number;
  compressedSize: number;
  compressionRatio: number;
} {
  const fileSize = Buffer.byteLength(code, "utf8");
  const compressed = gzipSync(code);
  const compressedSize = compressed.length;
  const compressionRatio = compressedSize / fileSize;

  return { fileSize, compressedSize, compressionRatio };
}

/**
 * Calculate Shannon entropy of token distribution
 */
export function calculateShannonEntropy(tokens: string[]): number {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  let entropy = 0;
  const total = tokens.length;
  for (const count of freq.values()) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Estimate cyclomatic complexity from code structure
 */
export function estimateCyclomaticComplexity(code: string): number {
  // Simple heuristic: count decision points
  const decisionKeywords = [
    /\bif\b/g,
    /\belse\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b\?\b/g, // ternary
    /&&/g, // logical AND
    /\|\|/g, // logical OR
  ];

  let complexity = 1; // Base complexity
  for (const pattern of decisionKeywords) {
    const matches = code.match(pattern);
    complexity += matches ? matches.length : 0;
  }

  return complexity;
}

/**
 * Calculate maximum nesting depth
 */
export function calculateNestingDepth(code: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (const char of code) {
    if (char === "{") {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === "}") {
      currentDepth--;
    }
  }

  return maxDepth;
}

/**
 * Tokenize code for analysis
 */
export function tokenize(code: string): string[] {
  // Simple tokenization: split on whitespace and common delimiters
  return code
    .split(/[\s,;(){}[\]<>.:]+/)
    .filter((token) => token.length > 0)
    .filter((token) => !token.match(/^\/\//)); // Remove comments
}

/**
 * Detect common code patterns
 */
export function detectPatterns(code: string): CodePattern[] {
  const patterns: CodePattern[] = [];

  // Pattern: Function declarations
  const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g;
  const functionMatches = code.match(functionPattern) || [];

  // Pattern: Class declarations
  const classPattern = /class\s+\w+/g;
  const classMatches = code.match(classPattern) || [];

  // Pattern: Import statements
  const importPattern = /import\s+.*from/g;
  const importMatches = code.match(importPattern) || [];

  // Pattern: Async/await usage
  const asyncPattern = /async\s+function|async\s*\(|await\s+/g;
  const asyncMatches = code.match(asyncPattern) || [];

  // Pattern: Error handling
  const errorPattern = /try\s*{|catch\s*\(|throw\s+/g;
  const errorMatches = code.match(errorPattern) || [];

  // Pattern: Type annotations (TypeScript)
  const typePattern = /:\s*\w+\s*[<{=;,)]/g;
  const typeMatches = code.match(typePattern) || [];

  const totalLines = code.split("\n").length;

  if (functionMatches.length > 0) {
    patterns.push({
      type: "Function Declarations",
      occurrences: functionMatches.length,
      coverage: (functionMatches.length / totalLines) * 100,
      example: functionMatches[0],
    });
  }

  if (classMatches.length > 0) {
    patterns.push({
      type: "Class Definitions",
      occurrences: classMatches.length,
      coverage: (classMatches.length / totalLines) * 100,
      example: classMatches[0],
    });
  }

  if (importMatches.length > 0) {
    patterns.push({
      type: "Import Statements",
      occurrences: importMatches.length,
      coverage: (importMatches.length / totalLines) * 100,
      example: importMatches[0],
    });
  }

  if (asyncMatches.length > 0) {
    patterns.push({
      type: "Async/Await Pattern",
      occurrences: asyncMatches.length,
      coverage: (asyncMatches.length / totalLines) * 100,
      example: asyncMatches[0],
    });
  }

  if (errorMatches.length > 0) {
    patterns.push({
      type: "Error Handling",
      occurrences: errorMatches.length,
      coverage: (errorMatches.length / totalLines) * 100,
      example: errorMatches[0],
    });
  }

  if (typeMatches.length > 0) {
    patterns.push({
      type: "Type Annotations",
      occurrences: typeMatches.length,
      coverage: (typeMatches.length / totalLines) * 100,
      example: typeMatches[0],
    });
  }

  return patterns;
}

/**
 * Calculate overall sophistication score (0-100)
 */
export function calculateSophisticationScore(metrics: {
  compressionRatio: number;
  patternCoverage: number;
  nestingDepth: number;
  cyclomaticComplexity: number;
}): number {
  // Optimal compression ratio: 0.6-0.75 (good pattern density)
  const compressionScore = (() => {
    if (metrics.compressionRatio >= 0.6 && metrics.compressionRatio <= 0.75) {
      return 100;
    }
    if (metrics.compressionRatio < 0.6) {
      // Too much compression = too simple
      return (metrics.compressionRatio / 0.6) * 100;
    }
    // Too little compression = too chaotic
    return ((1 - metrics.compressionRatio) / 0.25) * 100;
  })();

  // Optimal pattern coverage: 70%+
  const patternScore = Math.min(100, (metrics.patternCoverage / 70) * 100);

  // Optimal nesting depth: ≤3
  const nestingScore = metrics.nestingDepth <= 3 ? 100 : (3 / metrics.nestingDepth) * 100;

  // Optimal cyclomatic complexity: <10 per function (approximate)
  const complexityScore =
    metrics.cyclomaticComplexity <= 10 ? 100 : (10 / metrics.cyclomaticComplexity) * 100;

  // Weighted average
  return compressionScore * 0.3 + patternScore * 0.3 + nestingScore * 0.2 + complexityScore * 0.2;
}

/**
 * Calculate entropy score (0-100)
 */
export function calculateEntropyScore(metrics: {
  shannonEntropy: number;
  uniqueTokenRatio: number;
}): number {
  // Normalize Shannon entropy (typical range 0-10)
  const entropyNormalized = Math.min(1, metrics.shannonEntropy / 10);

  // Optimal unique token ratio: 30-50%
  const uniqueScore = (() => {
    if (metrics.uniqueTokenRatio >= 0.3 && metrics.uniqueTokenRatio <= 0.5) {
      return 0.5; // Middle entropy
    }
    if (metrics.uniqueTokenRatio < 0.3) {
      return (metrics.uniqueTokenRatio / 0.3) * 0.5; // Low entropy
    }
    return ((metrics.uniqueTokenRatio - 0.5) / 0.5) * 0.5 + 0.5; // High entropy
  })();

  return (entropyNormalized * 0.5 + uniqueScore * 0.5) * 100;
}

/**
 * Main function: Calculate all complextropy metrics
 */
export function analyzeComplextropy(code: string): ComplextropyMetrics {
  // Step 1: Basic metrics
  const { fileSize, compressedSize, compressionRatio } = calculateCompressionMetrics(code);

  // Step 2: Tokenization
  const tokens = tokenize(code);
  const uniqueTokens = new Set(tokens).size;
  const totalTokens = tokens.length;
  const uniqueTokenRatio = uniqueTokens / totalTokens;

  // Step 3: Entropy
  const shannonEntropy = calculateShannonEntropy(tokens);

  // Step 4: Complexity
  const cyclomaticComplexity = estimateCyclomaticComplexity(code);
  const nestingDepth = calculateNestingDepth(code);

  // Step 5: Patterns
  const patterns = detectPatterns(code);
  const patternCount = patterns.length;
  const patternCoverage = patterns.reduce((sum, p) => sum + p.coverage, 0) / patterns.length || 0;

  // Step 6: Abstraction layers (estimate)
  const abstractionLayers = (() => {
    const hasClasses = code.includes("class ");
    const hasFunctions = code.includes("function ") || code.includes("=>");
    const hasModules = code.includes("import ") || code.includes("export ");
    return (hasModules ? 1 : 0) + (hasClasses ? 1 : 0) + (hasFunctions ? 1 : 0);
  })();

  // Step 7: Derived scores
  const sophisticationScore = calculateSophisticationScore({
    compressionRatio,
    patternCoverage,
    nestingDepth,
    cyclomaticComplexity,
  });

  const entropyScore = calculateEntropyScore({
    shannonEntropy,
    uniqueTokenRatio,
  });

  // Step 8: Determine zone
  const complextropyZone: "too-simple" | "optimal" | "too-chaotic" = (() => {
    if (sophisticationScore >= 40 && sophisticationScore <= 70) {
      return "optimal";
    }
    if (sophisticationScore < 40 && entropyScore < 50) {
      return "too-simple";
    }
    return "too-chaotic";
  })();

  return {
    fileSize,
    compressedSize,
    compressionRatio,
    patternCount,
    patternCoverage,
    abstractionLayers,
    uniqueTokens,
    totalTokens,
    shannonEntropy,
    cyclomaticComplexity,
    nestingDepth,
    sophisticationScore,
    entropyScore,
    complextropyZone,
  };
}
