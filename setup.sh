#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR=".claude"
CHECK_MODE=false
FORCE_MODE=false
STRICT_MODE=false

# Progress tracking
TOTAL_STEPS=6
CURRENT_STEP=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1" >&2
}

print_info() {
  echo -e "${YELLOW}→${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

progress_step() {
  if [ "$CHECK_MODE" = false ]; then
    CURRENT_STEP=$((CURRENT_STEP + 1))
    local percent=$((CURRENT_STEP * 100 / TOTAL_STEPS))
    printf "${BLUE}[%3d%%]${NC} %s\n" "$percent" "$1"
  else
    print_info "$1"
  fi
}

# Validation functions
validate_git_repo() {
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_warning "Not in a git repository - continuing anyway"
    return 1
  fi
  return 0
}

validate_source_directory() {
  if [ ! -d "$SCRIPT_DIR/$CLAUDE_DIR" ]; then
    print_error "Source .claude/ directory not found at: $SCRIPT_DIR/$CLAUDE_DIR"
    print_error "Make sure you're running this script from the claude-starter repository"
    exit 1
  fi

  if [ ! -d "$SCRIPT_DIR/$CLAUDE_DIR/examples" ]; then
    print_error "Examples directory not found at: $SCRIPT_DIR/$CLAUDE_DIR/examples"
    exit 1
  fi

  print_success "Source directory validated"
}

validate_script_dir() {
  if [ -z "$SCRIPT_DIR" ] || [ ! -d "$SCRIPT_DIR" ]; then
    print_error "Could not determine script directory"
    exit 1
  fi
}

validate_package_json() {
  if [ ! -f "package.json" ]; then
    return 1
  fi

  if ! jq empty package.json 2>/dev/null; then
    print_warning "package.json exists but is malformed - skipping framework detection"
    return 1
  fi

  return 0
}

# Dependency checking
check_dependencies() {
  if [ "$CHECK_MODE" = true ]; then
    return 0
  fi

  print_header "Checking Dependencies"

  local warnings=0
  local errors=0

  # Check Node.js version
  if command -v node &> /dev/null; then
    local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$node_version" -lt 18 ]; then
      print_warning "Node.js version $(node -v) < 18 (recommended: 18+)"
      print_info "Some features may not work properly"
      warnings=$((warnings + 1))
    else
      print_success "Node.js $(node -v) found"
    fi
  else
    print_warning "Node.js not found (optional for some features)"
    print_info "Hooks and some commands require Node.js"
    warnings=$((warnings + 1))
  fi

  # Check package managers
  if command -v bun &> /dev/null; then
    print_success "Bun $(bun -v) found"
  elif command -v npm &> /dev/null; then
    print_success "npm $(npm -v) found"
  elif command -v pnpm &> /dev/null; then
    print_success "pnpm $(pnpm -v) found"
  else
    print_warning "No package manager found (bun/npm/pnpm)"
    print_info "Package managers are optional but recommended"
    warnings=$((warnings + 1))
  fi

  # Check git (required)
  if command -v git &> /dev/null; then
    print_success "Git $(git --version | cut -d' ' -f3) found"
  else
    print_error "Git is required but not found"
    print_info "Install git to use Claude Code git workflows"
    errors=$((errors + 1))
  fi

  # Check jq (optional but helpful)
  if command -v jq &> /dev/null; then
    print_success "jq found (enhanced JSON processing)"
  fi

  echo ""

  # Summary and prompt
  if [ $errors -gt 0 ]; then
    print_error "Found $errors critical issues"
    print_warning "Setup may fail or have limited functionality"
    return 1
  elif [ $warnings -gt 0 ]; then
    print_warning "Found $warnings warnings. Setup will continue but some features may not work."
    if [ "$FORCE_MODE" = false ]; then
      read -p "Continue anyway? [Y/n]: " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Setup cancelled. Install missing dependencies and try again."
        exit 1
      fi
    fi
  else
    print_success "All dependencies satisfied"
  fi

  return 0
}

# Backup and rollback functions
backup_existing_config() {
  if [ "$CHECK_MODE" = true ]; then
    return 0
  fi

  if [ -d ".claude" ]; then
    local backup_dir=".claude.backup.$(date +%s)"
    print_info "Backing up existing .claude/ to $backup_dir"
    if mv .claude "$backup_dir" 2>/dev/null; then
      echo "$backup_dir" > /tmp/claude-backup-path-$$
      print_success "Backup created"
    else
      print_warning "Could not create backup - proceeding anyway"
    fi
  fi
}

restore_on_failure() {
  local backup_file="/tmp/claude-backup-path-$$"
  if [ -f "$backup_file" ]; then
    local backup_path=$(cat "$backup_file")
    if [ -d "$backup_path" ]; then
      print_error "Setup failed! Restoring from backup..."
      rm -rf .claude 2>/dev/null || true
      if mv "$backup_path" .claude 2>/dev/null; then
        print_success "Backup restored successfully"
      else
        print_error "Failed to restore backup from: $backup_path"
        print_warning "You may need to manually restore from: $backup_path"
      fi
      rm -f "$backup_file"
    fi
  fi
}

cleanup_backup() {
  local backup_file="/tmp/claude-backup-path-$$"
  if [ -f "$backup_file" ]; then
    local backup_path=$(cat "$backup_file")
    if [ -d "$backup_path" ]; then
      print_info "Setup successful - removing backup"
      rm -rf "$backup_path" 2>/dev/null || true
    fi
    rm -f "$backup_file"
  fi
}

# Helper function to copy skills with proper error handling
copy_skill() {
  local skill_name=$1
  local skill_path="$SCRIPT_DIR/$CLAUDE_DIR/examples/skills/$skill_name"
  local target_path="$CLAUDE_DIR/core/skills/$skill_name"

  if [ "$CHECK_MODE" = true ]; then
    if [ -d "$skill_path" ]; then
      print_info "Would enable: $skill_name skills"
    else
      print_warning "Skill not found: $skill_name (would skip)"
    fi
    return 0
  fi

  if [ ! -d "$skill_path" ]; then
    print_warning "Skill directory not found: $skill_name - skipping"
    return 1
  fi

  if ! mkdir -p "$CLAUDE_DIR/core/skills" 2>/dev/null; then
    print_error "Failed to create skills directory: $CLAUDE_DIR/core/skills"
    return 1
  fi

  if ! cp -r "$skill_path" "$target_path" 2>/dev/null; then
    print_error "Failed to copy $skill_name skills - check permissions"
    return 1
  fi

  print_success "$skill_name skills enabled"
  return 0
}

show_usage() {
  cat << EOF
Usage: ./setup.sh [OPTIONS]

Initialize Claude Code configuration for your project.

OPTIONS:
  --interactive          Guided setup with questions
  --preset <name>        Use a predefined configuration
  --stack <list>         Comma-separated list of technologies
  --check                Preview what would be installed without making changes
  --force                Skip all confirmation prompts
  --help                 Show this help message

PRESETS:
  minimal                Core components only (default)
  nextjs-full            Complete Next.js setup with all skills
  stripe-commerce        E-commerce with Stripe + Next.js
  fullstack-saas         Next.js + Stripe + Supabase + DevOps
  react-focused          React skills with quality hooks
  devops-complete        All DevOps skills + workflows + hooks

STACK OPTIONS:
  Frameworks: next, react, bun
  Integration: stripe, supabase, shelby, resend
  Visualization: d3
  DevOps: devops, hooks

EXAMPLES:
  ./setup.sh --interactive
  ./setup.sh --preset nextjs-full
  ./setup.sh --stack next,stripe,supabase
  ./setup.sh --check --preset fullstack-saas
  ./setup.sh --force --stack next,stripe

EOF
}

detect_framework() {
  print_header "Detecting Project Framework"

  DETECTED=""
  FRAMEWORK="none"

  if ! validate_package_json; then
    print_info "No valid package.json found - skipping framework detection"
    return
  fi

  # Use grep with proper error handling instead of silent suppression
  if grep -q "\"next\"" package.json 2>/dev/null; then
    DETECTED="Next.js"
    FRAMEWORK="next"
  elif grep -q "\"react\"" package.json 2>/dev/null; then
    DETECTED="React"
    FRAMEWORK="react"
  elif grep -q "\"bun\"" package.json 2>/dev/null; then
    DETECTED="Bun"
    FRAMEWORK="bun"
  fi

  if [ -n "$DETECTED" ]; then
    print_success "Detected: $DETECTED"
  else
    print_info "No framework detected (recognized frameworks: Next.js, React, Bun)"
  fi
}

detect_integrations() {
  print_header "Detecting Integrations"

  INTEGRATIONS=()

  if ! validate_package_json; then
    print_info "No valid package.json found - skipping integration detection"
    return
  fi

  # Use proper error handling for all grep operations
  if grep -q "stripe" package.json 2>/dev/null; then
    print_success "Detected: Stripe"
    INTEGRATIONS+=("stripe")
  fi

  if grep -q "supabase" package.json 2>/dev/null; then
    print_success "Detected: Supabase"
    INTEGRATIONS+=("supabase")
  fi

  if grep -q -E "@shelby|shelby-sdk" package.json 2>/dev/null; then
    print_success "Detected: Shelby Protocol"
    INTEGRATIONS+=("shelby")
  fi

  if grep -q "resend" package.json 2>/dev/null; then
    print_success "Detected: Resend"
    INTEGRATIONS+=("resend")
  fi

  if grep -q "\"d3\"" package.json 2>/dev/null; then
    print_success "Detected: D3.js"
    INTEGRATIONS+=("d3")
  fi

  if [ ${#INTEGRATIONS[@]} -eq 0 ]; then
    print_info "No integrations detected"
  fi
}

copy_preset() {
  local preset=$1

  if [ "$CHECK_MODE" = true ]; then
    print_header "Preview: Preset '$preset'"
  else
    print_header "Applying Preset: $preset"
  fi

  case "$preset" in
    minimal)
      print_info "Using core components only (already configured)"
      ;;

    nextjs-full)
      [ "$CHECK_MODE" = false ] && print_info "Enabling Next.js skills..."
      copy_skill "next"
      copy_skill "react"
      ;;

    stripe-commerce)
      [ "$CHECK_MODE" = false ] && print_info "Enabling e-commerce skills..."
      copy_skill "next"
      copy_skill "stripe"
      copy_skill "react"
      ;;

    fullstack-saas)
      [ "$CHECK_MODE" = false ] && print_info "Enabling full-stack SaaS skills..."
      copy_skill "next"
      copy_skill "react"
      copy_skill "stripe"
      copy_skill "supabase"
      copy_skill "devops"
      ;;

    react-focused)
      [ "$CHECK_MODE" = false ] && print_info "Enabling React skills..."
      copy_skill "react"
      ;;

    devops-complete)
      [ "$CHECK_MODE" = false ] && print_info "Enabling DevOps skills..."
      copy_skill "devops"
      ;;

    *)
      print_error "Unknown preset: $preset"
      print_info "Available presets: minimal, nextjs-full, stripe-commerce, fullstack-saas, react-focused, devops-complete"
      exit 1
      ;;
  esac
}

