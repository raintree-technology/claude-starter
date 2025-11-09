---
name: shelby-quickstart
description: Use when getting started with Shelby Protocol for the first time. Guides through initial setup, token acquisition, account funding, first upload, and choosing between CLI/SDK/media player. Invoke when user is new to Shelby, needs onboarding, or asks "how to start with Shelby", "Shelby setup", or "get started with Shelby".
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Shelby Protocol Quickstart

## Purpose

This skill provides comprehensive onboarding for developers new to the Shelby Protocol, a decentralized blob storage network built on Aptos blockchain. It guides users through initial setup, choosing the right tools, and completing their first upload to Shelby's decentralized storage.

## When to Use

This skill should be invoked when:
- User asks "how do I get started with Shelby?"
- User mentions "Shelby setup", "Shelby onboarding", or "new to Shelby"
- User wants to understand Shelby Protocol basics
- User needs help choosing between CLI, SDK, or media player
- User is setting up Shelby for the first time
- User asks about token requirements or account funding
- User needs a walkthrough of their first upload
- User wants to understand the Shelby ecosystem

## Process

### 1. Understanding Shelby Protocol

**Explain what Shelby is:**

Shelby is a decentralized hot storage network built on Aptos blockchain, designed for read-heavy workloads like:
- **Video streaming** - Adaptive HLS/DASH streaming
- **AI training** - Large dataset storage and retrieval
- **Data analytics** - Distributed data pipelines
- **Decentralized CDN** - Content delivery with censorship resistance

**Key features:**
- **Read-based incentives** - Payment for reads ensures storage provider quality
- **Dedicated infrastructure** - Private fiber networks for consistent performance
- **Data integrity** - Novel auditing system verifies data correctness
- **Efficient erasure coding** - Reduces costs while maintaining redundancy
- **Aptos blockchain** - High throughput, low finality coordination layer

### 2. Token System Overview

**Two token types required:**

1. **Aptos Tokens** (APT)
   - Used for gas fees on transactions
   - Required for all blockchain operations
   - Acquired via Aptos faucet

2. **ShelbyUSD Tokens**
   - Used for Shelby operations (upload fees, storage payments)
   - Required for uploading blobs
   - Acquired via Shelby faucet

**Important:** You need BOTH token types to upload files.

### 3. Choosing Your Path

**Help user select the right tool based on their use case:**

#### Path A: CLI Tool (Command Line)
**Best for:**
- Manual file uploads and management
- Quick testing and prototyping
- DevOps and automation scripts
- Users comfortable with terminal

**Pros:**
- Simple setup with npm install
- No coding required for basic operations
- Built-in commands for all operations
- Easy account and context management

**Next step:** Guide to shelby-cli-helper skill

#### Path B: TypeScript SDK (Programmatic)
**Best for:**
- Node.js or browser applications
- Programmatic blob management
- Custom integrations and workflows
- Building applications on Shelby

**Pros:**
- Full programmatic control
- Type-safe TypeScript interface
- Works in Node.js and browsers
- Suitable for production applications

**Next step:** Guide to shelby-sdk-integration skill

#### Path C: Media Player (React Video)
**Best for:**
- Video streaming applications
- React applications with video playback
- Building video platforms
- Adaptive streaming (HLS/DASH)

**Pros:**
- Pre-built React components
- Shaka Player integration
- Custom control layouts
- TailwindCSS styling

**Next step:** Guide to shelby-media-player skill

#### Path D: All of the Above (Full Stack)
**Best for:**
- Complete video streaming platforms
- Applications with admin and user interfaces
- Teams needing multiple access methods

**Next step:** Guide through all three progressively

### 4. CLI Quickstart (Most Common Path)

**Step-by-step first-time setup:**

#### 4.1 Install CLI
```bash
npm i -g @shelby-protocol/cli
```

Verify installation:
```bash
shelby --version
```

#### 4.2 Initialize Configuration
```bash
shelby init
```

