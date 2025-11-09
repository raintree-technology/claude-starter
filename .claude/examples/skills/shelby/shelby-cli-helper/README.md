# Shelby CLI Helper Skill

Expert assistance for working with the Shelby Protocol CLI tool for decentralized blob storage operations.

## What This Skill Does

This skill provides guidance for:
- CLI installation and configuration
- File upload and download operations
- Account and context management
- Token funding (Aptos and ShelbyUSD)
- Troubleshooting common CLI errors
- Blob verification and listing

## When It's Invoked

The skill activates when users:
- Mention "Shelby CLI" or "shelby upload"
- Need to configure Shelby contexts
- Want to upload/download files
- Need to fund accounts with tokens
- Are troubleshooting CLI errors
- Ask about blob management

## Key Capabilities

- **Setup**: Installation, initialization, configuration
- **File Operations**: Upload with expiration, download, verification
- **Account Management**: Balance checking, context switching, funding
- **Troubleshooting**: Insufficient tokens, upload failures, network errors

## Quick Example

**User**: "Upload my video.mp4 file to Shelby storage"

**Skill Response**:
```bash
shelby upload ./video.mp4 videos/my-video.mp4 -e "30 days" --assume-yes
shelby account blobs  # Verify upload
```

## Related Skills

- `shelby-quickstart` - First-time setup
- `shelby-sdk-integration` - Programmatic alternative
