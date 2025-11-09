Run the full validation and build pipeline to ensure production readiness.

Execute the following steps in sequence:

1. **TypeScript Type Check**
   ```bash
   bun run typecheck
   ```
   - Must pass with zero errors
   - If errors found, stop and report them

2. **Lint Check**
   ```bash
   bun run lint
   ```
   - Must pass with zero errors
   - Warnings are acceptable but should be noted
   - If errors found, stop and report them

3. **Production Build**
   ```bash
   bun run build
   ```
   - This runs `velite` first, then `next build`
   - Must complete successfully
   - Report build time and bundle sizes
   - If build fails, show the error

4. **Report Results**
   - ✅ All checks passed → "Safe to deploy"
   - ❌ Any check failed → List failures with file/line numbers
   - Show total execution time
   - Suggest fixes for common issues

This is equivalent to `bun run build:safe` but with detailed reporting at each step.