This creates `~/.shelby/config.yaml` and prompts for API key (optional but recommended).

#### 4.3 Check Contexts and Accounts
```bash
shelby context list
shelby account list
```

You should see `shelbynet` context and default account.

#### 4.4 Fund Your Account with Aptos Tokens

**Using Aptos CLI** (install if needed: `brew install aptos`):
```bash
aptos account fund-with-faucet --profile shelby-alice --amount 1000000000000000000
```

**Or manually** via Aptos faucet at https://faucet.testnet.aptoslabs.com/

#### 4.5 Fund Your Account with ShelbyUSD Tokens
```bash
shelby faucet --no-open
```

This opens the Shelby faucet in your browser. Follow the prompts to fund your account.

#### 4.6 Verify Account Balance
```bash
shelby account balance
```

You should see both Aptos and ShelbyUSD token balances > 0.

#### 4.7 Upload Your First File

Create a test file:
```bash
echo "Hello, Shelby!" > test.txt
```

Upload to Shelby:
```bash
shelby upload test.txt files/hello.txt -e tomorrow --assume-yes
```

**Parameters explained:**
- `test.txt` - Local source file
- `files/hello.txt` - Blob name in Shelby storage
- `-e tomorrow` - Expiration date (file expires tomorrow)
- `--assume-yes` - Skip confirmation prompt

#### 4.8 Verify Upload
```bash
shelby account blobs
```

You should see `files/hello.txt` in your blob list.

#### 4.9 Download File (Optional)
```bash
shelby download files/hello.txt downloaded.txt
cat downloaded.txt
```

**Success!** You've completed your first Shelby upload/download cycle.

### 5. SDK Quickstart (For Developers)

**Step-by-step programmatic setup:**

#### 5.1 Create New Project
```bash
mkdir shelby-demo
cd shelby-demo
npm init -y
npm install typescript @types/node tsx -D
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
```

#### 5.2 Create Upload Script

Create `upload.ts`:
```typescript
import { Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import fs from 'fs';

async function main() {
  // Initialize client
  const client = new ShelbyNodeClient({
    network: Network.SHELBYNET
  });

  // Setup authentication (get private key from shelby CLI config)
  const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY!);
  const account = Account.fromPrivateKey({ privateKey });

  // Read file
  const blobData = fs.readFileSync('./test.txt');
  const blobName = 'sdk-test/hello.txt';

  // Calculate expiration (30 days)
  const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;

  // Upload
  console.log('Uploading to Shelby...');
  await client.upload({
    signer: account,
    blobData,
    blobName,
    expirationMicros
  });

  console.log(`✅ Uploaded as: ${blobName}`);
  console.log(`Access at: https://api.shelbynet.shelby.xyz/shelby/blobs/${blobName}`);
}

main().catch(console.error);
```

#### 5.3 Get Private Key

Extract from Shelby CLI config:
```bash
cat ~/.shelby/config.yaml | grep privateKey
```

Add to `.env`:
```bash
echo "SHELBY_PRIVATE_KEY=<your-key>" > .env
```

#### 5.4 Run Upload
```bash
echo "Hello from SDK!" > test.txt
npx tsx upload.ts
```

**Success!** You've uploaded programmatically.

### 6. Media Player Quickstart (For React Apps)

**Step-by-step video player setup:**

#### 6.1 Create React App (or use existing)
```bash
npx create-next-app@latest shelby-player
cd shelby-player
```

#### 6.2 Install Dependencies
```bash
npm install @shelby-protocol/player tailwindcss@4
```

#### 6.3 Configure TailwindCSS

Add to `app/globals.css`:
```css
@source "@shelby-protocol/player";
```

#### 6.4 Create Video Player Component

Create `components/VideoPlayer.tsx`:
```typescript
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

