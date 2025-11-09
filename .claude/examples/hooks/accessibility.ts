#!/usr/bin/env bun

/**
 * Claude Code hook: Accessibility (a11y) checks
 * Ensures components follow accessibility best practices
 */

import { $ } from "bun";
import { withErrorHandlingSync } from "@/lib/utils/errors";
import { hookLogger } from "@/lib/utils/logger";
import { config, EXIT_CODES } from "./config";

// Types
interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
}

interface A11yIssue {
  type: string;
  severity: "error" | "warning" | "info";
  line: number;
  description: string;
  wcagCriterion?: string;
  suggestion?: string;
}

async function checkWithESLint(filePath: string): Promise<A11yIssue[]> {
  const issues: A11yIssue[] = [];

  try {
    // Check if eslint-plugin-jsx-a11y is available
    const eslintCheck = await $`which eslint`.quiet().nothrow();
    if (eslintCheck.exitCode !== 0) {
      console.log("ℹ️  ESLint not installed - skipping automated a11y checks");
      console.log("   Install: npm install -D eslint eslint-plugin-jsx-a11y");
      return issues;
    }

    // Run eslint with jsx-a11y plugin
    const result = await $`npx eslint ${filePath} --format json`.quiet().nothrow();

    if (result.exitCode !== 0 && result.stdout) {
      try {
        const eslintOutput = JSON.parse(result.stdout.toString());

        if (eslintOutput && eslintOutput.length > 0) {
          const fileResults = eslintOutput[0];

          for (const message of fileResults.messages || []) {
            if (message.ruleId?.startsWith("jsx-a11y/")) {
              issues.push({
                type: message.ruleId,
                severity: message.severity === 2 ? "error" : "warning",
                line: message.line,
                description: message.message,
                suggestion: "See: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y",
              });
            }
          }
        }
      } catch (_e) {
        // Failed to parse, skip
      }
    }
  } catch (_error) {
    // ESLint not available or failed, continue with manual checks
  }

  return issues;
}

