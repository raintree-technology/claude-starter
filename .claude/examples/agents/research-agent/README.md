# Research Agent

> **Production-grade agent prompts from Anthropic demonstrating advanced OODA loop patterns, multi-agent orchestration, and parallel research strategies.**

## Overview

The Research Agent is a sophisticated multi-agent system extracted from Anthropic's Claude Cookbooks. It demonstrates enterprise-grade patterns for decomposing complex research questions, orchestrating parallel subagents, and synthesizing comprehensive reports.

## What This Example Demonstrates

### 1. **OODA Loop Pattern** (Observe-Orient-Decide-Act)
- Systematic breakdown of research questions
- Query type classification (depth-first, breadth-first, straightforward)
- Dynamic plan adaptation based on findings
- Efficient subagent allocation

### 2. **Query Classification Intelligence**
Three query types with tailored strategies:

- **Depth-First**: Multi-perspective analysis of a single topic
  - Example: "What are the most effective treatments for depression?"
  - Strategy: Parallel agents exploring different viewpoints

- **Breadth-First**: Independent sub-questions requiring distinct research
  - Example: "Compare economic systems of three Nordic countries"
  - Strategy: One agent per independent sub-topic

- **Straightforward**: Simple fact-finding
  - Example: "What is the current population of Tokyo?"
  - Strategy: Single focused investigation

### 3. **Intelligent Subagent Scaling**
- **Simple queries**: 1 subagent
- **Standard complexity**: 2-3 subagents
- **Medium complexity**: 3-5 subagents
- **High complexity**: 5-10 subagents (max 20)
- Prevents over-delegation and optimizes for efficiency

### 4. **Parallel Tool Call Optimization**
- Maximizes parallelization where possible
- Dependency-aware scheduling
- Batch operations for efficiency
- Progressive synthesis of results

### 5. **Source Quality Evaluation**
- Multiple source verification
- Credibility assessment
- Temporal relevance checking
- Citation quality analysis

## Directory Structure

```
research-agent/
├── prompts/
│   ├── research-lead-agent.md      # Main orchestrator (4,000+ lines)
│   └── research-subagent.md        # Worker agent (1,000+ lines)
├── docs/
│   └── patterns-explained.md       # Pattern tutorials (you can add this)
└── README.md                       # This file
```

## How to Use

### As a Learning Resource

1. **Study the OODA loop**: Read `research-lead-agent.md` lines 1-70 for the research process
2. **Understand query classification**: Lines 12-29 explain depth-first vs breadth-first vs straightforward
3. **Learn subagent scaling**: Lines 71-87 detail the scaling guidelines
4. **Explore delegation patterns**: Lines 89-100+ cover deployment strategies
5. **Review subagent capabilities**: Read `research-subagent.md` to understand worker responsibilities

### To Adapt for Your Domain

The research agent is generalizable but can be specialized:

**For Technical Documentation**:
```markdown
Query types:
- Depth-first: "Explain how authentication works in this system"
- Breadth-first: "Document all API endpoints"
- Straightforward: "What database does this use?"
```

**For Competitive Analysis**:
```markdown
Query types:
- Depth-first: "What makes competitor X successful?"
- Breadth-first: "Compare top 5 competitors across key metrics"
- Straightforward: "Who is our closest competitor?"
```

**For Legal Research**:
```markdown
Query types:
- Depth-first: "What are the legal implications of this contract clause?"
- Breadth-first: "Research precedents across all applicable jurisdictions"
- Straightforward: "What is the statute of limitations for this?"
```

### To Activate in Your Project

To use this research system:

1. **Create agent files**:
   ```bash
   # Copy research lead agent
   cp .claude/examples/agents/research-agent/prompts/research-lead-agent.md \
      .claude/agents/research-lead.md

   # Copy research subagent
   cp .claude/examples/agents/research-agent/prompts/research-subagent.md \
      .claude/agents/research-subagent.md
   ```

2. **Customize for your domain** (optional):
   - Add domain-specific query type examples
   - Include specialized source preferences
   - Define industry-specific quality criteria

