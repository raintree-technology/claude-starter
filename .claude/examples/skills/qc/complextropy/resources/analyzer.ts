/**
 * Complextropy File Analyzer
 *
 * Main analysis engine that produces refactoring recommendations
 */

import { analyzeComplextropy, type ComplextropyMetrics, detectPatterns } from "./metrics";

export interface RefactoringAction {
  location: string;
  currentZone: "too-simple" | "optimal" | "too-chaotic";
  targetZone: "optimal";
  strategy: RefactoringStrategy;
  priority: "high" | "medium" | "low";
  estimatedImpact: {
    sophisticationDelta: number;
    entropyDelta: number;
    linesChanged: number;
  };
  codeExample?: {
    before: string;
    after: string;
    explanation: string;
  };
}

export enum RefactoringStrategy {
  // Moving from too-simple
  EXTRACT_FUNCTIONS = "Extract functions to add structure",
  ADD_ABSTRACTION_LAYER = "Introduce abstraction layer",
  CREATE_TYPES = "Create domain-specific types",
  INTRODUCE_PATTERNS = "Introduce design patterns",

  // Moving from too-chaotic
  EXTRACT_PATTERNS = "Extract repeated patterns",
  NORMALIZE_STRUCTURE = "Normalize similar code paths",
  REDUCE_NESTING = "Reduce nesting depth",
  CONSOLIDATE_ERROR_HANDLING = "Unify error handling",
  EXTRACT_CONSTANTS = "Extract magic values",

  // Optimization
  MINOR_REFINEMENT = "Minor refinements only",
}

export interface AnalysisReport {
  filename: string;
  metrics: ComplextropyMetrics;
  patterns: ReturnType<typeof detectPatterns>;
  issues: RefactoringAction[];
  summary: {
    totalIssues: number;
    estimatedSophisticationGain: number;
    filestoModify: number;
    priority: "high" | "medium" | "low";
  };
}

/**
 * Analyze a file and produce recommendations
 */
export function analyzeFile(filename: string, code: string): AnalysisReport {
  const metrics = analyzeComplextropy(code);
  const patterns = detectPatterns(code);
  const issues = generateRefactoringActions(filename, code, metrics, patterns);

  const totalIssues = issues.length;
  const estimatedSophisticationGain = issues.reduce(
    (sum, action) => sum + action.estimatedImpact.sophisticationDelta,
    0,
  );

  const priority: "high" | "medium" | "low" = (() => {
    if (metrics.sophisticationScore < 30) return "high";
    if (metrics.sophisticationScore < 40) return "medium";
    return "low";
  })();

  return {
    filename,
    metrics,
    patterns,
    issues,
    summary: {
      totalIssues,
      estimatedSophisticationGain,
      filestoModify: 1,
      priority,
    },
  };
}

/**
 * Generate refactoring actions based on metrics
 */