copy_stack_skills() {
  local stack=$1

  if [ "$CHECK_MODE" = true ]; then
    print_header "Preview: Stack '$stack'"
  else
    print_header "Enabling Stack: $stack"
  fi

  IFS=',' read -ra TECHS <<< "$stack"

  for tech in "${TECHS[@]}"; do
    # Trim whitespace from tech name
    tech=$(echo "$tech" | xargs)

    case "$tech" in
      next|nextjs)
        copy_skill "next"
        ;;
      react)
        copy_skill "react"
        ;;
      bun)
        copy_skill "bun"
        ;;
      stripe)
        copy_skill "stripe"
        ;;
      supabase)
        copy_skill "supabase"
        ;;
      shelby)
        copy_skill "shelby"
        ;;
      resend)
        copy_skill "resend"
        ;;
      d3)
        copy_skill "d3"
        ;;
      devops)
        copy_skill "devops"
        ;;
      hooks)
        print_info "To enable hooks, run: /enable-hook <preset>"
        print_info "Available presets: quality-focused, security-focused, react-focused, all"
        ;;
      *)
        print_error "Unknown technology: $tech"
        print_info "Available: next, react, bun, stripe, supabase, shelby, resend, d3, devops, hooks"
        ;;
    esac
  done
}

apply_hook_preset() {
  local preset="$1"
  local settings_file=".claude/settings.json"

  if [ "$CHECK_MODE" = true ]; then
    print_info "Would enable hooks: $preset preset"
    return 0
  fi

  # Check if Node.js is available
  if ! command -v node &> /dev/null; then
    print_warning "Node.js not found - cannot auto-enable hooks"
    print_info "After installing Node.js, run: /enable-hook $preset"
    return 1
  fi

  # Check if settings.json exists
  if [ ! -f "$settings_file" ]; then
    print_error "Settings file not found: $settings_file"
    return 1
  fi

  print_info "Enabling hooks: $preset"

  # Define hook arrays for each preset
  local hooks_json
  case "$preset" in
    minimal|manual)
      # No hooks for minimal/manual
      hooks_json='[]'
      ;;
    quality-focused)
      hooks_json='[{
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/check_after_edit.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/code_quality.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/import_organization.ts"}
        ]
      }]'
      ;;
    security-focused)
      hooks_json='[{
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/security_scan.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/architecture_check.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/advanced_analysis.ts"}
        ]
      }]'
      ;;
    react-focused)
      hooks_json='[{
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/react_quality.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/accessibility.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/check_after_edit.ts"}
        ]
      }]'
      ;;
    all)
      hooks_json='[{
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/check_after_edit.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/security_scan.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/code_quality.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/architecture_check.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/react_quality.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/accessibility.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/import_organization.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/bundle_size_check.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/advanced_analysis.ts"},
          {"type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/examples/hooks/gwern-checklist.ts"}
        ]
      }]'
      ;;
    *)
      print_error "Unknown hook preset: $preset"
      return 1
      ;;
  esac

  # Update settings.json using Node.js
  if node -e "
    const fs = require('fs');
    const settings = JSON.parse(fs.readFileSync('$settings_file', 'utf8'));
    const hooks = $hooks_json;

    if (!settings.hooks) settings.hooks = {};
    settings.hooks.PostToolUse = hooks;

    fs.writeFileSync('$settings_file', JSON.stringify(settings, null, 2) + '\n');
  " 2>/dev/null; then
    if [ "$preset" != "minimal" ] && [ "$preset" != "manual" ]; then
      print_success "Hooks enabled successfully ($preset)"
    fi
    return 0
  else
    print_error "Failed to update settings.json"
    print_info "You can manually run: /enable-hook $preset"
    return 1
  fi
}

