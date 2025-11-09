Verify project configuration, dependencies, and Claude Code setup.

Run comprehensive health checks:

1. **Verify Claude Code Configuration**
   - Check `.claude/` directory exists in project root
   - Verify `settings.json` is valid JSON
   - List active agents, commands, skills, and hooks
   - Report any configuration issues

2. **Check Core Dependencies**
   ```bash
   node --version
   npm --version  # or bun --version
   ```
   - Verify Node.js >= 18
   - Check package manager is installed
   - Validate package.json exists

3. **Verify Required Files**
   - Check for TypeScript configuration (tsconfig.json)
   - Verify .gitignore exists and includes .claude/.cache
   - Check for framework configuration (next.config.js, etc.)

4. **Test Core Commands**
   - Verify all core commands are accessible
   - List available slash commands
   - Check command files have valid syntax

5. **Check Agents**
   - List all active agents
   - Verify agent files have valid YAML frontmatter
   - Report agent activation triggers

6. **Verify Skills**
   - List enabled skills
   - Check skill manifests are valid
   - Report any missing dependencies for enabled skills

7. **Check Hooks Configuration**
   - Verify hooks in settings.json reference valid files
   - Check hook scripts are executable
   - Report hook triggers and matchers

8. **Report Results**
   Format output as:
   ```
   ✅ Claude Code Configuration: OK
   ✅ Node.js v20.0.0: OK
   ✅ Core Dependencies: OK
   ⚠️  TypeScript not configured (optional)
   ✅ Commands: 5 available
   ✅ Agents: 3 core + 0 optional
   ✅ Skills: 0 enabled
   ✅ Hooks: 0 configured

   Status: Healthy
   ```

9. **Suggest Improvements**
   - Recommend enabling skills based on project type
   - Suggest hooks for quality automation
   - Point to documentation for advanced configuration

This validates your entire Claude Code setup and helps diagnose issues.
