# Output Styles Pattern

> **A pattern for defining communication styles that agents can adopt based on audience, enabling tailored responses for different stakeholders.**

## Overview

The Output Styles pattern allows Claude Code agents to adjust their communication format and level of detail based on the intended audience. This is particularly useful in multi-stakeholder environments where different groups need different levels of detail and technical depth.

## What This Pattern Demonstrates

### Core Concept
Instead of agents always responding in one fixed format, they can dynamically select or be assigned an "output style" that defines:
- Level of detail (executive summary vs deep dive)
- Technical depth (business-focused vs technical)
- Format (bullet points vs paragraphs)
- Tone (formal vs conversational)
- Content focus (decisions vs data vs process)

### Benefits
1. **Multi-audience support**: One agent serves different stakeholder groups
2. **Appropriate detail**: Executives get summaries, technical teams get depth
3. **Consistent formatting**: Each style has predictable structure
4. **Reusable patterns**: Styles work across different agent types
5. **Explicit control**: Users can request specific styles

## Example Styles Included

### 1. Executive Style (`executive.md`)
**Purpose**: For C-suite, board members, senior leadership

**Characteristics**:
- Concise (1-2 paragraphs max)
- Leads with decision recommendation
- Focuses on KPIs and metrics
- Minimal technical details
- Clear next actions

**When to use**:
- Board presentations
- Executive briefings
- Strategic decision memos
- Investor updates

### 2. Technical Style (`technical.md`)
**Purpose**: For engineering teams, technical staff, implementation details

**Characteristics**:
- Comprehensive and detailed
- Includes methodology
- Shows calculations and data
- Technical terminology appropriate
- Implementation specifics

**When to use**:
- Engineering planning
- Technical documentation
- Deep analysis reports
- Implementation guides

## How to Use

### Option 1: User Requests Style

The user explicitly requests a style:

```
User: "Analyze this decision in executive style"
Agent: [Applies executive.md formatting rules]

User: "Provide technical analysis of this approach"
Agent: [Applies technical.md formatting rules]
```

### Option 2: Agent Context Determines Style

The agent or CLAUDE.md defines when to use each style:

```markdown
# In CLAUDE.md or agent instructions
When responding to the CEO or board members, use executive style.
When responding to engineering teams, use technical style.
```

### Option 3: Command-Based Selection

Slash commands can specify output style:

```markdown
# In .claude/commands/strategic-brief.md
Generate a strategic brief in executive style.

# In .claude/commands/technical-analysis.md
Provide a detailed technical analysis in technical style.
```

## Creating Your Own Styles

### Style Template

Create a new file in `.claude/output-styles/`:

```markdown
# [Style Name] Output Style

## Purpose
[Who is this for and when should it be used]

## Format Rules
- [Rule 1: e.g., "Lead with main finding"]
- [Rule 2: e.g., "Use bullet points"]
- [Rule 3: e.g., "Limit to 500 words"]

## Structure
1. [Section 1 name and purpose]
2. [Section 2 name and purpose]
3. [Section 3 name and purpose]

## Tone
[Formal/Casual/Technical/etc.]

## Example
[Show a sample output in this style]
```

### Example: Academic Style

```markdown
# Academic Output Style

## Purpose
For research papers, academic audiences, peer review

## Format Rules
- Include methodology section
- Cite sources with references
- Use third person ("this study finds" not "I find")
- Include limitations section
- Follow academic conventions

## Structure
1. Abstract (150-200 words)
2. Methodology
3. Findings
4. Discussion
5. Limitations
6. References

## Tone
Formal, objective, precise

## Example
[Sample academic-style output]
```

### Example: Casual Style

```markdown
# Casual Output Style

## Purpose
For internal team communication, brainstorming, quick updates

## Format Rules
- Conversational tone
- Use first person
- Bullet points and short paragraphs
- Emojis acceptable
- Less formal structure

## Structure
1. Quick summary
2. Key points
3. Next steps

## Tone
Friendly, approachable, efficient

## Example
[Sample casual-style output]
```

## Integration with Agents

### Method 1: Direct Reference in Agent

```markdown
# In .claude/agents/business-analyst.md

When generating reports, you can use different output styles:
- **Executive style**: For C-suite (use executive.md)
- **Technical style**: For engineering (use technical.md)
- **Operational style**: For day-to-day teams (use operational.md)

The user may explicitly request a style, or you can infer from context.
```

### Method 2: CLAUDE.md Context

```markdown
# In CLAUDE.md

## Communication Styles

The agent should adapt its communication style based on the request:
- CEO questions → executive style
- CTO questions → technical style
- Team lead questions → operational style
```

### Method 3: Post-Processing Hook

```python
# .claude/hooks/apply-style.py
def format_response(agent_output, requested_style):
    """Apply output style formatting to agent response"""
    if requested_style == "executive":
        return format_executive(agent_output)
    elif requested_style == "technical":
        return format_technical(agent_output)
    # ...
```

## Real-World Examples

### Example 1: Financial Analysis

**Same Data, Different Styles**:

**Executive Style**:
```
RECOMMENDATION: Proceed with Series B fundraising in Q2 2025.

KEY METRICS:
- Current runway: 18 months
- Burn rate: $450K/month
- Target raise: $25M at $150M valuation

RATIONALE: Strong product-market fit (NPS 74), growing ARR (+15% MoM),
and favorable market conditions support Series B timing.

NEXT ACTIONS:
1. Engage top-tier VCs (Target: 3 term sheets by March)
2. Update financial model (CFO to complete by Jan 31)
```