interactive_setup() {
  if [ "$CHECK_MODE" = true ]; then
    print_header "Preview: Interactive Setup"
    print_info "Would run interactive wizard (requires terminal input)"
    return
  fi

  print_header "Claude Code Interactive Setup"

  echo "This wizard will help you configure Claude Code for your project."
  echo ""

  detect_framework
  detect_integrations

  echo ""
  echo "What would you like to enable?"
  echo ""
  echo "1) Use detected configuration (auto-enable based on package.json)"
  echo "2) Choose a preset configuration"
  echo "3) Select technologies manually"
  echo "4) Minimal setup (core only)"
  echo ""

  local choice
  if [ "$FORCE_MODE" = true ]; then
    choice=1
    print_info "Force mode: Using detected configuration (option 1)"
  else
    read -p "Enter choice [1-4]: " choice
  fi

  case $choice in
    1)
      if [ "$FRAMEWORK" != "none" ]; then
        copy_stack_skills "$FRAMEWORK"
      fi

      if [ ${#INTEGRATIONS[@]} -gt 0 ]; then
        stack_list=$(IFS=,; echo "${INTEGRATIONS[*]}")
        copy_stack_skills "$stack_list"
      fi
      ;;

    2)
      echo ""
      echo "Available presets:"
      echo "1) nextjs-full      - Complete Next.js setup"
      echo "2) stripe-commerce  - E-commerce with Stripe"
      echo "3) fullstack-saas   - Next.js + Stripe + Supabase + DevOps"
      echo "4) react-focused    - React development"
      echo "5) devops-complete  - DevOps automation"
      echo ""
      read -p "Enter preset number [1-5]: " preset_choice

      case $preset_choice in
        1) copy_preset "nextjs-full" ;;
        2) copy_preset "stripe-commerce" ;;
        3) copy_preset "fullstack-saas" ;;
        4) copy_preset "react-focused" ;;
        5) copy_preset "devops-complete" ;;
        *) print_error "Invalid choice" ; exit 1 ;;
      esac
      ;;

    3)
      echo ""
      echo "Enter technologies (comma-separated):"
      echo "Available: next, react, bun, stripe, supabase, shelby, resend, d3, devops"
      echo ""
      read -p "Technologies: " manual_stack
      copy_stack_skills "$manual_stack"
      ;;

    4)
      print_info "Using minimal configuration (core only)"
      ;;

    *)
      print_error "Invalid choice"
      exit 1
      ;;
  esac

  echo ""

  local enable_hooks
  if [ "$FORCE_MODE" = true ]; then
    enable_hooks="n"
    print_info "Force mode: Skipping hooks setup (enable later with /enable-hook)"
  else
    read -p "Would you like to enable quality hooks? [y/N]: " enable_hooks
  fi

  if [[ "$enable_hooks" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Hook presets:"
    echo "1) quality-focused   - TypeScript, lint, format, code quality"
    echo "2) security-focused  - Security scans, architecture checks"
    echo "3) react-focused     - React best practices, accessibility"
    echo "4) all              - Enable all hooks"
    echo "5) manual           - I'll enable hooks manually later"
    echo ""
    read -p "Enter preset number [1-5]: " hook_choice

    echo ""
    local preset_name=""
    case $hook_choice in
      1) preset_name="quality-focused" ;;
      2) preset_name="security-focused" ;;
      3) preset_name="react-focused" ;;
      4) preset_name="all" ;;
      5) preset_name="manual" ;;
      *)
        print_warning "Invalid choice - skipping hook setup"
        print_info "You can enable hooks later with: /enable-hook <preset>"
        return
        ;;
    esac

    if [ "$preset_name" != "manual" ]; then
      apply_hook_preset "$preset_name"
    else
      print_info "Hooks will remain disabled. Enable later with: /enable-hook <preset>"
    fi
  fi
}

