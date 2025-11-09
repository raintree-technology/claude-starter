# Performance Optimizer Skill

Analyzes code for performance bottlenecks and provides specific optimization recommendations.

## Description

Use when analyzing code for performance bottlenecks, optimizing slow queries, reducing memory usage, or improving application speed. Identifies N+1 queries, inefficient algorithms, and caching opportunities.

## Installation

### Personal Installation
```bash
cp -r . ~/.claude/skills/performance-optimizer
```

### Project Installation
```bash
# Already in .claude/skills/ - commit to git
git add .claude/skills/performance-optimizer
git commit -m "Add performance-optimizer skill"
```

## Usage

This skill is automatically invoked when you mention performance issues:

```
"Why is this endpoint slow?"
"Optimize this code for better performance"
"Find performance bottlenecks in the application"
"This query is taking too long"
```

## What It Analyzes

- **Database Queries**: N+1 problems, missing indexes, inefficient joins
- **Algorithms**: Time complexity (O(n²) → O(n log n))
- **Memory**: Leaks, unnecessary allocations
- **Caching**: Opportunities for Redis, in-memory caching
- **Frontend**: Re-renders, bundle size, lazy loading
- **API Calls**: Batching, parallelization

## Example Output

```
🔴 Critical: N+1 Query Pattern
Location: api/users.js:15-19
Current: 101 queries for 100 users
Expected: 2 queries total
Impact: ~50x faster

Fix: Use eager loading with include
```

## Configuration

Edit `SKILL.md` to customize:
- Allowed tools (currently: Read, Grep, Glob, Bash)
- Model preference (currently: Sonnet)
- Focus areas

## Testing

Test with performance-related requests:

1. "Analyze this function for performance issues"
2. "Why is this database query slow?"
3. "Optimize this React component"
4. "Find memory leaks in this code"

## Troubleshooting

### Skill not invoked automatically

Try being more specific:
- "Use the performance-optimizer skill to analyze this code"
- Include words like "slow", "optimize", "performance", "bottleneck"

### Need actual metrics

Provide profiling data or execution times for better analysis

## Files

- `SKILL.md` - Main skill definition with instructions
- `README.md` - This file

## License

MIT
