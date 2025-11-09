---
name: vercel-deploy-architect
description: Use when deploying to Vercel, configuring vercel.json, setting up preview deployments, managing environment variables, or optimizing Vercel settings. Helps configure Vercel projects, create deployment workflows, set up edge functions, and implement best practices for Next.js and other frameworks on Vercel.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

# Vercel Deploy Architect

## Purpose

This skill helps configure and optimize Vercel deployments for modern web applications. It covers:
- Vercel configuration (vercel.json)
- Environment variable management
- Preview and production deployments
- GitHub integration workflows
- Edge Functions and Middleware
- Build optimization
- Custom domains and redirects
- Serverless Function configuration

## When to Use

This skill should be invoked when:
- User says "deploy to Vercel", "configure Vercel", "set up Vercel deployment"
- User wants to "optimize Vercel settings", "configure vercel.json"
- User mentions "Vercel environment variables", "Vercel preview deployments"
- User asks about "Vercel Edge Functions", "Vercel Middleware"
- User needs to "configure Vercel redirects", "set up custom domain"
- User wants to "troubleshoot Vercel deployment", "fix Vercel build errors"

## Process

### 1. Understand Requirements

Ask the user:
- **What framework?** (Next.js, React, Vue, Svelte, etc.)
- **Deployment type?** (automatic, manual, preview)
- **Environment needs?** (staging, production, multiple environments)
- **Custom domains?** (apex, subdomains, multiple domains)
- **Special features?** (edge functions, middleware, serverless functions)

### 2. Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Or use npx
npx vercel

# Login to Vercel
vercel login
```

### 3. Initialize Vercel Project

```bash
# Link project to Vercel
vercel link

# This creates:
# - .vercel/ directory (gitignored)
# - Links to Vercel project
```

### 4. Configure vercel.json

Create `vercel.json` with project configuration:

**Basic Configuration:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**With Redirects:**
```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    },
    {
      "source": "/blog/:slug",
      "destination": "/news/:slug"
    }
  ]
}
```

**With Headers:**
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ]
}
```

**With Rewrites:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

### 5. Configure Environment Variables

**Local development** (.env.local):
```bash
# Never commit this file
DATABASE_URL=postgresql://localhost/mydb
NEXT_PUBLIC_API_URL=http://localhost:3000/api
SECRET_KEY=local-dev-secret
```

**Vercel Dashboard**:
1. Go to Project Settings → Environment Variables
2. Add variables for each environment:
   - Production
   - Preview
   - Development

**Via CLI:**
```bash
# Add environment variable
vercel env add SECRET_KEY production

# Pull environment variables
vercel env pull .env.local
```

**In vercel.json** (for build-time variables):
```json
{
  "env": {
    "API_URL": "https://api.example.com"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

### 6. Set Up GitHub Integration

**Automatic Deployments:**
1. Connect GitHub repository in Vercel dashboard
2. Configure deployment settings:
   - Production branch: `main`
   - Preview branches: All other branches
   - Deployment comments on PRs

**GitHub Actions Integration:**
```yaml
name: Vercel Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.event_name == 'push' && '--prod' || '' }}
          working-directory: ./
```

### 7. Configure Build Settings

**Next.js Optimization:**
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

**Build Performance:**
```json
{
  "installCommand": "npm ci --prefer-offline --no-audit",
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "crons": []
}
```

### 8. Configure Serverless Functions

**Function Configuration:**
```json
{
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10,
      "runtime": "nodejs20.x"
    },
    "api/long-running.ts": {
      "maxDuration": 300
    }
  }
}
```

**Edge Functions (middleware.ts):**
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Run on Edge Runtime
  const response = NextResponse.next()

  // Add custom header
  response.headers.set('x-custom-header', 'value')

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

### 9. Set Up Custom Domains

**Via Vercel Dashboard:**
1. Go to Project Settings → Domains
2. Add custom domain
3. Configure DNS records

**Via vercel.json:**
```json
{
  "alias": ["example.com", "www.example.com"]
}
```

**DNS Configuration:**
```
# A Record
@ → 76.76.21.21