setup_project_directory() {
  if [ "$CHECK_MODE" = true ]; then
    print_header "Preview: Project Setup"
    print_info "Would copy .claude/ directory to current location"

    if [ -d "$CLAUDE_DIR" ]; then
      print_warning "Would overwrite existing .claude/ directory"
    fi
    return
  fi

  print_header "Setting Up Project Directory"

  # Backup existing config before any modifications
  backup_existing_config

  if [ -d "$CLAUDE_DIR" ]; then
    # Note: backup_existing_config already moved the directory
    # This block only executes if backup failed
    print_warning "Existing .claude/ directory found (backup may have failed)"

    if [ "$FORCE_MODE" = false ]; then
      read -p "Overwrite? [y/N]: " overwrite
      if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled by user"
        exit 1
      fi
    else
      print_info "Force mode enabled - overwriting existing directory"
    fi

    if ! rm -rf "$CLAUDE_DIR" 2>/dev/null; then
      print_error "Failed to remove existing .claude/ directory - check permissions"
      exit 1
    fi
  fi

  print_info "Copying .claude/ directory..."

  if ! cp -r "$SCRIPT_DIR/$CLAUDE_DIR" . 2>/dev/null; then
    print_error "Failed to copy .claude/ directory from: $SCRIPT_DIR/$CLAUDE_DIR"
    print_error "Check that the source directory exists and you have proper permissions"
    exit 1
  fi

  if ! mkdir -p "$CLAUDE_DIR/core/skills" "$CLAUDE_DIR/core/agents" 2>/dev/null; then
    print_error "Failed to create core directories - check permissions"
    exit 1
  fi

  print_success "Project directory created"
}

