# Chief of Staff Agent

> **Production-ready example agent demonstrating advanced Claude Code patterns including multi-agent orchestration, output styles, custom slash commands, and compliance hooks.**

## Overview

The Chief of Staff agent is a comprehensive example from Anthropic's official cookbook that demonstrates enterprise-grade agentic patterns for strategic decision support. While the example uses a startup scenario ("TechStart Inc"), all patterns are generalizable to any domain requiring multi-agent orchestration and executive decision support.

## What This Example Demonstrates

### 1. **Multi-Agent Orchestration**
- Main agent (`Chief of Staff`) delegates to specialized subagents
- **Financial Analyst**: Budget modeling, ROI analysis, runway calculations
- **Recruiter**: Hiring impact analysis, compensation benchmarking, team scaling

### 2. **Output Styles Pattern** 🌟
- Selectable communication styles for different audiences
- **Executive Style**: Concise, KPI-focused, decision-oriented
- **Technical Style**: Data-rich, detailed analysis, methodology included

### 3. **Custom Slash Commands**
- `/strategic-brief <topic>` - High-level strategic analysis
- `/budget-impact <decision>` - Financial impact assessment
- `/talent-scan <role>` - Hiring analysis and recommendations

### 4. **Post-Tool-Use Hooks for Compliance**
- `report-tracker.py` - Logs all reports for audit trails
- `script-usage-logger.py` - Tracks Python script execution for compliance

### 5. **Procedural Knowledge via Python Scripts**
- `hiring_impact.py` - Calculate hiring costs and runway impact
- `financial_forecast.py` - Project future financial metrics
- `decision_matrix.py` - Multi-criteria decision analysis
- `talent_scorer.py` - Evaluate candidates against requirements
- `simple_calculation.py` - Quick financial calculations

### 6. **Context Management**
- **CLAUDE.md**: Rich company context (financials, team, priorities)
- Demonstrates how to structure domain knowledge for agents
- Shows how to reference external data files

## Directory Structure

```
chief-of-staff/
├── .claude/
│   ├── agents/
│   │   ├── financial-analyst.md      # Subagent: Financial analysis
│   │   └── recruiter.md              # Subagent: Hiring & talent
│   ├── commands/
│   │   ├── strategic-brief.md        # Custom slash command
│   │   ├── budget-impact.md          # Financial impact command
│   │   └── talent-scan.md            # Hiring command
│   ├── output-styles/
│   │   ├── executive.md              # Concise, decision-focused
│   │   └── technical.md              # Detailed, data-rich
│   └── hooks/
│       ├── report-tracker.py         # Audit trail for reports
│       └── script-usage-logger.py    # Track script execution
├── scripts/                          # Procedural knowledge
│   ├── hiring_impact.py
│   ├── financial_forecast.py
│   ├── decision_matrix.py
│   ├── talent_scorer.py
│   └── simple_calculation.py
├── output_reports/                   # Example outputs
│   ├── Q2_2024_Financial_Forecast.md
│   └── hiring_decision.md
├── CLAUDE.md                         # Domain context
├── flow_diagram.md                   # Architecture diagrams
└── README.md                         # This file
```

## How to Use

### As a Learning Resource

1. **Study the architecture**: Read `flow_diagram.md` to understand agent communication patterns
2. **Examine subagents**: See how `financial-analyst.md` and `recruiter.md` are structured
3. **Test slash commands**: Try `/strategic-brief product roadmap` to see command expansion
4. **Explore output styles**: Request responses in `executive` or `technical` style
5. **Review hooks**: See how compliance is automated via post-tool-use hooks

### To Adapt for Your Domain

1. **Replace CLAUDE.md** with your domain context (company, project, system)
2. **Modify subagents** to match your domain (e.g., `legal-advisor`, `technical-architect`)
3. **Update scripts** with your domain logic (e.g., `calculate_capacity.py`, `risk_assessment.py`)
4. **Customize commands** for your workflows (e.g., `/compliance-check`, `/architecture-review`)
5. **Keep or adapt output styles** based on your audience needs

