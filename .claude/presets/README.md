# Claude Code Presets

Predefined configurations for common project types.

## Available Presets

### minimal
Core components only - security, database, API builder agents with essential commands.

**Use when:**
- Starting a new project without framework commitment
- You want maximum control over configuration
- Framework not supported by other presets

**Includes:**
- 3 core agents
- 9 core commands
- No skills
- No hooks

---

### nextjs-full
Complete Next.js development setup with all Next.js and React skills.

**Use when:**
- Building Next.js application
- Need full App Router and Pages Router support
- Want caching, streaming, and rendering optimization

**Includes:**
- 8 Next.js skills
- 2 React skills
- quality-focused hooks (recommended)

**Skills:**
- next-app-router, next-pages-router, next-api-architect
- next-cache-architect, next-data-rendering, next-config-optimization
- streaming-architect, nextjs-16-audit
- react-server-components, form-actions-architect

---

### stripe-commerce
E-commerce application with Stripe payments and Next.js.

**Use when:**
- Building e-commerce platform
- Integrating Stripe for payments
- Need subscription billing

**Includes:**
- Next.js skills (8)
- React skills (2)
- Stripe skills (5)
- security-focused hooks (recommended)

**Environment variables:**
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

---

### fullstack-saas
Production-ready SaaS with Next.js, Stripe, Supabase, and DevOps automation.

**Use when:**
- Building production SaaS application
- Need authentication, payments, database
- Want CI/CD automation

**Includes:**
- Next.js skills (8)
- React skills (2)
- Stripe skills (5)
- Supabase skills (1)
- DevOps skills (3)
- all hooks (recommended)

**Environment variables:**
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

---

### react-focused
React development with best practices and accessibility.

**Use when:**
- Building React application (not Next.js)
- Focus on component quality and accessibility
- Need React 19 Server Components

**Includes:**
- React skills (2)
- use-effect-less agent
- react-focused hooks (recommended)

**Skills:**
- react-server-components
- form-actions-architect

---

### devops-complete
Complete DevOps automation with GitHub Actions, git hooks, and Vercel deployment.

**Use when:**
- Setting up CI/CD pipelines
- Configuring deployment automation
- Need git workflow optimization

**Includes:**
- DevOps skills (3)
- security-focused hooks (recommended)

**Skills:**
- github-actions-architect
- git-hooks-architect
- vercel-deploy-architect

**Environment variables:**
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

---

## Using Presets

### With setup script

```bash
./setup.sh --preset nextjs-full
./setup.sh --preset fullstack-saas
```

### Manual application

```bash
# Copy skills from preset
cp -r .claude/examples/skills/next .claude/core/skills/
cp -r .claude/examples/skills/react .claude/core/skills/

# Enable recommended hooks
/enable-hook quality-focused
```

### Combining presets

You can combine multiple skill sets:

```bash
./setup.sh --stack next,stripe,d3
```

---

## Customizing Presets

Presets are JSON files in `.claude/presets/`. You can create custom presets:

```json
{
  "name": "my-custom-preset",
  "description": "Custom configuration for my stack",
  "skills": ["next", "stripe"],
  "agents": [],
  "commands": [],
  "hooks": ["security_scan"],
  "env": {
    "FRAMEWORK": "nextjs",
    "ENABLE_STRIPE": "true"
  },
  "recommended": {
    "hooks": "security-focused",
    "envVars": ["STRIPE_SECRET_KEY"]
  }
}
```

Save as `.claude/presets/my-custom-preset.json` and use with:

```bash
./setup.sh --preset my-custom-preset
```
