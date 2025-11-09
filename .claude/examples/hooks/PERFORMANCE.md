# Hook Performance Impact

## Expected Delays

Hooks run after Edit/Write operations. Each hook adds processing time:

| Hook | Avg Delay | Description |
|------|-----------|-------------|
| check_after_edit | 50-100ms | Basic validation |
| security_scan | 100-200ms | Security patterns |
| code_quality | 200-400ms | ESLint/Prettier |
| react_quality | 150-300ms | React best practices |
| architecture_check | 200-500ms | Architectural rules |
| accessibility | 100-200ms | A11y checks |
| import_organization | 50-150ms | Import sorting |
| bundle_size_check | 300-600ms | Bundle analysis |
| advanced_analysis | 400-800ms | Deep code analysis |
| gwern-checklist | 200-400ms | Quality checklist |

## Preset Impact

| Preset | Hooks | Total Delay | Recommendation |
|--------|-------|-------------|----------------|
| None | 0 | 0ms | Fastest, no automation |
| Quality-focused | 3 | ~200-400ms | Good balance |
| Security-focused | 3 | ~300-600ms | Security-first projects |
| React-focused | 3 | ~250-500ms | React development |
| All | 10+ | ~1000ms+ | Maximum validation |

## Optimization

If edits feel slow:

1. **Review enabled hooks**:
   ```bash
   cat .claude/settings.json | grep -A 20 "PostToolUse"
   ```

2. **Disable specific hooks**:
   - Open `.claude/settings.json`
   - Remove hooks you don't need from `PostToolUse` array
   - Save and restart your editor

3. **Use targeted presets**:
   ```bash
   # Switch to lighter preset
   /enable-hook quality-focused  # Instead of 'all'
   ```

4. **Disable hooks temporarily**:
   ```json
   {
     "hooks": {
       "PostToolUse": []
     }
   }
   ```

## Recommendation

**For most projects**: Start with 2-4 hooks max (quality-focused or security-focused preset)

**For large codebases**: Use minimal hooks or disable during rapid development

**For production code**: Enable more comprehensive validation (security-focused or all)

## Measuring Impact

Test the difference:

```bash
# Disable all hooks
/enable-hook manual

# Edit a file and measure
time <make your edit>

# Enable preset
/enable-hook quality-focused

# Edit same file and measure
time <make your edit>
```

## Trade-offs

**More hooks:**
- ✅ Better code quality
- ✅ Catch errors early
- ✅ Consistent standards
- ❌ Slower edits
- ❌ More interruptions

**Fewer hooks:**
- ✅ Faster edits
- ✅ Less friction
- ❌ Manual quality checks
- ❌ May miss issues

Choose based on your project needs and workflow preferences.