3. **Invoke the research lead**:
   ```bash
   # Via Claude Code
   "Research: What are the best practices for scaling Next.js applications?"

   # The lead agent will:
   # 1. Classify query type (likely breadth-first)
   # 2. Create research plan
   # 3. Deploy subagents in parallel
   # 4. Synthesize comprehensive report
   ```

## Key Patterns to Learn

### Pattern 1: Query Type Classification

The agent classifies questions to optimize research strategy:

```markdown
# Depth-First Example
Query: "What really caused the 2008 financial crisis?"

Classification: Depth-first (multiple perspectives on singular event)

Strategy:
- Subagent 1: Economic perspective
- Subagent 2: Regulatory perspective
- Subagent 3: Behavioral/psychological perspective
- Subagent 4: Historical context
→ Synthesize into multi-perspective analysis
```

```markdown
# Breadth-First Example
Query: "Compare the top 3 cloud providers"

Classification: Breadth-first (distinct independent sub-questions)

Strategy:
- Subagent 1: Research AWS (pricing, features, support)
- Subagent 2: Research Google Cloud (pricing, features, support)
- Subagent 3: Research Azure (pricing, features, support)
→ Aggregate into comparison matrix
```

### Pattern 2: Dynamic Subagent Scaling

The agent adjusts parallelization based on complexity:

```markdown
# Simple Query (1 subagent)
"What is the tax deadline this year?"
→ Single subagent retrieves current tax deadline

# Standard Query (2-3 subagents)
"Compare React, Vue, and Svelte"
→ 3 subagents, one per framework

# Complex Query (5-10 subagents)
"Research the net worth and birthplace of all Fortune 500 CEOs"
→ 10 subagents handling 50 CEOs each (parallelized workload)
```

### Pattern 3: Progressive Synthesis

Results are synthesized progressively:

```markdown
1. Deploy initial subagents based on plan
2. Analyze early results
3. Identify gaps or contradictions
4. Deploy follow-up subagents if needed
5. Use Bayesian reasoning to update research direction
6. Synthesize final comprehensive report
```

### Pattern 4: Source Verification

Multiple sources prevent misinformation:

```markdown
For critical facts:
- Require 2-3 independent sources
- Check source credibility and recency
- Flag conflicts between sources
- Prefer primary sources over secondary
- Include citations in final report
```

## Example Use Cases

### Use Case 1: Technology Research
```
Query: "What are the best practices for implementing microservices in 2025?"

Process:
1. Classify: Breadth-first (multiple independent best practices)
2. Deploy subagents:
   - Service decomposition strategies
   - Communication patterns (sync vs async)
   - Deployment and orchestration
   - Observability and monitoring
   - Security considerations
3. Synthesize: Comprehensive best practices guide with citations
```

### Use Case 2: Market Analysis
```
Query: "Analyze the competitive landscape for AI code assistants"

Process:
1. Classify: Breadth-first (multiple competitors to research)
2. Deploy subagents:
   - GitHub Copilot capabilities
   - Cursor AI features
   - Claude Code features
   - Emerging competitors
3. Synthesize: Comparison matrix with strengths/weaknesses
```

### Use Case 3: Deep Analysis
```
Query: "Why did the Rust programming language gain adoption?"

Process:
1. Classify: Depth-first (multiple perspectives on single phenomenon)
2. Deploy subagents:
   - Technical advantages perspective
   - Community/ecosystem perspective
   - Industry adoption timeline
   - Comparison to alternatives
3. Synthesize: Multi-dimensional analysis with supporting evidence
```

## Advanced Patterns

### Dependency-Aware Scheduling

Some tasks must complete before others:

```markdown
# Example: Research CEO backgrounds for specific companies

Step 1: Deploy subagent to get list of Fortune 500 companies
         [WAIT FOR COMPLETION]

Step 2: Parse company list from subagent results

Step 3: Deploy 10 parallel subagents to research CEOs
         (each handles 50 companies from the list)

Step 4: Synthesize comprehensive report
```

### Adaptive Research Depth

The agent adjusts depth based on findings:

```markdown
Initial Plan: 3 subagents for standard query

After subagent 1 returns: "Complex technical details found"
→ Adjust: Deploy 2 additional specialized subagents

After subagent 2 returns: "Simple consensus answer"
→ Adjust: Skip remaining deep dives, synthesize early
```