function generateRefactoringActions(
  filename: string,
  code: string,
  metrics: ComplextropyMetrics,
  patterns: ReturnType<typeof detectPatterns>,
): RefactoringAction[] {
  const actions: RefactoringAction[] = [];
  const lines = code.split("\n");

  // Check if in optimal zone
  if (metrics.complextropyZone === "optimal") {
    if (metrics.sophisticationScore < 60) {
      actions.push({
        location: `${filename}:1`,
        currentZone: "optimal",
        targetZone: "optimal",
        strategy: RefactoringStrategy.MINOR_REFINEMENT,
        priority: "low",
        estimatedImpact: {
          sophisticationDelta: 5,
          entropyDelta: 0,
          linesChanged: 10,
        },
      });
    }
    return actions;
  }

  // Too simple zone
  if (metrics.complextropyZone === "too-simple") {
    // Check for God functions (long functions)
    if (lines.length > 100) {
      actions.push({
        location: `${filename}:1-${lines.length}`,
        currentZone: "too-simple",
        targetZone: "optimal",
        strategy: RefactoringStrategy.EXTRACT_FUNCTIONS,
        priority: "high",
        estimatedImpact: {
          sophisticationDelta: 20,
          entropyDelta: 10,
          linesChanged: lines.length / 2,
        },
        codeExample: {
          before: "// Single giant function doing everything",
          after: "// Multiple focused functions with clear responsibilities",
          explanation:
            "Breaking down large functions increases sophistication by creating discoverable patterns",
        },
      });
    }

    // Check for lack of abstraction
    if (metrics.abstractionLayers < 2) {
      actions.push({
        location: `${filename}:1`,
        currentZone: "too-simple",
        targetZone: "optimal",
        strategy: RefactoringStrategy.ADD_ABSTRACTION_LAYER,
        priority: "high",
        estimatedImpact: {
          sophisticationDelta: 15,
          entropyDelta: 5,
          linesChanged: 50,
        },
      });
    }

    // Check for lack of types
    const hasTypeAnnotations = patterns.some((p) => p.type === "Type Annotations");
    if (!hasTypeAnnotations) {
      actions.push({
        location: `${filename}:1`,
        currentZone: "too-simple",
        targetZone: "optimal",
        strategy: RefactoringStrategy.CREATE_TYPES,
        priority: "medium",
        estimatedImpact: {
          sophisticationDelta: 10,
          entropyDelta: 0,
          linesChanged: 20,
        },
      });
    }
  }

  // Too chaotic zone
  if (metrics.complextropyZone === "too-chaotic") {
    // Check for deep nesting
    if (metrics.nestingDepth > 3) {
      actions.push({
        location: `${filename}:?`,
        currentZone: "too-chaotic",
        targetZone: "optimal",
        strategy: RefactoringStrategy.REDUCE_NESTING,
        priority: "high",
        estimatedImpact: {
          sophisticationDelta: 15,
          entropyDelta: -10,
          linesChanged: 30,
        },
        codeExample: {
          before: `
if (condition1) {
  if (condition2) {
    if (condition3) {
      if (condition4) {
        // deeply nested logic
      }
    }
  }
}`,
          after: `
if (!condition1) return;
if (!condition2) return;
if (!condition3) return;
if (!condition4) return;
// flat logic`,
          explanation:
            "Early returns reduce nesting and increase sophistication through predictable patterns",
        },
      });
    }

    // Check for high cyclomatic complexity
    if (metrics.cyclomaticComplexity > 20) {
      actions.push({
        location: `${filename}:?`,
        currentZone: "too-chaotic",
        targetZone: "optimal",
        strategy: RefactoringStrategy.NORMALIZE_STRUCTURE,
        priority: "high",
        estimatedImpact: {
          sophisticationDelta: 20,
          entropyDelta: -15,
          linesChanged: 100,
        },
      });
    }

    // Check for low pattern coverage
    if (metrics.patternCoverage < 50) {
      actions.push({
        location: `${filename}:1`,
        currentZone: "too-chaotic",
        targetZone: "optimal",
        strategy: RefactoringStrategy.EXTRACT_PATTERNS,
        priority: "high",
        estimatedImpact: {
          sophisticationDelta: 25,
          entropyDelta: -20,
          linesChanged: lines.length / 3,
        },
        codeExample: {
          before: "// Same logic implemented differently 10 times",
          after: "// Single pattern applied consistently with variations",
          explanation:
            "Extracting patterns dramatically increases sophistication by making structure discoverable",
        },
      });
    }

    // Check for error handling consistency
    const hasErrorHandling = patterns.some((p) => p.type === "Error Handling");
    if (!hasErrorHandling && lines.length > 50) {
      actions.push({
        location: `${filename}:?`,
        currentZone: "too-chaotic",
        targetZone: "optimal",
        strategy: RefactoringStrategy.CONSOLIDATE_ERROR_HANDLING,
        priority: "medium",
        estimatedImpact: {
          sophisticationDelta: 10,
          entropyDelta: -5,
          linesChanged: 20,
        },
      });
    }

    // Check for magic values
    const magicNumberPattern = /\b\d{2,}\b/g;
    const magicNumbers = code.match(magicNumberPattern) || [];
    if (magicNumbers.length > 5) {
      actions.push({
        location: `${filename}:?`,
        currentZone: "too-chaotic",
        targetZone: "optimal",
        strategy: RefactoringStrategy.EXTRACT_CONSTANTS,
        priority: "low",
        estimatedImpact: {
          sophisticationDelta: 5,
          entropyDelta: -5,
          linesChanged: magicNumbers.length,
        },
        codeExample: {
          before: "if (value > 86400000) { ... }",
          after: "const MS_PER_DAY = 86400000;\nif (value > MS_PER_DAY) { ... }",
          explanation: "Named constants increase sophistication by revealing intent",
        },
      });
    }
  }

  return actions;
}