### To Activate in Your Project

To use this agent in your Claude Code project:

1. **Copy the relevant components**:
   ```bash
   # Copy subagents to your .claude/agents/ directory
   cp .claude/examples/agents/chief-of-staff/.claude/agents/*.md .claude/agents/

   # Copy commands to your .claude/commands/ directory
   cp .claude/examples/agents/chief-of-staff/.claude/commands/*.md .claude/commands/

   # Copy output styles to your .claude/output-styles/ directory
   mkdir -p .claude/output-styles
   cp .claude/examples/agents/chief-of-staff/.claude/output-styles/*.md .claude/output-styles/

   # Copy hooks to your .claude/hooks/ directory
   cp .claude/examples/agents/chief-of-staff/.claude/hooks/*.py .claude/hooks/
   ```

2. **Copy scripts** to your project:
   ```bash
   mkdir -p scripts
   cp .claude/examples/agents/chief-of-staff/scripts/*.py scripts/
   ```

3. **Create your CLAUDE.md** with domain-specific context

## Key Patterns to Learn

### Pattern 1: Multi-Agent Orchestration

The Chief of Staff delegates specialized work to subagents:

```markdown
# In Chief of Staff context
When analyzing financial decisions, delegate to the financial-analyst agent.
When evaluating hiring decisions, delegate to the recruiter agent.
```

Subagents are invoked via the `Task` tool:

```markdown
# Example delegation
Use Task tool with description="Analyze hiring impact" and
prompt="Analyze the financial and operational impact of hiring 5 senior engineers"
```

### Pattern 2: Output Styles

Output styles allow agents to adjust their communication based on audience:

```markdown
# User request
"Analyze this decision in executive style"

# Agent applies executive.md formatting:
- Lead with decision recommendation
- Use bullet points
- Focus on KPIs
- Limit to 1-2 paragraphs
```

### Pattern 3: Procedural Knowledge Scripts

Python scripts encode domain-specific calculations that agents can execute:

```python
# hiring_impact.py
def calculate_impact(num_hires, avg_salary, benefits_multiplier):
    """Calculate monthly and annual cost of hiring"""
    monthly_cost = (num_hires * avg_salary / 12) * (1 + benefits_multiplier)
    return {"monthly_cost": monthly_cost, "annual_cost": monthly_cost * 12}
```

Agents call scripts and interpret results:

```bash
python scripts/hiring_impact.py 5 180000 0.3
# Returns: {"monthly_cost": 97500, "annual_cost": 1170000}
```

### Pattern 4: Compliance Hooks

Post-tool-use hooks ensure audit trails for regulated environments:

```python
# report-tracker.py (simplified)
def track_report(tool_name, output_path):
    """Log all generated reports to audit trail"""
    with open("audit/report_log.json", "a") as f:
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name,
            "output": output_path,
            "user": os.environ.get("USER")
        }
        f.write(json.dumps(log_entry) + "\n")
```

## Example Use Cases

### Use Case 1: Executive Decision Support
```
User: /strategic-brief Should we acquire our competitor SmartDev Inc for $8M?
Chief of Staff:
- Delegates to financial-analyst for ROI analysis
- Delegates to recruiter for talent assessment
- Synthesizes findings
- Returns recommendation in executive style
- Logs decision to audit trail
```

### Use Case 2: Budget Planning
```
User: /budget-impact hiring 10 engineers in Q3
Chief of Staff:
- Calls hiring_impact.py script
- Analyzes impact on runway
- Provides hiring timeline recommendations
- Returns in technical style (with calculations)
```

### Use Case 3: Talent Acquisition
```
User: /talent-scan senior backend engineer
Chief of Staff:
- Delegates to recruiter agent
- Evaluates market compensation
- Assesses team capacity impact
- Recommends hiring strategy
```