generate_env_example() {
  if [ "$CHECK_MODE" = true ]; then
    print_header "Preview: Environment Template"
    print_info "Would create .env.example with framework and integration defaults"
    return
  fi

  print_header "Generating Environment Template"

  if ! cat > .env.example << 'EOF'
# Claude Code Configuration
# Copy this file to .env and fill in your values

# Framework Detection (auto-detected from package.json)
# Options: nextjs, react, bun, django, rails, none
FRAMEWORK=

# Feature Flags
ENABLE_STRIPE=false
ENABLE_SUPABASE=false
ENABLE_D3=false

# Hook Configuration
# Options: quality-focused, security-focused, react-focused, all, off
HOOKS_PRESET=off

# API Keys (if needed for integrations)
# STRIPE_SECRET_KEY=
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
EOF
  then
    print_error "Failed to create .env.example - check permissions"
    return 1
  fi

  print_success "Created .env.example"
  print_info "Copy .env.example to .env and configure as needed"
}

validate_typescript() {
  if [ "$STRICT_MODE" = false ] || [ "$CHECK_MODE" = true ]; then
    return 0
  fi

  print_header "TypeScript Validation (Strict Mode)"

  if [ -f "tsconfig.json" ] && command -v tsc &> /dev/null; then
    print_info "Running TypeScript compiler..."
    if tsc --noEmit 2>&1; then
      print_success "TypeScript validation passed"
      return 0
    else
      print_error "TypeScript errors found in strict mode"
      print_warning "Setup will not continue due to --strict flag"
      return 1
    fi
  elif [ -f "tsconfig.json" ]; then
    print_warning "TypeScript config found but tsc not available"
    print_info "Skipping TypeScript validation"
    return 0
  else
    print_info "No TypeScript configuration found - skipping validation"
    return 0
  fi
}