/**
 * Format analysis report as markdown
 */
export function formatReport(report: AnalysisReport): string {
  const { filename, metrics, patterns, issues, summary } = report;

  let md = `# Complextropy Analysis Report\n\n`;
  md += `## File: ${filename}\n\n`;

  // Overall metrics
  md += `### Overall Metrics\n\n`;
  md += `- **Sophistication Score**: ${metrics.sophisticationScore.toFixed(1)}/100\n`;
  md += `- **Entropy Score**: ${metrics.entropyScore.toFixed(1)}/100\n`;
  md += `- **Complextropy Zone**: **${metrics.complextropyZone}**\n`;
  md += `- **Compression Ratio**: ${(metrics.compressionRatio * 100).toFixed(1)}%\n`;
  md += `- **Pattern Coverage**: ${metrics.patternCoverage.toFixed(1)}%\n`;
  md += `- **Cyclomatic Complexity**: ${metrics.cyclomaticComplexity}\n`;
  md += `- **Nesting Depth**: ${metrics.nestingDepth}\n`;
  md += `- **File Size**: ${metrics.fileSize} bytes (${metrics.compressedSize} compressed)\n\n`;

  // Zone visualization
  md += `### Complexity Curve Position\n\n`;
  md += "```\n";
  md += "Low Entropy ───► High Complextropy ───► High Entropy\n";
  md += "(too simple)      (optimal zone)        (too chaotic)\n";
  if (metrics.complextropyZone === "too-simple") {
    md += "    ★ YOU\n";
  } else if (metrics.complextropyZone === "optimal") {
    md += "                       ★ YOU\n";
  } else {
    md += "                                            ★ YOU\n";
  }
  md += "```\n\n";

  // Detected patterns
  if (patterns.length > 0) {
    md += `### Detected Patterns\n\n`;
    for (const pattern of patterns) {
      md += `- **${pattern.type}**: ${pattern.occurrences} occurrences (${pattern.coverage.toFixed(1)}% coverage)\n`;
    }
    md += "\n";
  }

  // Issues found
  if (issues.length > 0) {
    md += `### Issues Found (${issues.length} total)\n\n`;

    for (const issue of issues) {
      md += `#### ${issue.location} - ${issue.strategy}\n\n`;
      md += `**Priority**: ${issue.priority.toUpperCase()}\n`;
      md += `**Current Zone**: ${issue.currentZone}\n`;
      md += `**Target Zone**: ${issue.targetZone}\n`;
      md += `**Estimated Impact**: +${issue.estimatedImpact.sophisticationDelta} sophistication, ${issue.estimatedImpact.entropyDelta} entropy\n\n`;

      if (issue.codeExample) {
        md += `**Before**:\n\`\`\`typescript\n${issue.codeExample.before}\n\`\`\`\n\n`;
        md += `**After**:\n\`\`\`typescript\n${issue.codeExample.after}\n\`\`\`\n\n`;
        md += `**Explanation**: ${issue.codeExample.explanation}\n\n`;
      }

      md += "---\n\n";
    }
  } else {
    md += `### ✅ No Issues Found\n\n`;
    md += `This file is in the optimal complextropy zone. Minor refinements may still improve it, but no major refactoring is needed.\n\n`;
  }

  // Summary
  md += `### Summary\n\n`;
  md += `- **Total Issues**: ${summary.totalIssues}\n`;
  md += `- **Estimated Sophistication Gain**: +${summary.estimatedSophisticationGain.toFixed(1)} points\n`;
  md += `- **Priority**: ${summary.priority.toUpperCase()}\n\n`;

  // Recommendations
  md += `### Recommended Next Steps\n\n`;
  if (summary.priority === "high") {
    md += `This file requires significant refactoring to reach the optimal complextropy zone. Focus on the high-priority issues first.\n\n`;
  } else if (summary.priority === "medium") {
    md += `This file would benefit from moderate refactoring. Address medium-priority issues when convenient.\n\n`;
  } else {
    md += `This file is in good shape. Only minor refinements are suggested.\n\n`;
  }

  // Reference
  md += `---\n\n`;
  md += `**Reference**: Based on Kolmogorov complexity and sophistication theory. See skill.md for details.\n`;

  return md;
}
