---
name: shelby-cli-helper
description: Use when working with the Shelby Protocol CLI for uploading files, downloading blobs, managing accounts, or configuring contexts. Helps with initialization, funding accounts with ShelbyUSD/Aptos tokens, file operations, and troubleshooting Shelby CLI issues. Invoke for Shelby storage, decentralized blob storage, or video streaming uploads.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Shelby CLI Helper

## Purpose

This skill assists developers working with the Shelby Protocol CLI, a command-line tool for interacting with Shelby's decentralized blob storage network built on Aptos blockchain. It provides guidance on setup, file operations, account management, and troubleshooting.

## When to Use

This skill should be invoked when:
- User mentions "Shelby CLI", "shelby upload", "shelby download", or "shelby init"
- User needs to configure Shelby network contexts or accounts
- User wants to upload files to decentralized storage
- User needs to fund Shelby accounts with ShelbyUSD or Aptos tokens
- User is troubleshooting Shelby CLI errors (insufficient tokens, upload failures)
- User asks about blob management, expiration dates, or account balances
- User wants to verify uploads or list stored blobs

## Process

### 1. Initial Setup and Configuration

**Check if CLI is installed:**
```bash
shelby --version
```

**If not installed, provide installation command:**
```bash
npm i -g @shelby-protocol/cli
```

**Initialize configuration:**
```bash
shelby init
```

This creates `~/.shelby/config.yaml` with network contexts and prompts for API key (optional but recommended to avoid rate limits).

### 2. Account Management

**List available contexts and accounts:**
```bash
shelby context list
shelby account list
```

**Check account balances:**
```bash
shelby account balance
```

**Fund account with tokens:**

For **Aptos tokens** (gas fees):
```bash
aptos account fund-with-faucet --profile shelby-alice --amount 1000000000000000000
```

For **ShelbyUSD tokens** (Shelby operations):
```bash
shelby faucet --no-open
```

### 3. File Upload Operations

**Upload file with expiration:**
```bash
shelby upload /path/to/file.txt files/file.txt -e tomorrow --assume-yes
```

**Parameters:**
- First argument: Local source file path
- Second argument: Destination blob name in Shelby storage
- `-e, --expiration`: Expiration date (e.g., "tomorrow", "7 days", "2025-12-31")
- `--assume-yes`: Skip confirmation prompts

**Verify upload:**
```bash
shelby account blobs
```

### 4. File Download Operations

**Download blob to local file:**
```bash
shelby download files/file.txt /local/path/file.txt
```

**Parameters:**
- First argument: Source blob name in Shelby storage
- Second argument: Local destination file path

### 5. Troubleshooting Common Issues

**Insufficient ShelbyUSD Error:**

**Problem:** Upload fails with "insufficient ShelbyUSD" message.

**Solution:**
1. Check current balance:
   ```bash
   shelby account balance
   ```

2. Fund account via faucet:
   ```bash
   shelby faucet --no-open
   ```

3. Retry upload after funding

**Insufficient Aptos Tokens:**

**Problem:** Transaction fails due to insufficient gas.

**Solution:**
1. Fund with Aptos faucet:
   ```bash
   aptos account fund-with-faucet --profile <profile-name> --amount 1000000000000000000
   ```

**Configuration Issues:**

**Problem:** CLI can't find configuration or account.

**Solution:**
1. Re-run initialization:
   ```bash
   shelby init
   ```

2. List and verify contexts:
   ```bash
   shelby context list
   shelby account list
   ```

## Output Format

When helping users with Shelby CLI:

1. **Assess current state** - Check if CLI is installed and configured
2. **Provide step-by-step commands** - Give exact bash commands to run
3. **Explain parameters** - Clarify what each flag/argument does
4. **Verify results** - Show commands to verify operations succeeded
5. **Handle errors** - If errors occur, provide troubleshooting steps

## Best Practices

- **Always check balances** before uploads to avoid insufficient token errors
- **Use meaningful blob names** with path-like structure (e.g., `videos/2024/intro.mp4`)
- **Set appropriate expiration dates** based on data retention needs
- **Verify uploads** using `shelby account blobs` after operations
- **Use `--assume-yes` flag** for automation/scripts to skip confirmations
- **Keep API keys secure** - Never commit config files to version control
- **Use context switching** for managing multiple networks (local, shelbynet)

## Examples

### Example 1: First-time Setup

**User Request**: "I want to start using Shelby CLI to upload videos"

**Process**:
1. Check if CLI is installed (`shelby --version`)
2. If not, install: `npm i -g @shelby-protocol/cli`
3. Initialize: `shelby init`
4. List contexts: `shelby context list`
5. Fund account with both token types
6. Verify balances: `shelby account balance`

**Output**: Step-by-step setup with verification at each stage.

### Example 2: Upload Video File

**User Request**: "Upload my video.mp4 file to Shelby storage"

**Process**:
1. Check account balance first
2. Provide upload command:
   ```bash
   shelby upload ./video.mp4 videos/my-video.mp4 -e "30 days" --assume-yes
   ```
3. Verify upload:
   ```bash
   shelby account blobs
   ```

**Output**: Upload command with appropriate expiration and verification.

### Example 3: Troubleshoot Upload Failure

**User Request**: "My upload failed with 'insufficient ShelbyUSD' error"

**Process**:
1. Explain the error (need ShelbyUSD tokens for uploads)
2. Check balance: `shelby account balance`
3. Fund account: `shelby faucet --no-open`
4. Verify funding: `shelby account balance`
5. Retry upload command

**Output**: Clear troubleshooting steps with verification.

### Example 4: Download Multiple Blobs

**User Request**: "Download all my uploaded videos"

**Process**:
1. List all blobs: `shelby account blobs`
2. Read output to get blob names
3. Provide download commands for each blob
4. Suggest script for batch downloads if many files

**Output**: Commands to download each blob or a bash loop for automation.

## Error Handling

- **`shelby: command not found`**: CLI not installed → Install via npm
- **`Insufficient ShelbyUSD tokens`**: Fund account via faucet
- **`Insufficient gas`**: Fund with Aptos tokens
- **`Blob not found`**: Check blob name/path → Use `shelby account blobs` to list
- **`Configuration not found`**: Run `shelby init` to create config
- **`Network error`**: Check internet connection and API endpoint availability
- **`Invalid expiration date`**: Use valid format (e.g., "tomorrow", "7 days", ISO date)

## Additional Commands

**Get help:**
```bash
shelby --help
shelby upload --help
shelby download --help
```

**List all blobs in account:**
```bash
shelby account blobs
```

**View commitment operations:**
```bash
shelby commitment --help
```

**Context management:**
```bash
shelby context list
shelby context use <context-name>
```

## Notes

- **Two token types required**: Aptos (gas fees) and ShelbyUSD (upload fees)
- **Configuration location**: `~/.shelby/config.yaml`
- **Network options**: Local (development) and Shelbynet (production)
- **API endpoint**: `https://api.shelbynet.shelby.xyz/shelby`
- **Aptos blockchain**: High throughput, low finality times
- **Erasure coding**: Automatic chunking and redundancy
- **Read-heavy workloads**: Optimized for video streaming, AI training, data analytics
- **Explorer available**: https://explorer.shelby.xyz for web-based management

## Related Resources

- **TypeScript SDK**: For programmatic integration (`@shelby-protocol/sdk`)
- **Media Player**: React component for video streaming (`@shelby-protocol/player`)
- **Explorer**: Web UI at https://explorer.shelby.xyz
- **Documentation**: https://docs.shelby.xyz
- **Whitepaper**: https://shelby.xyz/whitepaper.pdf