function checkManualA11y(_filePath: string, content: string): A11yIssue[] {
  const issues: A11yIssue[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
      continue;
    }

    // Check for images without alt text
    if (config.accessibility.requireAltText) {
      if (trimmed.includes("<img") && !trimmed.includes("alt=")) {
        issues.push({
          type: "missing_alt_text",
          severity: "error",
          line: i + 1,
          description: "Image missing alt attribute",
          wcagCriterion: "WCAG 2.1 Level A (1.1.1)",
          suggestion: 'Add alt="" for decorative images or descriptive alt text',
        });
      }

      // Check for Next.js Image without alt
      if (trimmed.includes("<Image") && !trimmed.includes("alt=")) {
        // Look ahead to see if alt is on next line
        const nextLine = lines[i + 1]?.trim() || "";
        if (!nextLine.includes("alt=")) {
          issues.push({
            type: "missing_alt_text",
            severity: "error",
            line: i + 1,
            description: "Next.js Image missing alt attribute",
            wcagCriterion: "WCAG 2.1 Level A (1.1.1)",
            suggestion: "Add alt prop with descriptive text",
          });
        }
      }
    }

    // Check for buttons without accessible labels
    if (config.accessibility.requireAriaLabels) {
      // Icon-only buttons should have aria-label
      if (
        trimmed.includes("<button") &&
        (trimmed.includes("<Icon") || trimmed.includes("</svg>") || trimmed.includes("icon"))
      ) {
        if (!trimmed.includes("aria-label") && !trimmed.includes("aria-labelledby")) {
          issues.push({
            type: "missing_aria_label",
            severity: "warning",
            line: i + 1,
            description: "Icon button missing aria-label",
            wcagCriterion: "WCAG 2.1 Level A (4.1.2)",
            suggestion: 'Add aria-label="descriptive text" to icon-only buttons',
          });
        }
      }

      // Check for form inputs without labels
      if (trimmed.includes("<input") && !trimmed.includes('type="hidden"')) {
        const hasLabel =
          trimmed.includes("aria-label") ||
          trimmed.includes("aria-labelledby") ||
          trimmed.includes("placeholder") ||
          // Check if previous line has a label
          lines[i - 1]?.includes("<label") ||
          lines[i - 1]?.includes("Label");

        if (!hasLabel) {
          issues.push({
            type: "missing_input_label",
            severity: "warning",
            line: i + 1,
            description: "Form input missing label or aria-label",
            wcagCriterion: "WCAG 2.1 Level A (1.3.1)",
            suggestion: "Add a <label> element or aria-label attribute",
          });
        }
      }
    }

    // Check for keyboard navigation support
    if (config.accessibility.checkKeyboardNav) {
      // onClick on divs/spans should have onKeyDown
      if ((trimmed.includes("<div") || trimmed.includes("<span")) && trimmed.includes("onClick")) {
        if (!trimmed.includes("onKeyDown") && !trimmed.includes("onKeyPress")) {
          issues.push({
            type: "missing_keyboard_handler",
            severity: "warning",
            line: i + 1,
            description: "onClick on non-interactive element without keyboard handler",
            wcagCriterion: "WCAG 2.1 Level A (2.1.1)",
            suggestion: "Add onKeyDown handler or use a <button> element",
          });
        }

        // Should also have role and tabIndex
        if (!trimmed.includes("role=") || !trimmed.includes("tabIndex")) {
          issues.push({
            type: "missing_role_tabindex",
            severity: "warning",
            line: i + 1,
            description: "Interactive element missing role or tabIndex",
            wcagCriterion: "WCAG 2.1 Level A (4.1.2)",
            suggestion: 'Add role="button" and tabIndex={0}',
          });
        }
      }
    }

    // Check for missing lang attribute on html element (if present)
    if (trimmed.includes("<html") && !trimmed.includes("lang=")) {
      issues.push({
        type: "missing_lang",
        severity: "warning",
        line: i + 1,
        description: "HTML element missing lang attribute",
        wcagCriterion: "WCAG 2.1 Level A (3.1.1)",
        suggestion: 'Add lang="en" or appropriate language code',
      });
    }

    // Check for color-only information
    if (trimmed.match(/color:\s*['"]?(red|green)/i) && !trimmed.includes("aria")) {
      issues.push({
        type: "color_only_info",
        severity: "info",
        line: i + 1,
        description: "Possible color-only information conveyance",
        wcagCriterion: "WCAG 2.1 Level A (1.4.1)",
        suggestion: "Don't rely on color alone - add text, icons, or patterns",
      });
    }

    // Check for autoplay video/audio
    if (trimmed.includes("<video") || trimmed.includes("<audio")) {
      if (trimmed.includes("autoPlay") || trimmed.includes("autoplay")) {
        issues.push({
          type: "autoplay_media",
          severity: "warning",
          line: i + 1,
          description: "Autoplaying media can be disorienting",
          wcagCriterion: "WCAG 2.1 Level A (1.4.2)",
          suggestion: "Remove autoPlay or provide controls to pause",
        });
      }
    }

    // Check for heading hierarchy (simplified)
    const headingMatch = trimmed.match(/<h([1-6])/);
    if (headingMatch) {
      const level = Number.parseInt(headingMatch[1], 10);

      // This is very simplified - proper check would track hierarchy
      if (level > 3 && i > 0) {
        issues.push({
          type: "heading_hierarchy",
          severity: "info",
          line: i + 1,
          description: `Using h${level} - ensure heading hierarchy is logical`,
          wcagCriterion: "WCAG 2.1 Level AA (1.3.1)",
          suggestion: "Headings should not skip levels (h1 -> h2 -> h3)",
        });
      }
    }

    // Check for links with vague text
    if (trimmed.includes(">click here<") || trimmed.includes(">read more<")) {
      issues.push({
        type: "vague_link_text",
        severity: "info",
        line: i + 1,
        description: "Link text not descriptive ('click here', 'read more')",
        wcagCriterion: "WCAG 2.1 Level A (2.4.4)",
        suggestion: "Use descriptive link text that makes sense out of context",
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

    // Only run on React/JSX files
    if (!filePath || (!filePath.endsWith(".tsx") && !filePath.endsWith(".jsx"))) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.accessibility.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running accessibility checks");
    console.log(`♿ Running accessibility checks on ${filePath}...`);

    const content = await Bun.file(filePath).text();

    // Run both ESLint and manual checks
    const eslintIssues = await checkWithESLint(filePath);
    const manualIssues = checkManualA11y(filePath, content);

    const allIssues = [...eslintIssues, ...manualIssues];

    // Deduplicate issues by line and type
    const uniqueIssues = allIssues.filter(
      (issue, index, self) =>
        index === self.findIndex((i) => i.line === issue.line && i.type === issue.type),
    );

    // Categorize
    const errors = uniqueIssues.filter((i) => i.severity === "error");
    const warnings = uniqueIssues.filter((i) => i.severity === "warning");
    const info = uniqueIssues.filter((i) => i.severity === "info");

    hookLogger.info(
      {
        file_path: filePath,
        total_issues: uniqueIssues.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      },
      "Accessibility checks completed",
    );

    // Report issues
    if (errors.length > 0) {
      console.log("");
      console.log(`❌ ERRORS (${errors.length}):`);
      for (const issue of errors) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        if (issue.wcagCriterion) {
          console.log(`   📖 ${issue.wcagCriterion}`);
        }
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
      console.log(`ℹ️  INFO: ${info.length} accessibility suggestions`);
    }

    if (errors.length > 0 && config.accessibility.failOnViolations) {
      console.log("");
      console.log("❌ Accessibility checks failed. Please fix the errors above.");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (uniqueIssues.length === 0) {
      console.log("✅ No accessibility issues detected");
    } else if (errors.length === 0) {
      console.log("✅ Accessibility checks passed (warnings only)");
    } else {
      console.log("✅ Accessibility checks passed (non-blocking mode)");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during accessibility checks");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
