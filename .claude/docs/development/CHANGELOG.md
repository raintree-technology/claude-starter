# Changelog

All notable changes to the Claude Starter Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-07

### Added

#### Plugin Infrastructure
- Plugin manifest (`.claude-plugin/plugin.json`) for marketplace distribution
- Marketplace configuration for easy installation
- Project memory file (`CLAUDE.md`) with architecture patterns and workflow guidance
- Comprehensive README with installation methods and usage examples
- MIT License
- Contributing guidelines
- Plugin development guide

#### Agents (8 total)
- **api-builder**: Next.js API route specialist with rate limiting, caching, and validation patterns
- **database-architect**: Database schema and Drizzle ORM specialist
- **security-auditor**: Proactive security scanning for PII leaks and vulnerabilities
- **type-generator**: TypeScript type management and Supabase sync specialist
- **writer**: Content writing specialist following Gwern's principles
- **use-effect-less**: React 19 refactor specialist for removing unnecessary useEffect
- **plaid-expert**: Plaid integration specialist for banking data
- **general-purpose**: Complex multi-step task automation

#### Skills (44 total)
- **Next.js** (8 skills): App Router, API architect, cache architect, config optimization, data rendering, pages router, streaming, Next.js 16 audit
- **React** (2 skills): Server components, form actions architect
- **Stripe** (11 skills): API integration, billing/subscriptions, Connect, payments, terminal/issuing, webhooks
- **Supabase** (2 skills): Expert with guides, patterns specialist
- **D3** (5 skills): Core data, geo, interaction/animation, layouts/hierarchies, shapes/paths
- **Bun** (5 skills): Runtime, bundler, package manager, quickstart, test
- **Aptos** (5 skills): dApp builder, deployment expert, indexer architect, Move architect, TS SDK expert
- **Other**: Resend email, Shelby media, QC complextropy, clarity-dal-architect, skill-builder

#### Quality Hooks (9 total)
- **check_after_edit**: TypeScript type checking, lint, format validation
- **import_organization**: Unused imports detection and auto-sorting
- **bundle_size_check**: File size monitoring with thresholds
- **security_scan**: Hardcoded secrets, XSS, injection pattern detection
- **code_quality**: Complexity analysis, function length, utility reimplementation detection
- **architecture_check**: Layer boundaries, naming conventions, type import enforcement
- **react_quality**: Props validation, hook dependencies, performance patterns
- **accessibility**: WCAG compliance checking
- **advanced_analysis**: Memory leaks, race conditions, caching pattern validation

#### Slash Commands (5 existing + 3 new = 8 total)
- `/build-safe`: Full validation pipeline (typecheck, lint, build)
- `/clear-cache`: Clear Next.js cache
- `/db-migrate`: Run database migrations
- `/sync-types`: Sync Supabase types
- `/use-effect-less`: Refactor unnecessary useEffect
- `/health-check`: NEW - Comprehensive project health verification
- `/review-pr`: NEW - Thorough pull request review
- `/new-agent`: NEW - Interactive agent creation

#### Documentation
- Quick reference guide for commands and agents
- Complete Claude Code documentation mirror (40+ docs)
- Agent reference documentation for all specialized agents
- Hook configuration guide with examples
- Installation and verification scripts

### Infrastructure
- Project Infrastructure validation in hooks (enforce centralized types, utils, caching)
- Configurable quality thresholds via `config.ts`
- Parallel execution support for faster checks
- Detailed error messages with file locations and suggestions

### Changed
- Enhanced agent descriptions with "PROACTIVELY use" phrases for better auto-invocation
- Improved hook output formatting with emojis and clear sections
- Consolidated settings with comprehensive hooks configuration

### Security
- Security scanning for 15+ vulnerability patterns
- PII detection and prevention
- Unsafe pattern detection (eval, innerHTML, etc.)
- Severity-based blocking (critical/high/medium/low)

## [Unreleased]

### Planned
- GitHub Actions workflow for automated testing
- Additional agents for GraphQL, gRPC, WebSocket patterns
- More framework-specific skills (Vue, Svelte, Angular)
- Performance profiling hook
- Database query optimization hook
- Bundle analysis integration
- Visual regression testing hook

---

[1.0.0]: https://github.com/raintree-technology/claude-starter/releases/tag/v1.0.0