export function VideoPlayer() {
  return (
    <SimpleShakaVideoPlayer
      src="https://api.shelbynet.shelby.xyz/shelby/blobs/videos/demo.m3u8"
      poster="/poster.jpg"
      title="Demo Video"
    />
  );
}
```

#### 6.5 Use in Page

Update `app/page.tsx`:
```typescript
import { VideoPlayer } from '@/components/VideoPlayer';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">My Shelby Video Player</h1>
      <VideoPlayer />
    </main>
  );
}
```

#### 6.6 Run Development Server
```bash
npm run dev
```

**Success!** You have a working video player.

### 7. Next Steps and Learning Resources

**After completing quickstart:**

1. **Explore the Explorer**
   - Visit https://explorer.shelby.xyz
   - View your uploaded blobs
   - Monitor network activity
   - Check account balances

2. **Read Documentation**
   - Protocol overview: https://docs.shelby.xyz/
   - API reference: https://docs.shelby.xyz/apis/rpc/shelbynet
   - Whitepaper: https://shelby.xyz/whitepaper.pdf

3. **Advanced Topics**
   - Multipart uploads for large files
   - Session management and micropayment channels
   - Custom video encoding for HLS/DASH
   - Storage provider economics
   - Erasure coding and data redundancy

4. **Join Community**
   - GitHub: https://github.com/shelby-protocol
   - Website: https://shelby.xyz
   - Documentation: https://docs.shelby.xyz

## Output Format

When guiding users through quickstart:

1. **Assess experience level** - Understand their background and goals
2. **Recommend appropriate path** - CLI, SDK, or media player
3. **Provide step-by-step instructions** - Clear, numbered steps
4. **Verify each step** - Show commands to confirm success
5. **Troubleshoot issues** - Help resolve common problems
6. **Guide to next steps** - Recommend advanced topics or skills

## Best Practices

### For All Users
- **Start simple** - Begin with CLI even if planning to use SDK
- **Test with small files** - Don't start with large video uploads
- **Use test tokens** - These are testnet/development tokens
- **Save credentials securely** - Never commit private keys
- **Monitor balances** - Check before large uploads

### For CLI Users
- **Use meaningful blob names** - Path-like structure helps organization
- **Set appropriate expiration** - Match business requirements
- **Verify uploads** - Always check with `shelby account blobs`
- **Automate with scripts** - Use bash for batch operations

### For SDK Users
- **Use environment variables** - For keys and configuration
- **Implement error handling** - Handle token and network errors
- **Type your code** - Use TypeScript for better DX
- **Test thoroughly** - Verify uploads in explorer

### For Media Player Users
- **Optimize videos** - Use HLS/DASH adaptive streaming
- **Provide poster images** - Better user experience
- **Test on devices** - Mobile and desktop
- **Handle errors gracefully** - Show user-friendly messages

## Examples

### Example 1: Complete Beginner

**User**: "I'm new to Shelby. How do I start?"

**Response**:

Welcome to Shelby! Let me guide you through your first upload.

**What is Shelby?**
Shelby is a decentralized storage network built on Aptos blockchain, perfect for video streaming, AI training data, and data analytics.

**Quickest Path: CLI Tool**

1. Install CLI:
   ```bash
   npm i -g @shelby-protocol/cli
   ```

2. Initialize:
   ```bash
   shelby init
   ```

3. Fund account (you'll need both token types):
   ```bash
   # Aptos tokens for gas
   aptos account fund-with-faucet --profile shelby-alice --amount 1000000000000000000

   # ShelbyUSD for uploads
   shelby faucet --no-open
   ```

4. Upload a test file:
   ```bash
   echo "Hello, Shelby!" > test.txt
   shelby upload test.txt files/hello.txt -e tomorrow --assume-yes
   ```

5. Verify:
   ```bash
   shelby account blobs
   ```

**Next Steps:**
- View your blobs at https://explorer.shelby.xyz
- Explore programmatic access with the TypeScript SDK
- Build video streaming apps with the media player

### Example 2: Web Developer

**User**: "I want to build a video streaming platform with Shelby"

**Response**:

Great! For a video streaming platform, you'll need:

1. **CLI** - To upload videos to Shelby
2. **SDK** - For programmatic management in your backend
3. **Media Player** - For video playback in your frontend

**Path Forward:**

**Phase 1: Setup (15 min)**
1. Install and configure Shelby CLI
2. Fund your account with tokens
3. Upload a test video

**Phase 2: Backend (1-2 hours)**
1. Install TypeScript SDK
2. Create upload service
3. Store blob metadata in your database

**Phase 3: Frontend (1-2 hours)**
1. Install Shelby media player
2. Create video player component
3. Build playlist/gallery UI

Let's start with Phase 1. Do you have Node.js installed?

### Example 3: DevOps Engineer

**User**: "I need to automate video uploads to Shelby"

**Response**:

Perfect! The Shelby CLI is ideal for automation.

**Setup:**
```bash
npm i -g @shelby-protocol/cli
shelby init
```

**Fund Account:**
```bash
shelby faucet --no-open  # Get ShelbyUSD
aptos account fund-with-faucet --profile shelby-alice --amount 1000000000000000000
```

**Automation Script Example:**

```bash
#!/bin/bash
# upload-videos.sh