**Technical Style**:
```
FINANCIAL ANALYSIS: Series B Fundraising Readiness

CURRENT FINANCIAL POSITION:
- Cash balance: $8.1M (as of Dec 31, 2024)
- Monthly burn: $450,000
- Runway: 18.0 months (through June 2026)
- Burn rate components:
  * Personnel: $280K (62%)
  * Infrastructure: $95K (21%)
  * Marketing: $50K (11%)
  * Other: $25K (6%)

REVENUE ANALYSIS:
- ARR: $3.2M (Dec 2024)
- Growth rate: 15% MoM (trailing 3 months)
- Customer count: 145 enterprise, 890 SMB
- Average contract value: $22,069
- Churn rate: 2.1% (best in class for SaaS)

FUNDRAISING PROJECTIONS:
- Target raise: $25M
- Projected valuation: $140M - $160M (5-6x ARR)
- Dilution: 15-18%
- Runway extension: +15 months (through Sept 2027)

METHODOLOGY:
Projections based on comparable SaaS companies (n=15) with similar
ARR and growth profiles. Valuation multiples derived from Q4 2024
SaaS benchmarks (Pitchbook data).

RECOMMENDATION: Fundraise timing is optimal given current metrics.
```

### Example 2: Product Decision

**Executive Style**:
```
DECISION: Launch freemium tier in Q1 2025.

WHY: Accelerates top-of-funnel by 3-5x based on competitor data.

INVESTMENT: $180K dev + $50K/month infrastructure.

EXPECTED ROI: 400% within 12 months.

RISK: Potential cannibalization of paid tier (estimated < 10%).

APPROVAL NEEDED: Board approval for freemium pricing strategy.
```

**Technical Style**:
```
PRODUCT PROPOSAL: Freemium Tier Implementation

OVERVIEW:
Introduce a free tier with limited features to accelerate user acquisition
and create a conversion funnel to paid tiers.

FEATURE SET (Freemium):
- 10 API calls/day (vs 1000 for Basic, unlimited for Pro)
- Single user workspace
- 7-day data retention (vs 30 days Basic, unlimited Pro)
- Community support only
- Public projects only

TECHNICAL IMPLEMENTATION:
- New rate limiting system (Redis-based)
- Usage tracking and metering
- Automated tier upgrade flow
- Stripe free subscription handling

DEVELOPMENT EFFORT:
- Backend: 80 hours
- Frontend: 40 hours
- Infrastructure: 20 hours
- Testing/QA: 30 hours
- Total: 170 hours (~$180K fully loaded)

INFRASTRUCTURE COSTS:
- Estimated freemium users: 10,000 in first 6 months
- Compute cost per free user: ~$0.50/month
- Total monthly: ~$5,000 (+ $45K baseline)

CONVERSION ASSUMPTIONS:
- Free to paid: 8-12% (industry average 5-15%)
- Time to convert: 45 days median
- Upgrade to Basic (70%), Pro (30%)

RISK MITIGATION:
- Cannibalization: Limit free tier features to prevent paid user downgrade
- Support load: Community-only support for free tier
- Abuse: Rate limiting + captcha + email verification

COMPETITIVE ANALYSIS:
- GitHub: Free unlimited public repos, paid for private
- Notion: Free for individuals, paid for teams
- Figma: Free with limits, paid for advanced features

Our approach aligns with successful SaaS freemium models.
```

## Advanced Patterns

### Dynamic Style Selection

The agent can select styles based on question complexity:

```markdown
# In agent instructions
For simple questions: Use casual style
For analysis requests: Use technical style
For recommendations: Use executive style
```

### Hybrid Styles

Combine elements from multiple styles:

```markdown
# In .claude/output-styles/executive-technical.md

Hybrid style that gives executive summary followed by technical appendix:

1. Executive Summary (executive style)
2. Key Findings (executive style)
3. Technical Appendix (technical style)
```

### Context-Aware Styles

Styles adapt based on the domain:

```markdown
# For legal domain
- legal-executive.md (for general counsel)
- legal-technical.md (for paralegals, detailed research)

# For healthcare domain
- clinical-executive.md (for hospital administrators)
- clinical-technical.md (for doctors, detailed clinical info)
```

## Best Practices

### 1. Define Clear Boundaries
Each style should have distinct characteristics that don't overlap too much.

### 2. Include Examples
Every style file should include example outputs so agents understand the pattern.

### 3. Keep Styles Focused
Don't create too many styles. 2-4 styles usually suffice:
- Executive (high-level)
- Technical (detailed)
- Operational (day-to-day)
- Casual (internal)

### 4. Make Styles Discoverable
Document available styles in:
- Agent instructions
- CLAUDE.md
- README files
- Command descriptions

### 5. Test with Real Content
Validate that styles work across different topics, not just the original example domain.

## Related Patterns

- **Chief of Staff Agent**: See `.claude/examples/agents/chief-of-staff/` for the original implementation
- **Multi-Agent Systems**: Output styles work well with heterogeneous agents
- **Slash Commands**: Commands can specify output styles
- **Hooks**: Can post-process outputs to apply styles

## Credits

This pattern is extracted from **Anthropic's Claude Cookbooks** Chief of Staff agent, generalized for broader use.

**Original Source**: https://github.com/anthropics/claude-cookbooks/tree/main/claude_agent_sdk/chief_of_staff_agent

---

**Version**: 1.0.0 (Extracted from claude-cookbooks for Claude Starter Kit v1.0.0)
**Last Updated**: 2025-01-07
**License**: MIT