run_integration_test() {
  if [ "$CHECK_MODE" = true ]; then
    return 0
  fi

  print_header "Running Integration Test"

  local test_passed=true

  # Test 1: Verify settings.json is valid JSON
  print_info "Testing settings.json validity..."
  if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json', 'utf8'))" 2>/dev/null; then
      print_success "settings.json is valid JSON"
    else
      print_error "settings.json is invalid JSON"
      test_passed=false
    fi
  else
    print_warning "Node.js not found - skipping JSON validation"
  fi

  # Test 2: Verify core files exist
  print_info "Testing core file existence..."
  local required_files=(
    ".claude/core/agents/security-auditor.md"
    ".claude/core/agents/database-architect.md"
    ".claude/core/agents/api-builder.md"
    ".claude/core/commands/commit.md"
    ".claude/core/commands/create-pr.md"
    ".claude/settings.json"
  )

  local missing_files=0
  for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
      print_error "Missing required file: $file"
      test_passed=false
      missing_files=$((missing_files + 1))
    fi
  done

  if [ $missing_files -eq 0 ]; then
    print_success "All core files present"
  fi

  # Test 3: Verify directory structure
  print_info "Testing directory structure..."
  local required_dirs=(
    ".claude/core"
    ".claude/core/agents"
    ".claude/core/commands"
    ".claude/examples"
    ".claude/examples/hooks"
  )

  local missing_dirs=0
  for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
      print_error "Missing required directory: $dir"
      test_passed=false
      missing_dirs=$((missing_dirs + 1))
    fi
  done

  if [ $missing_dirs -eq 0 ]; then
    print_success "Directory structure correct"
  fi

  # Test 4: If hooks enabled, verify they exist
  if [ -f ".claude/settings.json" ]; then
    if grep -q '"PostToolUse"' .claude/settings.json 2>/dev/null; then
      print_info "Testing hook files..."
      if grep -q "check_after_edit" .claude/settings.json 2>/dev/null; then
        if [ -f ".claude/examples/hooks/check_after_edit.ts" ]; then
          print_success "Hook files accessible"
        else
          print_warning "Hooks enabled but hook files not found"
        fi
      fi
    fi
  fi

  # Summary
  echo ""
  if [ "$test_passed" = true ]; then
    print_success "All integration tests passed! ✓"
    echo ""
    return 0
  else
    print_error "Some integration tests failed"
    print_warning "Setup may be incomplete - review errors above"
    echo ""
    return 1
  fi
}

