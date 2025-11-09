# Shelby Protocol Skills for Claude Code

A comprehensive suite of Claude Code skills for working with the Shelby Protocol - a decentralized blob storage network built on Aptos blockchain.

## Overview

These skills provide expert guidance for developers working with Shelby's decentralized storage network, covering everything from initial setup to advanced SDK integration and video streaming.

## Available Skills

### 1. shelby-quickstart
**Purpose**: First-time onboarding and setup

**Use when**:
- New to Shelby Protocol
- Need initial setup guidance
- Choosing between CLI/SDK/media player
- Want to understand token system

**Key features**:
- Shelby Protocol overview
- Token system explanation (Aptos + ShelbyUSD)
- CLI quickstart walkthrough
- SDK quickstart for developers
- Media player quickstart for React apps
- Next steps and resources

[View Skill →](./shelby-quickstart/SKILL.md)

---

### 2. shelby-cli-helper
**Purpose**: Expert CLI operations and troubleshooting

**Use when**:
- Uploading/downloading files via CLI
- Managing accounts and contexts
- Funding accounts with tokens
- Troubleshooting CLI errors
- Verifying blob uploads

**Key features**:
- Installation and configuration
- File upload/download operations
- Account management and funding
- Common error troubleshooting
- Blob verification and listing
- Automation and scripting

[View Skill →](./shelby-cli-helper/SKILL.md)

---

### 3. shelby-sdk-integration
**Purpose**: TypeScript SDK integration for Node.js and browser

**Use when**:
- Building applications with Shelby storage
- Need programmatic blob management
- Integrating with Node.js or browser apps
- Implementing Aptos authentication
- Handling upload/download in code

**Key features**:
- Node.js and browser setup
- Ed25519 authentication
- Blob upload patterns
- Error handling strategies
- Security best practices
- Production-ready examples

[View Skill →](./shelby-sdk-integration/SKILL.md)

---

### 4. shelby-media-player
**Purpose**: React video player integration

**Use when**:
- Building video streaming applications
- Need React video components
- Implementing HLS/DASH streaming
- Customizing video player UI
- Streaming from Shelby storage

**Key features**:
- SimpleShakaVideoPlayer setup
- TailwindCSS 4 configuration
- Custom player layouts
- Shelby storage integration
- Advanced customization with usePlayer hook
- Analytics and playlist examples

[View Skill →](./shelby-media-player/SKILL.md)

---

## Quick Start Guide

### For Complete Beginners
1. Start with `shelby-quickstart` to understand the ecosystem
2. Follow CLI path for easiest onboarding
3. Use `shelby-cli-helper` for ongoing CLI work

### For Backend Developers
1. Review `shelby-quickstart` for overview
2. Use `shelby-sdk-integration` for Node.js integration
3. Reference `shelby-cli-helper` for manual operations

### For Frontend Developers
1. Start with `shelby-quickstart` for basics
2. Use `shelby-media-player` for video components
3. Use `shelby-sdk-integration` for browser uploads

### For Full-Stack Teams
1. Begin with `shelby-quickstart` for team onboarding
2. Use `shelby-cli-helper` for DevOps and automation
3. Use `shelby-sdk-integration` for backend services
4. Use `shelby-media-player` for frontend video features

## What is Shelby Protocol?

Shelby is a decentralized hot storage network built on Aptos blockchain, designed for read-heavy workloads:

- **Video Streaming** - Adaptive HLS/DASH streaming with dedicated infrastructure
- **AI Training** - Large dataset storage and retrieval
- **Data Analytics** - Distributed data pipeline storage
- **Decentralized CDN** - Content delivery with censorship resistance

### Key Features

- **Read-Based Incentives** - Payment for reads ensures storage provider quality
- **Dedicated Infrastructure** - Private fiber networks for consistent performance
- **Data Integrity** - Novel auditing system verifies data correctness
- **Efficient Erasure Coding** - Reduces costs while maintaining redundancy
- **Aptos Blockchain** - High throughput, low finality coordination layer

### Developer Tools

1. **CLI Tool** - `@shelby-protocol/cli`
   - Command-line interface for file operations
   - Manual uploads, downloads, account management
   - Perfect for automation and DevOps

2. **TypeScript SDK** - `@shelby-protocol/sdk`
   - Node.js and browser support
   - Programmatic blob management
   - Production-ready integrations

