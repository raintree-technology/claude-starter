Clear all caches (Redis/KV, Next.js build cache, Velite content cache).

Execute the following cleanup steps:

1. **Clear Next.js Build Cache**
   ```bash
   rm -rf .next
   ```
   - Removes compiled pages and build artifacts
   - Forces clean rebuild on next dev/build

2. **Clear Velite Content Cache**
   ```bash
   rm -rf .velite
   ```
   - Removes processed markdown/MDX content
   - Will regenerate on next build

3. **Clear Turbo Cache** (if exists)
   ```bash
   rm -rf .turbo
   ```
   - Removes Turbopack cache

4. **Clear Redis Cache** (optional - requires manual confirmation)
   Ask user: "Do you want to clear Redis/Vercel KV cache? This affects all users and requires production access."

   If yes, provide instructions:
   - Go to Vercel dashboard
   - Navigate to Storage → KV
   - Use "Flush All" button
   - OR run: `vercel env pull` then use KV client to flush

5. **Report Results**
   - List what was cleared
   - Show disk space freed (du -sh on .next, .velite)
   - Remind about next steps:
     - Run `bun dev` to regenerate dev cache
     - Run `bun run build` to regenerate production cache

Note: This is a more thorough version of `bun run clean` which only removes .next, .turbo, and node_modules.
