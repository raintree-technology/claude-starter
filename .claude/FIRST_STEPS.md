# Your First 5 Minutes with Claude Code

Welcome to claude-starter! This guide will help you get productive immediately.

## What You Have Now

After running setup, your project includes:

- **3 core agents** - Always-on AI assistants (security-auditor, database-architect, api-builder)
- **9 core commands** - Essential workflows (/commit, /create-pr, /build-safe, etc.)
- **Optional skills** - Framework-specific expertise (see `.claude/examples/skills/`)
- **Quality hooks** - Automated validation on file edits (optional)

## Your First 5 Minutes

### 1. Test a Hook (if enabled)

Edit any file in your project. If you enabled hooks during setup, they'll automatically:
- Validate code quality
- Check for security issues
- Organize imports
- Run architecture checks

Try it:
```bash
echo "// test edit" >> test-file.ts
# Watch Claude Code validate the change
rm test-file.ts
```

### 2. Try `/commit` - AI-Powered Git Commits

Stage your changes and let Claude write conventional commit messages:

```bash
git add .
```

Then in Claude Code, type: `/commit`

Claude will:
- Analyze your changes
- Generate a conventional commit message
- Explain the changes
- Create the commit

### 3. Enable a Skill

Skills give Claude expertise in specific frameworks. Copy any skill from examples to core:

```bash
# Enable Next.js expertise
cp -r .claude/examples/skills/next/* .claude/core/skills/

# Enable Stripe payment expertise
cp -r .claude/examples/skills/stripe .claude/core/skills/
```

Now when you mention "Next.js" or "Stripe", Claude will use that specialized knowledge.

### 4. Explore Available Features

Check what's available to enable:

```bash
# See all optional skills
ls .claude/examples/skills/

# See all optional commands
ls .claude/examples/commands/

# See all optional agents
ls .claude/examples/agents/

# See all optional hooks
ls .claude/examples/hooks/
```

### 5. Customize Your Configuration

Your configuration lives in `.claude/settings.json`. To enable hooks manually:

```bash
# Use the built-in command
/enable-hook quality-focused
```

Or edit `.claude/settings.json` directly to add/remove hooks.

## Next Steps

### Create Your First Pull Request

After making changes:

```bash
git add .
/commit              # Let Claude write the commit message
/create-pr          # Let Claude generate PR title and description
```

Claude will:
- Analyze all commits in your branch
- Generate a comprehensive PR description
- Link related issues
- Add appropriate labels

### Validate Your Setup

Run the validation script to ensure everything is working:

```bash
./quick-validate.sh
```

This checks:
- All core files exist
- JSON configuration is valid
- Component counts are correct
- TypeScript compiles (if applicable)

### Check Your Active Configuration

See what's currently enabled:

```bash
cat .claude/STATUS.md
```

This shows:
- Active agents, commands, skills
- Enabled hooks
- Last validation date

## Learn More

- **CLAUDE.md** - Complete development guide for working with this repository
- **README.md** - User-facing documentation, features, installation
- **.claude/docs/** - Detailed guides organized by topic
- **.claude/examples/** - Browse optional components to enable

## Common Commands

| Command | What it does |
|---------|--------------|
| `/commit` | Generate conventional commit message |
| `/create-pr` | Generate pull request with AI summary |
| `/build-safe` | Type-safe build validation |
| `/health-check` | Verify configuration health |
| `/enable-hook` | Enable quality automation hooks |
| `/db-migrate` | Database migration workflow |
| `/release` | Semantic versioning and changelog |

## Tips for Success

1. **Start small** - Enable 2-4 hooks max initially (add more as needed)
2. **Use commands** - Let Claude handle git workflows with `/commit` and `/create-pr`
3. **Enable skills as needed** - Only copy skills for frameworks you actually use
4. **Read STATUS.md** - Always know what's active in your configuration
5. **Customize gradually** - Modify `.claude/settings.json` to fit your workflow

## Troubleshooting

### Hooks aren't running after edits

1. Check `.claude/settings.json` is valid JSON:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf8'))"
   ```

2. Verify file permissions:
   ```bash
   ls -la .claude/examples/hooks/
   ```

3. Restart your editor/IDE

4. Run validation:
   ```bash
   ./quick-validate.sh
   ```

5. See `.claude/examples/hooks/README.md` for detailed troubleshooting

### Commands aren't working

Remember: Commands like `/commit` are **instructions for Claude**, not shell scripts. You type them in Claude Code, and Claude executes the steps described in the markdown file.

For executable validation scripts, use:
```bash
./quick-validate.sh
```

### TypeScript errors after setup

Run the type checker to see specific issues:
```bash
npm run typecheck
# or
tsc --noEmit
```

Fix errors or warnings as needed, or use auto-fix during setup with:
```bash
./setup.sh --preset <name> --strict
```

## Questions?

- See `.claude/docs/FAQ.md` for common questions
- Read `CLAUDE.md` for development patterns
- Check `.claude/examples/` for feature examples
- Run `./setup.sh --help` to see all setup options

---

**You're ready to go!** Your code just got smarter. Start building and let Claude Code handle the repetitive work.
