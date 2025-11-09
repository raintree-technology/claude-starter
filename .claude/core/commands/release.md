Automated release workflow with changelog generation, versioning, and GitHub releases.

Usage: `/release [major|minor|patch|version]`
- Without arguments: Auto-detects version bump from commits (default: patch)
- With major/minor/patch: Creates release with specified version bump
- With version (e.g., 1.2.3): Creates release with exact version

Execute the following workflow:

1. **Pre-Release Validation**
   ```bash
   # Ensure we're on main/master branch
   git branch --show-current

   # Ensure working directory is clean
   git status --porcelain

   # Ensure we're up to date with remote
   git fetch origin
   git status -sb

   # Run tests if they exist
   npm test 2>/dev/null || echo "No tests configured"

   # Run build if configured
   npm run build 2>/dev/null || echo "No build step configured"
   ```
   - Must be on main/master branch
   - No uncommitted changes
   - All tests passing
   - Build succeeds

2. **Determine Version Bump**
   ```bash
   # Get current version from package.json
   CURRENT_VERSION=$(node -p "require('./package.json').version")

   # Analyze commits since last tag
   git log $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD")..HEAD --oneline
   ```
   - If version provided: Use exact version
   - If major/minor/patch provided: Use specified bump
   - If not specified: Auto-detect from commit messages
     - `BREAKING CHANGE:` or `!` → major (1.0.0 → 2.0.0)
     - `feat:` → minor (1.0.0 → 1.1.0)
     - `fix:` or default → patch (1.0.0 → 1.0.1)

3. **Generate Changelog**
   ```bash
   # Get commits since last tag
   git log $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD \
     --pretty=format:"%h %s" --no-merges
   ```
   Create changelog entry:
   ```markdown
   ## [VERSION] - YYYY-MM-DD

   ### ✨ Features
   - [List of feat: commits]

   ### 🐛 Bug Fixes
   - [List of fix: commits]

   ### 🔧 Improvements
   - [List of refactor:, perf:, style: commits]

   ### 📚 Documentation
   - [List of docs: commits]

   ### 🧪 Tests
   - [List of test: commits]

   ### ⚠️ Breaking Changes
   - [List of breaking changes from commit bodies]

   ### 🔗 Commits
   - [Full list of commit hashes and messages]
   ```

4. **Update Version Files**
   ```bash
   # Update package.json version
   npm version $NEW_VERSION --no-git-tag-version

   # Update other version files if they exist
   # - pyproject.toml (Python)
   # - Cargo.toml (Rust)
   # - VERSION file
   ```
   - Update package.json
   - Update any other version files in project
   - Don't create git tag yet (npm version --no-git-tag-version)

5. **Update CHANGELOG.md**
   - Check if CHANGELOG.md exists
   - If exists: Prepend new entry below title
   - If not exists: Create new CHANGELOG.md with entry
   ```markdown
   # Changelog

   All notable changes to this project will be documented in this file.

   The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
   and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

   ## [VERSION] - YYYY-MM-DD
   ...
   ```

6. **Commit Version Bump**
   ```bash
   # Stage version changes
   git add package.json package-lock.json CHANGELOG.md

   # Create release commit
   git commit -m "chore(release): v$NEW_VERSION

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```
   - Commit with conventional format
   - Include version in message

7. **Create Git Tag**
   ```bash
   # Create annotated tag with changelog
   git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

   $CHANGELOG_ENTRY"
   ```
   - Create annotated tag (not lightweight)
   - Include changelog in tag message

8. **Push to Remote**
   ```bash
   # Push commits and tags
   git push origin main
   git push origin "v$NEW_VERSION"
   ```
   - Push release commit
   - Push tag (triggers GitHub Actions if configured)

9. **Create GitHub Release**
   ```bash
   # Create release with changelog
   gh release create "v$NEW_VERSION" \
     --title "Release v$NEW_VERSION" \
     --notes "$RELEASE_NOTES" \
     --latest
   ```
   Release notes format:
   ```markdown
   ## What's Changed

   $CHANGELOG_ENTRY

   **Full Changelog**: https://github.com/OWNER/REPO/compare/PREVIOUS_TAG...v$NEW_VERSION

   ---
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

10. **Trigger Deployments** (if configured)
    - Tag push typically triggers CI/CD
    - Check for GitHub Actions workflows
    - Monitor deployment status
    ```bash
    # Check workflow runs
    gh run list --limit 5
    ```

11. **Output Release Summary**
    Display release information:
    ```markdown
    ✅ Release v$NEW_VERSION Created

    **Version**: $CURRENT_VERSION → $NEW_VERSION
    **Type**: [major|minor|patch]
    **Tag**: v$NEW_VERSION
    **Commits**: X commits
    **GitHub Release**: [URL]

    📋 Changelog:
    $CHANGELOG_ENTRY

    🚀 Next Steps:
    - View release: gh release view v$NEW_VERSION
    - Monitor deployments: gh run watch
    - Announce release: [Share GitHub release URL]

    📦 Published Packages:
    - npm: npm publish (run manually if needed)
    - PyPI: twine upload (run manually if needed)
    ```

**Error Handling**
- If not on main: "Must be on main branch to create release. Switch with: git checkout main"
- If dirty working directory: "Uncommitted changes detected. Commit or stash them first."
- If tests fail: "Tests failing. Fix tests before releasing."
- If build fails: "Build failed. Fix build errors before releasing."
- If behind remote: "Local branch is behind remote. Pull latest changes first: git pull"
- If gh CLI not available: "GitHub CLI (gh) required. Install with: brew install gh"
- If no package.json: "No package.json found. Create one with: npm init"

**Version Bump Examples**
```bash
# Auto-detect from commits (patch if mostly fixes, minor if features)
/release

# Explicit semantic version
/release patch   # 1.0.0 → 1.0.1
/release minor   # 1.0.0 → 1.1.0
/release major   # 1.0.0 → 2.0.0

# Exact version
/release 2.0.0-beta.1  # Pre-release
/release 1.5.0         # Skip to specific version
```

**Conventional Commit Detection**
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` or `feat!:` or `fix!:` → Major version bump
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` → Patch version bump

**Best Practices**
- Always use conventional commit format for accurate auto-versioning
- Run `/build-safe` before `/release` to catch issues
- Review generated changelog before pushing
- Test in staging environment before tagging
- Use pre-release versions (1.0.0-beta.1) for testing
- Never force-push tags (they're permanent)
