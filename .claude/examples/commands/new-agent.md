Create a new specialized agent interactively with proper configuration.

Usage: `/new-agent <name>`
- Creates agent file with YAML frontmatter
- Guides through agent configuration
- Provides best practices and examples
- Validates agent metadata

Interactive agent creation workflow:

1. **Validate Agent Name**
   - Check name is lowercase-with-hyphens
   - Verify agent doesn't already exist
   - Suggest alternatives if name conflicts

2. **Ask Agent Type**
   Prompt user to select:
   - [ ] Core Agent (goes in `.claude/core/agents/`)
   - [ ] Optional Agent (goes in `.claude/examples/agents/`)

   Explain:
   - Core: Essential agents that should always be active
   - Optional: Specialized agents users can enable as needed

3. **Gather Agent Metadata**
   Prompt for each field:

   **Name** (display name)
   - Example: "API Builder"
   - Should be human-readable with proper capitalization

   **Description** (one-line summary)
   - Example: "Build production-ready Next.js API routes with validation, error handling, and best practices"
   - Should clearly describe what the agent does
   - Include keywords that trigger auto-invocation

   **Auto-invoke keywords**
   - Example: "PROACTIVELY when working with API routes, endpoints, route handlers"
   - These keywords trigger automatic agent activation

4. **Define Agent Responsibilities**
   Provide template and ask user to customize:
   ```markdown
   ## Responsibilities

   1. **[Primary Task]**
      - [Specific action 1]
      - [Specific action 2]

   2. **[Secondary Task]**
      - [Specific action 1]
      - [Specific action 2]
   ```

   Guide user through filling in responsibilities

5. **Add Usage Patterns**
   Provide examples template:
   ```markdown
   ## Patterns & Best Practices

   ### [Pattern Name]
   [Description of when to use this pattern]

   [Code example]

   ### Common Issues
   - **[Issue]**: [Solution]
   ```

6. **Create Agent File**
   Generate file at appropriate location:
   ```markdown
   ---
   name: [agent-name]
   description: [description]
   ---

   # [Agent Display Name]

   **Purpose:** [One sentence purpose]

   **PROACTIVELY use when:** [Auto-invoke triggers]

   **Reference Documentation:** .claude/[core|examples]/agents/docs/[agent-name]-ref.md

   ## Responsibilities

   [Generated responsibilities]

   ## Patterns & Best Practices

   [Generated patterns]

   ## Examples

   [Template examples]
   ```

7. **Create Reference Documentation** (optional)
   Ask: "Create detailed reference documentation?"

   If yes, create `.claude/[core|examples]/agents/docs/[agent-name]-ref.md`:
   ```markdown
   # [Agent Name] Reference

   Comprehensive documentation for the [agent-name] agent.

   ## Overview
   [Detailed description]

   ## Use Cases
   [When to use this agent]

   ## Examples
   [Detailed examples with code]

   ## Configuration
   [Any special configuration needed]

   ## Best Practices
   [Tips and recommendations]
   ```

8. **Validate Agent File**
   - Parse YAML frontmatter
   - Verify required fields present
   - Check file structure
   - Validate paths are correct

9. **Update Documentation**
   Ask: "Update quick-reference.md to include this agent?"

   If yes, add entry to `.claude/docs/quick-reference.md`

10. **Test Agent**
    Provide test instructions:
    ```markdown
    ## Testing Your Agent

    1. Restart Claude Code to load the new agent

    2. Test explicit invocation:
       "Use the [agent-name] agent to [task]"

    3. Test auto-invocation with trigger words:
       "[phrase with trigger keywords]"

    4. Verify agent activates and provides expected guidance
    ```

11. **Report Summary**
    ```
    ✅ Agent created: .claude/[core|examples]/agents/[agent-name].md
    ✅ Reference docs: .claude/[core|examples]/agents/docs/[agent-name]-ref.md
    ✅ Documentation updated

    Next steps:
    1. Restart Claude Code: Press Cmd+R or type /restart
    2. Test the agent with: "Use [agent-name] to [task]"
    3. Refine the agent based on initial testing
    4. Add examples from real usage
    ```

12. **Provide Best Practices**
    - Keep description focused and clear
    - Include specific trigger keywords for auto-invocation
    - Add real code examples, not just templates
    - Document edge cases and limitations
    - Update agent based on usage patterns

This creates a fully-configured agent with proper metadata, documentation, and testing guidance.