# CNAME Record
www → cname.vercel-dns.com
```

### 10. Optimize Performance

**Image Optimization:**
```json
{
  "images": {
    "domains": ["example.com", "cdn.example.com"],
    "formats": ["image/avif", "image/webp"],
    "minimumCacheTTL": 60
  }
}
```

**Caching Headers:**
```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Edge Config:**
```typescript
import { get } from '@vercel/edge-config'

export async function GET() {
  const value = await get('feature-flags')
  return Response.json(value)
}

export const runtime = 'edge'
```

## Output Format

Create the following files:
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variable template
- `.vercelignore` - Files to exclude from deployment
- `middleware.ts` - Edge middleware (if needed)
- Update `README.md` with deployment instructions

## Configuration Templates

### Template 1: Next.js App Router

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm ci",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### Template 2: Monorepo Configuration

```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=web",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "ignoreCommand": "npx turbo-ignore"
}
```

### Template 3: SPA with API Proxy

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://backend.example.com/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://example.com"
        }
      ]
    }
  ]
}
```

### Template 4: Multi-Environment Setup

```json
{
  "env": {
    "API_URL": "@api-url"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_ENV": "production"
    }
  }
}
```

Add environment variables:
```bash
# Production
vercel env add API_URL production
# Enter: https://api.example.com

# Preview
vercel env add API_URL preview
# Enter: https://api-staging.example.com

# Development
vercel env add API_URL development
# Enter: http://localhost:3001
```

## Best Practices

### Performance
- Use Edge Functions for latency-sensitive operations
- Enable Image Optimization for better performance
- Set appropriate cache headers
- Use ISR (Incremental Static Regeneration) for dynamic content
- Optimize bundle size with tree-shaking
- Use edge regions closest to users

### Security
- Never commit `.env` files
- Use environment variables for secrets
- Set security headers (CSP, X-Frame-Options, etc.)
- Enable HTTPS only
- Use API routes for sensitive operations
- Validate environment variables at build time

### Deployment
- Use preview deployments for testing
- Test environment variables in preview
- Use production branch protection
- Configure deployment protection for production
- Monitor deployment logs
- Set up deployment notifications

### Cost Optimization
- Use ISR instead of SSR where possible
- Optimize serverless function duration
- Use Edge Functions for simple operations
- Monitor bandwidth usage
- Set appropriate cache headers
- Use Vercel Analytics sparingly

### Developer Experience
- Document deployment process in README
- Use `.env.example` for required variables
- Set up local development environment
- Use Vercel CLI for local testing
- Configure TypeScript for env variables
- Add deployment status badge to README

## Examples

### Example 1: Deploy Next.js App

**User**: "Deploy my Next.js app to Vercel"

**Process**:
1. Install Vercel CLI
2. Run `vercel login` and `vercel link`
3. Create vercel.json with Next.js config
4. Set up environment variables
5. Connect GitHub repository
6. Configure production and preview deployments

**Output**: Fully configured Vercel deployment

### Example 2: Set Up Custom Domain

**User**: "Add custom domain to my Vercel project"

**Process**:
1. Add domain in Vercel dashboard
2. Get DNS configuration
3. Update DNS records with domain provider
4. Add domain to vercel.json
5. Configure redirects (www → apex or vice versa)
6. Enable SSL certificate

**Output**: Custom domain configured with SSL

### Example 3: Configure API Proxy

**User**: "Proxy API requests to my backend"

**Process**:
1. Add rewrite rule in vercel.json
2. Configure CORS headers
3. Set backend URL as environment variable
4. Test proxy in preview deployment
5. Document API endpoints

**Output**: API proxy with proper CORS

## Error Handling

- **Build failed**: Check build logs in Vercel dashboard
- **Environment variable not found**: Verify variable is set in correct environment
- **Function timeout**: Increase `maxDuration` or optimize function
- **Domain not working**: Verify DNS configuration and propagation
- **404 on routes**: Check framework detection or output directory
- **CORS errors**: Configure headers in vercel.json
- **Image optimization issues**: Add domain to images.domains config

## Notes

- Vercel has generous free tier for personal projects
- Pro plan required for team collaboration
- Preview deployments are unlimited on all plans
- Functions have different limits by plan
- Edge Functions run globally, Serverless Functions in specific region
- Build time limits: 15min (Hobby), 45min (Pro/Enterprise)
- Environment variables encrypted at rest
- Vercel Analytics available as add-on
- Vercel KV (Redis) available for state management
- Use `vercel dev` to simulate Vercel environment locally