VIDEOS_DIR="/path/to/videos"
EXPIRATION="90 days"

for video in "$VIDEOS_DIR"/*.mp4; do
  filename=$(basename "$video")
  blob_name="videos/$(date +%Y-%m-%d)_$filename"

  echo "Uploading: $filename"
  shelby upload "$video" "$blob_name" -e "$EXPIRATION" --assume-yes

  if [ $? -eq 0 ]; then
    echo "✅ Success: $blob_name"
  else
    echo "❌ Failed: $filename"
  fi
done

# Verify all uploads
shelby account blobs
```

**Schedule with cron:**
```bash
0 2 * * * /path/to/upload-videos.sh >> /var/log/shelby-uploads.log 2>&1
```

## Common Issues and Solutions

### Issue: "shelby: command not found"
**Solution:** CLI not installed. Run `npm i -g @shelby-protocol/cli`

### Issue: "Insufficient ShelbyUSD tokens"
**Solution:** Fund via faucet: `shelby faucet --no-open`

### Issue: "Insufficient gas"
**Solution:** Fund with Aptos tokens via Aptos faucet

### Issue: "Configuration not found"
**Solution:** Run `shelby init` to create config

### Issue: "Upload succeeded but can't see blob"
**Solution:** Check expiration date - may have already expired

### Issue: "Network error"
**Solution:** Check internet connection and API endpoint availability

### Issue: "Private key error in SDK"
**Solution:** Ensure key is valid Ed25519 format from Shelby config

## Notes

- **Testnet vs Production**: Currently using Shelbynet (development/testnet)
- **Token costs**: Faucet tokens are free for development
- **File limits**: Check documentation for size limits and multipart uploads
- **Expiration**: Blobs expire based on set expiration date
- **Networks**: Local (development) and Shelbynet (production testnet)
- **Explorer**: https://explorer.shelby.xyz for web-based management
- **API endpoint**: https://api.shelbynet.shelby.xyz/shelby
- **Blob access**: https://api.shelbynet.shelby.xyz/shelby/blobs/{blobName}

## Related Skills

Once comfortable with basics, explore:
- **shelby-cli-helper** - Advanced CLI operations and troubleshooting
- **shelby-sdk-integration** - Building applications with TypeScript SDK
- **shelby-media-player** - React video player integration and customization

## Resources

- **Website**: https://shelby.xyz
- **Documentation**: https://docs.shelby.xyz
- **Explorer**: https://explorer.shelby.xyz
- **Whitepaper**: https://shelby.xyz/whitepaper.pdf
- **GitHub**: https://github.com/shelby-protocol
- **Aptos Docs**: https://aptos.dev
