#!/usr/bin/env node

/**
 * Claude Code hook: Gwern Writing Checklist
 * Comprehensive writing quality checker following Gwern's essay finishing process
 * Runs after editing or writing content files (blog posts, newsletters, encyclopedia entries)
 */

import * as fs from "node:fs";

// Types
interface WritingIssue {
  type: "syntax" | "reference" | "language" | "content" | "technical";
  severity: "critical" | "warning" | "suggestion";
  location: string;
  description: string;
  fix: string;
  line?: number;
}

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  CHECK_FAILURE: 1,
  CONFIG_ERROR: 2,
  UNEXPECTED_ERROR: 3,
};

// Main execution
function main() {
  try {
    const stdinText = fs.readFileSync(0, "utf-8"); // Read from stdin
    const input = JSON.parse(stdinText);

    if (!input) {
      process.exit(EXIT_CODES.CONFIG_ERROR);
    }

    const { tool_input } = input;
    const filePath = tool_input.file_path;

    // Only run on content files
    if (!filePath || !filePath.match(/\.(md|mdx|txt)$/)) {
      process.exit(EXIT_CODES.SUCCESS);
    }

    console.log(`📝 Gwern writing checklist...`);

    const content = fs.readFileSync(filePath, "utf-8");
    const issues: WritingIssue[] = [];

    const lines = content.split("\n");

    // SYNTAX CHECKS
    // Check for balanced brackets, quotes, and parentheses
    const bracketCount = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;
    const parenCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;

    if (bracketCount !== 0)
      issues.push({
        type: "syntax",
        severity: "critical",
        location: filePath,
        description: "Unbalanced square brackets found",
        fix: "Check for missing [ or ] brackets",
      });

    if (parenCount !== 0)
      issues.push({
        type: "syntax",
        severity: "critical",
        location: filePath,
        description: "Unbalanced parentheses found",
        fix: "Check for missing ( or ) parentheses",
      });

    // Check for common syntax errors
    const syntaxErrors = [
      { pattern: /\(www/, description: "Malformed link: (www" },
      { pattern: /www\)/, description: "Malformed link: www)" },
      { pattern: /\[http/, description: "Malformed link: [http" },
      { pattern: /http\]/, description: "Malformed link: http]" },
      { pattern: /<!--/, description: "Unclosed HTML comment" },
      { pattern: /-->/, description: "HTML comment end without start" },
    ];

    syntaxErrors.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        issues.push({
          type: "syntax",
          severity: "critical",
          location: filePath,
          description,
          fix: "Fix the malformed markup",
        });
      }
    });

    // LANGUAGE QUALITY CHECKS
    // Check for adverbs (basic detection)
    const adverbMatches = content.match(/\b\w+ly\b/gi) || [];
    const commonAdverbs = [
      "very",
      "really",
      "quite",
      "extremely",
      "totally",
      "absolutely",
      "completely",
    ];
    const badAdverbs = adverbMatches.filter((word: string) =>
      commonAdverbs.includes(word.toLowerCase().replace("ly", "")),
    );

    if (badAdverbs.length > 0) {
      issues.push({
        type: "language",
        severity: "warning",
        location: filePath,
        description: `Found ${badAdverbs.length} potentially unnecessary adverbs: ${badAdverbs.slice(0, 3).join(", ")}`,
        fix: 'Consider removing adverbs like "very", "really", "quite" - they often weaken writing',
      });
    }

    // Check for passive voice indicators (basic)
    const passiveIndicators = content.match(/\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi) || [];
    if (passiveIndicators.length > 2) {
      issues.push({
        type: "language",
        severity: "suggestion",
        location: filePath,
        description: `Found ${passiveIndicators.length} potential passive voice constructions`,
        fix: 'Consider using active voice: "The boy hit the ball" instead of "The ball was hit by the boy"',
      });
    }

    // Check sentence length (basic)
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const longSentences = sentences.filter((s: string) => s.split(" ").length > 35);
    if (longSentences.length > 0) {
      issues.push({
        type: "language",
        severity: "suggestion",
        location: filePath,
        description: `${longSentences.length} sentences are longer than 35 words`,
        fix: "Consider breaking long sentences into shorter ones for better readability",
      });
    }

    // TECHNICAL VALIDATION
    // Check line lengths
    const longLines = lines.filter((line: string) => {
      const cleanLine = line.replace(/^#+\s*/, ""); // Remove markdown headers
      return cleanLine.length > 100;
    });

    if (longLines.length > 0) {
      issues.push({
        type: "technical",
        severity: "warning",
        location: filePath,
        description: `${longLines.length} lines exceed 100 characters`,
        fix: "Break long lines for better readability, especially in code blocks",
      });
    }

    // CONTENT TYPE SPECIFIC CHECKS
    const isBlogPost = filePath.includes("/blog/") || filePath.includes("blog-posts");
    const isNewsletter = filePath.includes("/newsletter/") || filePath.includes("newsletters");
    const isEncyclopedia = filePath.includes("/encyclopedia/") || filePath.includes("encyclopedia");

    if (isBlogPost) {
      // Check for title
      if (!lines[0] || !lines[0].match(/^#\s/)) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Blog post should start with a level 1 header (# Title)",
          fix: "Add a compelling title as the first line with # ",
        });
      }

      // Check for frontmatter
      if (!content.startsWith("---")) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description:
            "Blog post should have frontmatter with metadata (title, date, author, tags)",
          fix: "Add frontmatter at the top with title, date, author, tags, and description",
        });
      }

      // Check word count (rough estimate)
      const wordCount = content.split(/\s+/).length;
      if (wordCount < 300) {
        issues.push({
          type: "content",
          severity: "suggestion",
          location: filePath,
          description: `Blog post is only ~${wordCount} words`,
          fix: "Consider expanding to 500+ words for better engagement, or keep under 300 for punchy posts",
        });
      }

      // Check for subheaders
      const subheaders = content.match(/^##+\s/gm) || [];
      if (subheaders.length < 2) {
        issues.push({
          type: "content",
          severity: "suggestion",
          location: filePath,
          description: "Blog post should have multiple subheaders for scannability",
          fix: "Add H2/H3 headers to break up content into logical sections",
        });
      }

      // Check for compelling hook (first paragraph)
      const firstParagraph = content.split("\n\n")[1] || "";
      if (firstParagraph.length < 100) {
        issues.push({
          type: "content",
          severity: "suggestion",
          location: filePath,
          description: "First paragraph should hook the reader immediately",
          fix: "Strengthen the opening paragraph with a compelling problem, question, or insight",
        });
      }
    }

    if (isNewsletter) {
      // Check for newsletter structure
      if (!content.includes("---") && !content.includes("Subject:")) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Newsletter should have clear subject line and structure",
          fix: "Add frontmatter with subject, or clear subject line at top",
        });
      }

      // Check for personal greeting
      if (!content.match(/\bHey\b|\bHi\b|\bHello\b|\bDear\b/i)) {
        issues.push({
          type: "content",
          severity: "suggestion",
          location: filePath,
          description: "Newsletter should start with a personal greeting",
          fix: 'Add a friendly greeting like "Hey [Name]," or "Hello friends,"',
        });
      }

      // Check for call-to-action
      if (!content.match(/\breply\b|\bemail\b|\bvisit\b|\bclick\b|\bshare\b/i)) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Newsletter should include a clear call-to-action",
          fix: "Add a specific action for readers to take (reply, visit link, share, etc.)",
        });
      }

      // Check length (newsletters should be concise)
      const wordCount = content.split(/\s+/).length;
      if (wordCount > 1000) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: `Newsletter is ${wordCount} words - consider shortening`,
          fix: "Keep newsletters under 800 words for better engagement",
        });
      }
    }

    if (isEncyclopedia) {
      // Check for encyclopedia structure
      if (!content.match(/^\s*#\s/) && !content.match(/^---/m)) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Encyclopedia entry should have title and metadata",
          fix: "Add title header and frontmatter with description, tags, etc.",
        });
      }

      // Check for comprehensive structure
      const hasDefinition = content.match(/\bdefinition\b|\boverview\b|\bintroduction\b/i);
      const hasReferences = content.match(/\bReferences\b|\bSources\b|\bCitations\b/i);
      const hasSeeAlso = content.match(/\bSee Also\b|\bRelated\b|\bFurther Reading\b/i);

      if (!hasDefinition) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Encyclopedia entry should start with a clear definition or overview",
          fix: 'Add a "Definition" or "Overview" section at the beginning',
        });
      }

      if (!hasReferences) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Encyclopedia entry should include references and citations",
          fix: 'Add a "References" section with properly formatted citations',
        });
      }

      if (!hasSeeAlso) {
        issues.push({
          type: "content",
          severity: "suggestion",
          location: filePath,
          description: "Encyclopedia entry should link to related topics",
          fix: 'Add a "See Also" section with links to related entries',
        });
      }

      // Check for neutral tone (avoid first person)
      const firstPersonWords = content.match(/\bI\b|\bwe\b|\bmy\b|\bour\b/gi) || [];
      if (firstPersonWords.length > 2) {
        issues.push({
          type: "content",
          severity: "warning",
          location: filePath,
          description: "Encyclopedia entries should maintain neutral, factual tone",
          fix: "Replace first-person language with objective descriptions",
        });
      }
    }

    // REPORTING
    const critical = issues.filter((i) => i.severity === "critical");
    const warnings = issues.filter((i) => i.severity === "warning");
    const suggestions = issues.filter((i) => i.severity === "suggestion");

    if (issues.length > 0) {
      console.log(`\n📝 Gwern Writing Checklist Results for ${filePath}:`);
      console.log(`Found ${issues.length} issue${issues.length === 1 ? "" : "s"}\n`);

      if (critical.length > 0) {
        console.log("🚨 CRITICAL ISSUES (Must Fix):");
        critical.forEach((issue) => {
          console.log(`  • ${issue.description}`);
          console.log(`    Fix: ${issue.fix}\n`);
        });
      }

      if (warnings.length > 0) {
        console.log("⚠️  WARNINGS (Should Fix):");
        warnings.forEach((issue) => {
          console.log(`  • ${issue.description}`);
          console.log(`    Fix: ${issue.fix}\n`);
        });
      }

      if (suggestions.length > 0) {
        console.log("💡 SUGGESTIONS (Consider):");
        suggestions.forEach((issue) => {
          console.log(`  • ${issue.description}`);
          console.log(`    Fix: ${issue.fix}\n`);
        });
      }

      console.log("✨ Remember: Object then action. Get rid of needless words. Write simply.");
    } else {
      console.log("✅ No writing issues found");
    }

    if (critical.length > 0) {
      console.log("");
      console.log("❌ Gwern writing checklist failed");
      process.exit(EXIT_CODES.CHECK_FAILURE);
    }

    console.log("✅ Gwern writing checklist passed");
    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

main();
