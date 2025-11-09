Generate intelligent commit messages following conventional commits format.

Usage: `/commit [message]`
- Without arguments: Analyzes staged changes and generates commit message
- With message: Validates and formats the provided message

Execute the following workflow:

1. **Check Staged Changes**
   ```bash
   # Check if there are staged files
   git diff --cached --name-only

   # Get detailed staged changes
   git diff --cached --stat

   # Show actual content changes
   git diff --cached
   ```
   - Verify files are staged (error if nothing staged)
   - Analyze type of changes (added, modified, deleted)
   - Understand scope of changes

2. **Analyze Changes**
   ```bash
   # Count files by type
   git diff --cached --name-only | grep -E '\.(tsx?|jsx?|py|go|rs)$'

   # Identify affected areas
   git diff --cached --name-only | cut -d'/' -f1-2 | sort -u
   ```
   Categorize changes:
   - **Frontend**: UI components, pages, styles
   - **Backend**: API routes, services, database
   - **Tests**: Test files (***.test.**, ***.spec.**)
   - **Docs**: README, documentation files
   - **Config**: Package.json, tsconfig, env files
   - **Build**: Build scripts, CI/CD files

3. **Determine Commit Type**
   Based on changes, select type:
   - `feat`: New feature or capability
   - `fix`: Bug fix
   - `refactor`: Code change that neither fixes bug nor adds feature
   - `perf`: Performance improvement
   - `style`: Formatting, missing semicolons, etc (no code change)
   - `test`: Adding or updating tests
   - `docs`: Documentation only changes
   - `build`: Build system or dependencies (package.json, etc)
   - `ci`: CI/CD configuration changes
   - `chore`: Other changes (gitignore, etc)
   - `revert`: Reverts a previous commit

4. **Determine Scope** (optional but recommended)
   Identify affected module/component:
   - `auth`: Authentication changes
   - `api`: API-related changes
   - `ui`: UI components
   - `db`: Database changes
   - `deps`: Dependency updates
   - `config`: Configuration
   - Or use directory/module name

5. **Generate Commit Subject**
   Format: `type(scope): description`

   Rules:
   - Keep under 72 characters
   - Use imperative mood ("add" not "added" or "adds")
   - Lowercase first letter (except proper nouns)
   - No period at end
   - Be specific but concise

   Examples:
   ```
   feat(auth): add email verification flow
   fix(api): resolve race condition in user creation
   refactor(db): extract query logic to repository pattern
   docs(readme): update installation instructions
   test(auth): add integration tests for login flow
   ```

6. **Generate Commit Body** (if needed)
   For complex changes, add body:
   ```
   type(scope): description

   - Detailed point 1
   - Detailed point 2
   - Detailed point 3

   Breaking change explanation if applicable
   ```

   Include body when:
   - Change affects multiple areas
   - Breaking change introduced
   - Complex logic needs explanation
   - Related to specific issue

7. **Add Footer** (if applicable)
   ```
   type(scope): description

   Body text

   Closes #123
   BREAKING CHANGE: Description of breaking change
   ```

   Footer elements:
   - `Closes #123`: Links and closes issue
   - `Fixes #123`: Links and closes bug
   - `Refs #123`: References issue without closing
   - `BREAKING CHANGE:`: Describes breaking changes (triggers major version)

8. **Build Complete Commit Message**
   ```
   type(scope): subject line

   Optional body with more details.
   Can be multiple paragraphs.

   Closes #123
   ```

9. **Validate Message**
   Check:
   - Subject line <= 72 characters
   - Blank line after subject (if body exists)
   - Body lines <= 100 characters
   - Type is valid conventional commit type
   - Imperative mood in subject
   - No period at end of subject

10. **Execute Commit**
    ```bash
    # Create commit with generated message
    git commit -m "$(cat <<'EOF'
    type(scope): subject

    Optional body

    Closes #123
    EOF
    )"
    ```
    - Commit with formatted message
    - Show commit hash after completion

11. **Output Commit Summary**
    ```markdown
    ✅ Commit Created

    **Type**: feat
    **Scope**: auth
    **Message**: add email verification flow
    **Files**: 3 files changed, 45 insertions(+), 12 deletions(-)
    **Hash**: abc1234

    📝 Full Message:
    ```
    feat(auth): add email verification flow

    - Add email verification endpoint
    - Implement token generation and validation
    - Update user model with verified_at field

    Closes #123
    ```

    Next steps:
    - Push changes: git push
    - Create PR: /create-pr
    - Amend if needed: git commit --amend
    ```

**Smart Detection Examples**

Example 1: New Feature
```bash
# Staged: src/auth/verify-email.ts, tests/auth/verify.test.ts
→ feat(auth): add email verification flow
```

Example 2: Bug Fix
```bash
# Staged: src/api/users.ts (fixed race condition)
→ fix(api): resolve race condition in user creation
```

Example 3: Refactor
```bash
# Staged: src/db/*.ts (extracted repository pattern)
→ refactor(db): extract query logic to repository pattern
```

Example 4: Documentation
```bash
# Staged: README.md, docs/setup.md
→ docs: update installation and setup instructions
```

Example 5: Multiple Areas (needs body)
```bash
# Staged: src/api/*, src/db/*, tests/*
→ feat(api): implement user profile endpoints

- Add GET /api/users/:id endpoint
- Add PUT /api/users/:id endpoint
- Add user repository for database access
- Include comprehensive integration tests

Closes #456
```

**Error Handling**
- If nothing staged: "No staged changes found. Stage files with: git add <files>"
- If message too long: "Subject line too long (72 char max). Current: X chars"
- If invalid type: "Invalid commit type. Use: feat, fix, refactor, perf, style, test, docs, build, ci, chore"
- If not in git repo: "Not a git repository. Initialize with: git init"

**Conventional Commit Format**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Valid Types**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `style`: Formatting changes
- `test`: Test changes
- `docs`: Documentation
- `build`: Build system
- `ci`: CI/CD changes
- `chore`: Maintenance
- `revert`: Revert commit

**Best Practices**
- Stage related changes together
- Keep commits atomic (one logical change per commit)
- Write commit messages that explain WHY, not just WHAT
- Use conventional commits for automated changelog generation
- Reference issues in commit messages (#123)
- Use `BREAKING CHANGE:` footer for breaking changes
- Use present tense, imperative mood ("add" not "added")