show_summary() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_success "🎉 You're all set!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "You now have:"
  local agents=$(find .claude/core/agents -name "*.md" -not -path "*/docs/*" 2>/dev/null | wc -l | tr -d ' ')
  local commands=$(find .claude/core/commands -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  local skills=$(find .claude/core/skills -name "skill.md" -o -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
  echo "  ✓ $agents agents ready to help"
  echo "  ✓ $commands commands at your fingertips"
  if [ "$skills" -gt 0 ]; then
    echo "  ✓ $skills skills loaded"
  fi
  echo "  ✓ Automated quality checks"
  echo "  ✓ Git workflow superpowers"
  echo ""

  print_info "Your code just got smarter. Let's build something great!"
  echo ""

  echo "Next steps:"
  echo ""
  echo "  1. Restart your editor (VS Code/Cursor) to load new config"
  echo "  2. Try editing a file - hooks will validate automatically"
  echo "  3. Run: ./quick-validate.sh (verify setup)"
  echo "  4. See: .claude/FIRST_STEPS.md (your first 5 minutes)"
  echo "  5. See: .claude/STATUS.md (your active configuration)"
  echo "  6. Read: CLAUDE.md (full development guide)"
  echo ""

  echo "Troubleshooting:"
  echo ""
  echo "  If hooks aren't running:"
  echo "    1. Check .claude/settings.json is valid JSON"
  echo "    2. Verify file permissions: ls -la .claude/examples/hooks/"
  echo "    3. Restart your editor/IDE"
  echo "    4. Run: ./quick-validate.sh"
  echo "    5. See: .claude/examples/hooks/README.md"
  echo ""

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  print_success "All done!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main execution
main() {
  # Set up error trap for rollback
  trap 'restore_on_failure' ERR

  # Parse command-line arguments
  local MODE=""
  local MODE_ARG=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help|-h)
        show_usage
        exit 0
        ;;
      --check)
        CHECK_MODE=true
        shift
        ;;
      --force)
        FORCE_MODE=true
        shift
        ;;
      --strict)
        STRICT_MODE=true
        shift
        ;;
      --interactive)
        MODE="interactive"
        shift
        ;;
      --preset)
        MODE="preset"
        MODE_ARG="$2"
        if [ -z "$MODE_ARG" ]; then
          print_error "Missing preset name after --preset"
          show_usage
          exit 1
        fi
        shift 2
        ;;
      --stack)
        MODE="stack"
        MODE_ARG="$2"
        if [ -z "$MODE_ARG" ]; then
          print_error "Missing stack list after --stack"
          show_usage
          exit 1
        fi
        shift 2
        ;;
      *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
    esac
  done

  # Dependency checks (before validation)
  check_dependencies

  # Validation checks
  progress_step "Validating environment..."
  validate_script_dir
  validate_source_directory

  if [ "$CHECK_MODE" = false ]; then
    validate_git_repo || true  # Don't fail if not in a git repo
  fi

  # Setup project directory
  progress_step "Setting up project directory..."
  setup_project_directory

  # Execute based on mode
  progress_step "Configuring features..."
  if [ "$MODE" = "interactive" ]; then
    interactive_setup
  elif [ "$MODE" = "preset" ]; then
    copy_preset "$MODE_ARG"
  elif [ "$MODE" = "stack" ]; then
    copy_stack_skills "$MODE_ARG"
  else
    # Auto-detection mode
    detect_framework
    detect_integrations

    if [ "$FRAMEWORK" != "none" ] || [ ${#INTEGRATIONS[@]} -gt 0 ]; then
      echo ""
      echo "Detected configuration:"
      if [ "$FRAMEWORK" != "none" ]; then
        echo "  Framework: $DETECTED"
      fi
      if [ ${#INTEGRATIONS[@]} -gt 0 ]; then
        echo "  Integrations: ${INTEGRATIONS[*]}"
      fi
      echo ""

      if [ "$FORCE_MODE" = false ] && [ "$CHECK_MODE" = false ]; then
        read -p "Auto-configure based on detection? [Y/n]: " auto_config

        if [[ "$auto_config" =~ ^[Nn]$ ]]; then
          interactive_setup
          generate_env_example
          run_integration_test

          # Generate STATUS.md
          if [ -f ".claude/scripts/generate-status.sh" ]; then
            bash .claude/scripts/generate-status.sh >/dev/null 2>&1 || true
          fi

          show_summary
          exit 0
        fi
      fi

      # Auto-configure
      if [ "$FRAMEWORK" != "none" ]; then
        copy_stack_skills "$FRAMEWORK"
      fi

      if [ ${#INTEGRATIONS[@]} -gt 0 ]; then
        stack_list=$(IFS=,; echo "${INTEGRATIONS[*]}")
        copy_stack_skills "$stack_list"
      fi
    else
      if [ "$CHECK_MODE" = false ]; then
        print_info "No framework detected. Using interactive setup..."
        interactive_setup
      fi
    fi
  fi

  progress_step "Generating environment template..."
  generate_env_example

  progress_step "Running integration tests..."
  run_integration_test

  # TypeScript validation (if --strict flag used)
  validate_typescript

  # Generate STATUS.md
  if [ "$CHECK_MODE" = false ] && [ -f ".claude/scripts/generate-status.sh" ]; then
    bash .claude/scripts/generate-status.sh >/dev/null 2>&1 || true
  fi

  # Clean up backup on success
  cleanup_backup

  progress_step "Setup complete!"
  show_summary
}

main "$@"
