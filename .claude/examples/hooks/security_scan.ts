#!/usr/bin/env bun

/**
 * Claude Code hook: Security scanning
 * Detects hardcoded secrets, unsafe patterns, and security issues
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

interface SecurityIssue {
  type: "secret" | "unsafe" | "console" | "dangerous_html";
  severity: "critical" | "high" | "medium" | "low";
  line: number;
  content: string;
  description: string;
}

// Security patterns to detect
const PATTERNS = {
  // Hardcoded secrets (high severity)
  secrets: [
    {
      regex: /(?:api[_-]?key|apikey|access[_-]?key)\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/gi,
      description: "Potential hardcoded API key",
    },
    {
      regex: /(?:secret|password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
      description: "Potential hardcoded password/secret",
    },
    {
      regex: /(?:token|auth[_-]?token)\s*[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
      description: "Potential hardcoded auth token",
    },
    {
      regex: /(?:sk|pk)[_-][a-zA-Z0-9]{20,}/gi,
      description: "Potential Stripe/Payment key",
    },
    {
      regex: /(?:AKIA|A3T|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      description: "Potential AWS Access Key",
    },
    {
      regex: /ghp_[a-zA-Z0-9]{36}/g,
      description: "GitHub Personal Access Token",
    },
    {
      regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
      description: "Slack Token",
    },
  ],

  // Unsafe patterns (high/medium severity)
  unsafe: [
    {
      regex: /eval\s*\(/g,
      description: "Use of eval() - potential code injection risk",
      severity: "high" as const,
    },
    {
      regex: /Function\s*\(\s*['"`].*['"`]\s*\)/g,
      description: "Dynamic Function constructor - potential code injection",
      severity: "high" as const,
    },
    {
      regex: /innerHTML\s*=/g,
      description: "Direct innerHTML assignment - XSS risk (use textContent or sanitize)",
      severity: "medium" as const,
    },
    {
      regex: /document\.write\s*\(/g,
      description: "Use of document.write() - XSS risk",
      severity: "medium" as const,
    },
    {
      regex: /exec\s*\(/g,
      description: "Use of exec() - potential command injection",
      severity: "high" as const,
    },
  ],

  // Dangerous HTML (medium severity)
  dangerousHtml: [
    {
      regex: /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:\s*(?!DOMPurify\.sanitize)/g,
      description: "dangerouslySetInnerHTML without DOMPurify sanitization",
    },
  ],

  // Console statements (low severity - often legitimate in dev)
  console: [
    {
      regex: /console\.(log|debug|info|warn|error)\s*\(/g,
      description: "Console statement (may leak sensitive data in production)",
    },
  ],
};

async function scanFile(filePath: string): Promise<SecurityIssue[]> {
  const issues: SecurityIssue[] = [];

  try {
    const content = await Bun.file(filePath).text();
    const lines = content.split("\n");

    // Skip common safe patterns
    const isSafeContext = (line: string): boolean => {
      return (
        line.trim().startsWith("//") ||
        line.trim().startsWith("*") ||
        line.includes("example") ||
        line.includes("test") ||
        line.includes("placeholder")
      );
    };

    // Check for hardcoded secrets
    if (config.security.checks.hardcodedSecrets) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSafeContext(line)) continue;

        for (const pattern of PATTERNS.secrets) {
          if (pattern.regex.test(line)) {
            issues.push({
              type: "secret",
              severity: "critical",
              line: i + 1,
              content: line.trim(),
              description: pattern.description,
            });
          }
        }
      }
    }

    // Check for unsafe patterns
    if (config.security.checks.unsafePatterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSafeContext(line)) continue;

        for (const pattern of PATTERNS.unsafe) {
          if (pattern.regex.test(line)) {
            issues.push({
              type: "unsafe",
              severity: pattern.severity,
              line: i + 1,
              content: line.trim(),
              description: pattern.description,
            });
          }
        }
      }
    }

    // Check for dangerous HTML
    if (config.security.checks.dangerousHtml) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSafeContext(line)) continue;

        for (const pattern of PATTERNS.dangerousHtml) {
          if (pattern.regex.test(line)) {
            issues.push({
              type: "dangerous_html",
              severity: "medium",
              line: i + 1,
              content: line.trim(),
              description: pattern.description,
            });
          }
        }
      }
    }

    // Check for console statements
    if (config.security.checks.consoleStatements) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isSafeContext(line)) continue;

        for (const pattern of PATTERNS.console) {
          if (pattern.regex.test(line)) {
            issues.push({
              type: "console",
              severity: "low",
              line: i + 1,
              content: line.trim(),
              description: pattern.description,
            });
          }
        }
      }
    }
  } catch (error) {
    hookLogger.error({ error, file_path: filePath }, "Failed to scan file");
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

    // Run on all code files
    if (!filePath || !shouldCheckFile(filePath, config.patterns.allCode)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    if (!config.security.enabled) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    hookLogger.info({ tool_name, file_path: filePath }, "Running security scan");
    console.log(`🔒 Running security scan on ${filePath}...`);

    const issues = await scanFile(filePath);

    // Categorize issues by severity
    const critical = issues.filter((i) => i.severity === "critical");
    const high = issues.filter((i) => i.severity === "high");
    const medium = issues.filter((i) => i.severity === "medium");
    const low = issues.filter((i) => i.severity === "low");

    hookLogger.info(
      {
        file_path: filePath,
        issues_count: issues.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
      },
      "Security scan completed",
    );

    // Report findings
    let hasBlockingIssues = false;

    if (critical.length > 0) {
      console.log("");
      console.log(`🚨 CRITICAL (${critical.length} issues):`);
      for (const issue of critical.slice(0, 3)) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        console.log(`   → ${issue.content.slice(0, 80)}...`);
      }
      if (config.security.failOnCritical) {
        hasBlockingIssues = true;
      }
    }

    if (high.length > 0) {
      console.log("");
      console.log(`⚠️  HIGH (${high.length} issues):`);
      for (const issue of high.slice(0, 3)) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
      }
      if (config.security.failOnHigh) {
        hasBlockingIssues = true;
      }
    }

    if (medium.length > 0 && config.security.warnOnMedium) {
      console.log("");
      console.log(`⚠️  MEDIUM (${medium.length} issues):`);
      for (const issue of medium.slice(0, 2)) {
        console.log(`   Line ${issue.line}: ${issue.description}`);
      }
    }

    if (low.length > 0) {
      console.log(`ℹ️  INFO: ${low.length} low-severity issues found`);
    }

    if (hasBlockingIssues) {
      console.log("");
      console.log("❌ Security scan failed. Please address critical/high issues above.");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    if (issues.length === 0) {
      console.log("✅ No security issues detected");
    } else {
      console.log("✅ Security scan passed (no blocking issues)");
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    hookLogger.error({ error }, "Unexpected error during security scan");
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