### Iterative Refinement

Research can be refined based on intermediate results:

```markdown
Round 1: Deploy broad subagents
→ Identify most promising directions

Round 2: Deploy focused subagents on promising areas
→ Gather detailed evidence

Round 3: Deploy verification subagents for critical claims
→ Ensure accuracy

Final: Synthesize multi-round findings
```

## Differences from Chief of Staff Agent

| Aspect | Research Agent | Chief of Staff |
|--------|---------------|----------------|
| **Purpose** | Information gathering & synthesis | Executive decision support |
| **Subagent Type** | Homogeneous (all researchers) | Heterogeneous (specialized roles) |
| **Query Classification** | Explicit (depth/breadth/straight) | Implicit (domain-based) |
| **Scaling** | Dynamic (1-20 subagents) | Fixed (2 subagents) |
| **Output** | Research reports with citations | Strategic recommendations |
| **Domain** | General research | Business/startup operations |

## Performance Characteristics

- **Simple queries**: ~1-2 minutes (single subagent)
- **Standard queries**: ~2-5 minutes (2-3 parallel subagents)
- **Complex queries**: ~5-15 minutes (5-10 parallel subagents)
- **Maximum parallelization**: 20 subagents (for massive info-gathering)

## Technical Requirements

- **Claude Code** with Task tool enabled
- **Web search access** for subagents
- **Parallel tool calling** support (recommended)
- No external dependencies

## Best Practices

### 1. Clear Query Formulation
```markdown
❌ Vague: "Tell me about AI"
✅ Specific: "What are the most promising AI research directions in 2025?"
```

### 2. Appropriate Complexity
```markdown
❌ Over-complex: Deploy 10 subagents for "What is React?"
✅ Right-sized: Deploy 1 subagent for straightforward fact-finding
```

### 3. Source Quality
```markdown
❌ Single source: Base findings on one article
✅ Multi-source: Verify with 2-3 independent credible sources
```

### 4. Progressive Synthesis
```markdown
❌ Wait for all: Hold report until all 20 subagents complete
✅ Progressive: Synthesize early results while waiting for stragglers
```

## Customization Examples

### For Academic Research
```markdown
Modify research-lead-agent.md:

- Add academic source preferences (PubMed, arXiv, JSTOR)
- Include peer-review verification
- Require DOI citations
- Add methodology quality criteria
```

### For Business Intelligence
```markdown
Modify research-lead-agent.md:

- Prioritize recent data (last 6 months)
- Include market size estimates
- Require quantitative metrics
- Add competitive positioning analysis
```

### For Technical Documentation
```markdown
Modify research-lead-agent.md:

- Prefer official documentation
- Include code examples
- Verify version compatibility
- Add deprecation warnings
```

## Learning Path

1. **Beginner**: Read research-lead-agent.md lines 1-100 (core process)
2. **Intermediate**: Study query classification and subagent scaling
3. **Advanced**: Analyze delegation patterns and synthesis strategies
4. **Expert**: Customize for your domain and build specialized research systems

## Credits

These production-grade prompts are from **Anthropic's Claude Cookbooks** repository, extracted for the Claude Starter Kit with additional documentation.

**Original Source**: https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents

**Authors**: Anthropic Research Team

## Related Patterns

- **Chief of Staff**: See `.claude/examples/agents/chief-of-staff/` for heterogeneous multi-agent patterns
- **Task Tool Documentation**: See Claude Code docs for Task tool capabilities
- **Parallel Tool Calling**: See Claude API docs for optimization techniques

## Questions?

For questions about:
- **These prompts**: Read the inline comments in the .md files
- **Adapting for your domain**: Start with query type customization
- **Claude Code patterns**: See .claude/docs/ in the repository root
- **Original implementation**: Visit the Anthropic cookbook repository

---

**Version**: 1.0.0 (Extracted from claude-cookbooks for Claude Starter Kit v1.0.0)
**Last Updated**: 2025-01-07
**License**: MIT (same as Claude Starter Kit)