3. **Media Player** - `@shelby-protocol/player`
   - React components for video streaming
   - Shaka Player integration
   - Custom layouts and controls

### Token System

Two token types required:

1. **Aptos Tokens (APT)** - Gas fees for blockchain transactions
2. **ShelbyUSD** - Upload fees and Shelby operations

Both are required to upload files to the network.

## Skill Usage Examples

### Example 1: First Upload

**User**: "I want to upload a video to Shelby"

**Recommended Path**:
1. `shelby-quickstart` → Guides through initial setup
2. `shelby-cli-helper` → Provides upload command with proper parameters

### Example 2: Building a Video Platform

**User**: "I'm building a video streaming platform with Shelby"

**Recommended Path**:
1. `shelby-quickstart` → Overview of ecosystem
2. `shelby-cli-helper` → Manual video uploads for testing
3. `shelby-sdk-integration` → Backend upload service
4. `shelby-media-player` → Frontend video player components

### Example 3: Automated Upload Pipeline

**User**: "I need to automate video uploads to Shelby"

**Recommended Path**:
1. `shelby-cli-helper` → CLI automation with bash scripts
2. `shelby-sdk-integration` → Node.js service for complex workflows

## Installation

These skills are Claude Code skills for the Shelby Protocol. They are automatically loaded when placed in `.claude/skills/` directory.

### For This Project (Local)
Skills are already in:
```
.claude/skills/shelby-quickstart/
.claude/skills/shelby-cli-helper/
.claude/skills/shelby-sdk-integration/
.claude/skills/shelby-media-player/
```

### For Your Projects (Copy Skills)
```bash
# Copy all Shelby skills to your project
cp -r .claude/skills/shelby-* /path/to/your/project/.claude/skills/

# Or copy individual skills
cp -r .claude/skills/shelby-quickstart /path/to/your/project/.claude/skills/
```

### For Personal Use (Global)
```bash
# Copy to personal Claude Code skills directory
cp -r .claude/skills/shelby-* ~/.claude/skills/
```

## Verification

After installation, restart Claude Code and verify skills are loaded:

```bash
# List loaded skills
/skills
```

You should see:
- shelby-quickstart
- shelby-cli-helper
- shelby-sdk-integration
- shelby-media-player

## Testing Skills

Test each skill by asking relevant questions:

```
# Test shelby-quickstart
"I'm new to Shelby. How do I get started?"

# Test shelby-cli-helper
"How do I upload a file to Shelby using the CLI?"

# Test shelby-sdk-integration
"Set up Shelby SDK in my Node.js application"

# Test shelby-media-player
"Create a React video player component for Shelby"
```

## Skill Architecture

Each skill follows Claude Code best practices:

```
skill-name/
├── SKILL.md          # Main skill definition with YAML frontmatter
├── README.md         # Skill documentation
└── materials/        # (Optional) Reference materials and templates
```

### Skill Components

1. **YAML Frontmatter** - Metadata, description, allowed tools, model
2. **Purpose** - What the skill does
3. **When to Use** - Trigger conditions for auto-invocation
4. **Process** - Step-by-step procedures
5. **Examples** - Real-world usage scenarios
6. **Best Practices** - Guidance and recommendations
7. **Error Handling** - Common issues and solutions

## Resources

### Official Shelby Resources
- **Website**: https://shelby.xyz
- **Documentation**: https://docs.shelby.xyz
- **Explorer**: https://explorer.shelby.xyz
- **Whitepaper**: https://shelby.xyz/whitepaper.pdf
- **API Endpoint**: https://api.shelbynet.shelby.xyz/shelby

### Documentation Source
These skills were built from official documentation fetched from https://docs.shelby.xyz on 2025-11-06.

### Skill Development
- **skill-builder** - Meta-skill for creating new Claude Code skills
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code

## Contributing

To improve or extend these skills:

1. **Edit Skill Files** - Modify `SKILL.md` files
2. **Test Changes** - Restart Claude Code and test
3. **Update Documentation** - Keep README.md in sync
4. **Share Improvements** - Contribute back to the community

## License

These skills are provided as educational resources for working with the Shelby Protocol.

---

© 2025 - Built with the skill-builder skill for Claude Code
