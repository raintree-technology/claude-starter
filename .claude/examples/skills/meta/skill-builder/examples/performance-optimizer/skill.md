---
name: performance-optimizer
description: Use when analyzing code for performance bottlenecks, optimizing slow queries, reducing memory usage, or improving application speed. Identifies N+1 queries, inefficient algorithms, and caching opportunities.
allowed-tools: Read, Grep, Glob, Bash
model: sonnet
---

# Performance Optimizer Skill

## Purpose

Analyzes code for performance issues and provides optimization recommendations including:
- Database query optimization
- Algorithm efficiency improvements
- Memory usage reduction
- Caching strategies
- Lazy loading opportunities

## When to Use

This skill should be invoked when:
- Application is running slowly
- High memory consumption detected
- Database queries taking too long
- Need to optimize before scaling
- Performance regression after changes
- Preparing for production deployment

## Process

1. **Identify Bottlenecks**
   - Profile critical code paths
   - Analyze database queries
   - Check loop efficiency
   - Review memory allocations
   - Examine API calls

2. **Analyze Root Causes**
   - N+1 query problems
   - Missing database indexes
   - Inefficient algorithms (O(n²) vs O(n log n))
   - Unnecessary re-renders (React/Vue)
   - Large bundle sizes
   - Synchronous blocking operations

3. **Recommend Optimizations**
   - Add database indexes
   - Implement query batching
   - Use more efficient algorithms
   - Add caching (Redis, memory)
   - Implement lazy loading
   - Use pagination
   - Optimize images/assets

4. **Estimate Impact**
   - High impact: 10x+ improvement
   - Medium impact: 2-10x improvement
   - Low impact: <2x improvement

## Output Format

### Performance Analysis Report

**🔴 Critical Issues (High Impact)**
- [Location] - [Issue description]
  - Current: [performance metric]
  - Expected: [improved metric]
  - Fix: [specific solution]

**🟡 Optimization Opportunities (Medium Impact)**
- [Location] - [Issue description]
  - Impact: [estimated improvement]
  - Fix: [specific solution]

**🟢 Minor Improvements (Low Impact)**
- [Location] - [Issue description]
  - Fix: [specific solution]

**📊 Metrics**
- Queries analyzed: X
- Potential speedup: Xx
- Memory reduction: X%

## Best Practices

- Profile before optimizing (measure first)
- Focus on high-impact changes first
- Consider readability vs performance tradeoffs
- Test optimizations with realistic data
- Monitor production metrics
- Document why optimizations were made

## Examples

### Example 1: N+1 Query Detection

**Input**: "Why is this API endpoint slow?"

**Analysis**:
```javascript
// BEFORE: N+1 query problem
async function getUsers() {
  const users = await User.findAll();
  for (const user of users) {
    user.posts = await Post.findAll({ userId: user.id });
  }
  return users;
}
```

**Output**:
```
🔴 Critical: N+1 Query Pattern
Location: api/users.js:15-19
Current: 1 + N queries (101 queries for 100 users)
Expected: 2 queries total
Impact: ~50x faster with large datasets

Fix:
async function getUsers() {
  const users = await User.findAll({
    include: [{ model: Post }]
  });
  return users;
}
```

### Example 2: Algorithm Optimization

**Input**: "This search is too slow"

**Analysis**:
```javascript
// BEFORE: O(n²) nested loop
function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) duplicates.push(arr[i]);
    }
  }
  return duplicates;
}
```

**Output**:
```
🟡 Medium Impact: Inefficient Algorithm
Location: utils/search.js:23-30
Current: O(n²) - 10,000ms for 1000 items
Expected: O(n) - 10ms for 1000 items
Impact: 1000x faster

Fix:
function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of arr) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return Array.from(duplicates);
}
```

### Example 3: React Re-render Optimization

**Input**: "Component re-renders too often"

**Analysis**:
```jsx
// BEFORE: Creates new object every render
function UserList({ users }) {
  const config = { sortBy: 'name', order: 'asc' };
  return <Table data={users} config={config} />;
}
```

**Output**:
```
🟢 Low Impact: Unnecessary Re-renders
Location: components/UserList.jsx:12-14
Impact: Reduces re-renders by ~60%

Fix:
const config = { sortBy: 'name', order: 'asc' };
function UserList({ users }) {
  return <Table data={users} config={config} />;
}
// Or use useMemo if config needs to be computed
```

## Error Handling

- **No performance issues found**: Confirm with profiling data
- **Need metrics**: Request actual performance measurements
- **Optimization premature**: Advise profiling first
- **Breaking change risk**: Warn about potential issues

## Notes

- Always profile before and after optimizations
- Consider tradeoffs: speed vs readability vs maintenance
- Some optimizations are language/framework specific
- Database optimizations often have highest impact
- Don't optimize without measuring
- Production data may differ from development