## Adaptation Examples

### For Healthcare: "Clinical Operations Assistant"
```
Subagents:
- clinical-analyst (patient flow, outcomes)
- regulatory-advisor (compliance, documentation)

Scripts:
- patient_capacity.py
- staffing_optimization.py
- regulatory_checklist.py

Commands:
- /clinical-brief
- /capacity-planning
- /regulatory-review
```

### For E-commerce: "Operations Chief"
```
Subagents:
- inventory-analyst (stock, logistics)
- marketing-strategist (campaigns, ROI)

Scripts:
- inventory_forecast.py
- campaign_roi.py
- pricing_optimization.py

Commands:
- /inventory-planning
- /campaign-analysis
- /pricing-strategy
```

### For Software Engineering: "Engineering Manager Assistant"
```
Subagents:
- technical-architect (design, scalability)
- project-manager (timelines, resources)

Scripts:
- capacity_planning.py
- technical_debt_score.py
- sprint_velocity.py

Commands:
- /architecture-review
- /capacity-check
- /technical-debt-audit
```

## Advanced Patterns

### Parallel Subagent Execution

The chief agent can launch multiple subagents in parallel:

```markdown
# Launch financial and hiring analysis simultaneously
Task 1: financial-analyst analyzes budget impact
Task 2: recruiter analyzes talent requirements
[Wait for both to complete, then synthesize]
```

### Conditional Delegation

Delegate based on question type:

```markdown
If question involves numbers/budgets → financial-analyst
If question involves people/hiring → recruiter
If question involves both → launch both in parallel
If question is strategic → handle directly
```

### Context Inheritance

Subagents inherit context from CLAUDE.md but can have additional specialized context:

```markdown
# financial-analyst.md
You have access to the company context in CLAUDE.md.
Additionally, you should always:
- Reference current burn rate ($500K/month)
- Consider runway (20 months)
- Apply SaaS financial metrics (LTV, CAC, payback period)
```

## Technical Requirements

- **Python 3.8+** for running scripts
- **Claude Code** with Task tool enabled
- **File write permissions** for hooks to create audit logs

## Dependencies

Scripts use standard library only:
```python
import json
import sys
import datetime
import os
```

No external packages required.

## Security Considerations

1. **Audit Trails**: Hooks log all decisions for compliance
2. **Access Control**: Scripts can check user permissions before execution
3. **Data Sanitization**: CLAUDE.md can contain synthetic data for examples
4. **Secret Management**: Real production use should load secrets from environment

## Learning Path

1. **Beginner**: Read CLAUDE.md and flow_diagram.md, understand the architecture
2. **Intermediate**: Test slash commands, examine how subagents are invoked
3. **Advanced**: Study hooks, adapt scripts for your domain
4. **Expert**: Build your own multi-agent system using these patterns

## Credits

This example agent is from **Anthropic's Claude Cookbooks** repository, adapted for the Claude Starter Kit with additional documentation and generalization guidance.

**Original Source**: https://github.com/anthropics/claude-cookbooks/tree/main/claude_agent_sdk/chief_of_staff_agent

## Related Patterns

- **Output Styles**: See `.claude/examples/patterns/output-styles/`
- **Research Agent**: See `.claude/examples/agents/research-agent/` for alternative orchestration patterns
- **Quality Hooks**: See `.claude/examples/hooks/` for more hook examples

## Questions?

For questions about:
- **This example**: Review flow_diagram.md and subagent files
- **Adapting for your domain**: Start with CLAUDE.md and scripts/
- **Claude Code patterns**: See .claude/docs/ in the repository root
- **Original implementation**: Visit the Anthropic cookbook repository

---

**Version**: 1.0.0 (Extracted from claude-cookbooks for Claude Starter Kit v1.0.0)
**Last Updated**: 2025-01-07
**License**: MIT (same as Claude Starter Kit)
