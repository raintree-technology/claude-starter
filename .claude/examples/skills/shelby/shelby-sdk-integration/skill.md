---
name: shelby-sdk-integration
description: Use when integrating Shelby Protocol TypeScript SDK for Node.js or browser applications. Helps with setup, blob uploads, authentication with Aptos accounts, network configuration, and SDK implementation patterns. Invoke for programmatic Shelby storage integration, decentralized blob APIs, or building apps with Shelby.
allowed-tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Shelby SDK Integration

## Purpose

This skill assists developers integrating the Shelby Protocol TypeScript SDK into Node.js or browser applications. It provides guidance on installation, authentication, blob upload/download operations, and best practices for working with Shelby's decentralized storage network.

## When to Use

This skill should be invoked when:
- User mentions "Shelby SDK", "@shelby-protocol/sdk", or "ShelbyNodeClient"
- User wants to integrate Shelby storage into Node.js or browser applications
- User needs help with Aptos account authentication for Shelby
- User asks about programmatic blob uploads or downloads
- User is building applications with decentralized storage
- User needs to configure network settings (SHELBYNET, local)
- User asks about handling errors in Shelby SDK operations
- User wants to implement video storage or AI training data management

## Process

### 1. Installation and Setup

**Install required packages:**

For Node.js and browser projects:
```bash
npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
# or
pnpm add @shelby-protocol/sdk @aptos-labs/ts-sdk
# or
yarn add @shelby-protocol/sdk @aptos-labs/ts-sdk
# or
bun add @shelby-protocol/sdk @aptos-labs/ts-sdk
```

**Node.js Setup:**
```typescript
import { Network } from '@aptos-labs/ts-sdk';
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";

// Configure Shelby client with network settings
const client = new ShelbyNodeClient({
  network: Network.SHELBYNET
});
```

**Browser Setup:**
```typescript
import { Network } from '@aptos-labs/ts-sdk';
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

const config = {
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY, // Optional
};

const shelbyClient = new ShelbyClient(config);
```

### 2. Authentication with Aptos Accounts

**Create account signer using Ed25519 private keys:**

```typescript
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

// IMPORTANT: Store private keys securely, never commit to version control
const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY);
const account = Account.fromPrivateKey({ privateKey });
```

**Best practices for key management:**
- Use environment variables for private keys
- Never commit keys to version control
- Use .env files with .gitignore
- Consider key management services for production

### 3. Upload Blob Operations

**Basic upload implementation:**

```typescript
// Prepare blob data
const blobData = Buffer.from('Hello, Shelby!');
const blobName = 'example/hello.txt';

// Calculate expiration in microseconds (30 days from now)
const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;

// Upload to Shelby network
await client.upload({
  signer: account,
  blobData: blobData,
  blobName: blobName,
  expirationMicros: expirationMicros
});
```

**Upload parameters explained:**
- **signer**: Aptos account for authentication
- **blobData**: File content as Buffer (Node.js) or Uint8Array (browser)
- **blobName**: Unique identifier for the blob (use path-like naming)
- **expirationMicros**: Timestamp in microseconds for data retention

### 4. File Upload Patterns

**Upload file from filesystem (Node.js):**

```typescript
import fs from 'fs';
import path from 'path';

async function uploadFile(filePath: string, blobName: string, expirationDays: number) {
  // Read file as Buffer
  const blobData = fs.readFileSync(filePath);

  // Calculate expiration
  const expirationMicros = (1000 * 60 * 60 * 24 * expirationDays + Date.now()) * 1000;

  // Upload
  await client.upload({
    signer: account,
    blobData,
    blobName,
    expirationMicros
  });

  console.log(`Uploaded ${path.basename(filePath)} as ${blobName}`);
}

// Usage
await uploadFile('./video.mp4', 'videos/intro.mp4', 30);
```

**Upload from user input (Browser):**

```typescript
async function uploadFromFileInput(file: File, expirationDays: number) {
  // Convert File to ArrayBuffer then Uint8Array
  const arrayBuffer = await file.arrayBuffer();
  const blobData = new Uint8Array(arrayBuffer);

  const blobName = `uploads/${Date.now()}_${file.name}`;
  const expirationMicros = (1000 * 60 * 60 * 24 * expirationDays + Date.now()) * 1000;

  await shelbyClient.upload({
    signer: account,
    blobData,
    blobName,
    expirationMicros
  });

  return blobName;
}

// Usage with input element
const fileInput = document.querySelector<HTMLInputElement>('#fileInput');
fileInput?.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const blobName = await uploadFromFileInput(file, 30);
    console.log('Uploaded as:', blobName);
  }
});
```

### 5. Error Handling

**Robust error handling pattern:**

```typescript
async function safeUpload(blobData: Buffer, blobName: string, expirationMicros: number) {
  try {
    await client.upload({
      signer: account,
      blobData,
      blobName,
      expirationMicros
    });

    return { success: true, blobName };
  } catch (error) {
    // Handle common errors
    if (error.message.includes('insufficient ShelbyUSD')) {
      console.error('Insufficient ShelbyUSD tokens. Fund account at faucet.');
      return { success: false, error: 'INSUFFICIENT_SHELBYUSD' };
    }

    if (error.message.includes('insufficient gas')) {
      console.error('Insufficient Aptos tokens for gas fees.');
      return { success: false, error: 'INSUFFICIENT_GAS' };
    }

    if (error.message.includes('network')) {
      console.error('Network error. Check connectivity.');
      return { success: false, error: 'NETWORK_ERROR' };
    }

    console.error('Upload failed:', error);
    return { success: false, error: 'UNKNOWN', details: error };
  }
}
```

### 6. Network Configuration

**Available networks:**

```typescript
import { Network } from '@aptos-labs/ts-sdk';

// Production Shelbynet
const prodClient = new ShelbyNodeClient({
  network: Network.SHELBYNET
});

// Local development network
const devClient = new ShelbyNodeClient({
  network: Network.LOCAL
});
```

**Configure with API key (optional but recommended):**

```typescript
const client = new ShelbyClient({
  network: Network.SHELBYNET,
  apiKey: process.env.SHELBY_API_KEY // Avoids rate limiting
});
```

## Output Format

When helping users integrate Shelby SDK:

1. **Check project setup** - Verify dependencies are installed
2. **Provide complete code examples** - Include imports and full implementation
3. **Explain security** - Emphasize private key management
4. **Show error handling** - Implement try-catch with specific error types
5. **Test integration** - Provide verification steps

## Best Practices

### Security
- **Store private keys securely** using environment variables
- **Never commit credentials** to version control
- **Use .env files** with .gitignore for local development
- **Consider key management services** (AWS KMS, HashiCorp Vault) for production
- **Rotate keys regularly** in production environments

### Blob Naming
- **Use path-like structure**: `videos/2024/intro.mp4`
- **Include metadata in names**: `user123/uploads/2024-01-15_document.pdf`
- **Use timestamps for uniqueness**: `${Date.now()}_${originalName}`
- **Avoid special characters** that might cause URL issues

### Expiration Management
- **Set appropriate retention**: Match business requirements
- **Use constants for common durations**:
  ```typescript
  const EXPIRATION = {
    DAY: 1000 * 60 * 60 * 24,
    WEEK: 1000 * 60 * 60 * 24 * 7,
    MONTH: 1000 * 60 * 60 * 24 * 30,
  };
  ```
- **Calculate in microseconds**: `(milliseconds + Date.now()) * 1000`
- **Store expiration dates** in your database for tracking

### Performance
- **Handle large files** with streaming or chunking
- **Implement retry logic** for network failures
- **Use connection pooling** for multiple uploads
- **Monitor upload progress** with progress callbacks (if available)

### Type Safety
- **Use TypeScript** for better developer experience
- **Define interfaces** for upload responses
- **Type configuration objects** properly
- **Handle null/undefined** cases explicitly

## Examples

### Example 1: Basic Node.js Integration

**User Request**: "Set up Shelby SDK in my Node.js application to upload files"

**Implementation**:

```typescript
// src/shelby-client.ts
import { Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import fs from 'fs';

export class ShelbyService {
  private client: ShelbyNodeClient;
  private account: Account;

  constructor() {
    // Initialize client
    this.client = new ShelbyNodeClient({
      network: Network.SHELBYNET
    });

    // Setup authentication
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY!);
    this.account = Account.fromPrivateKey({ privateKey });
  }

  async uploadFile(filePath: string, blobName: string, expirationDays: number = 30) {
    const blobData = fs.readFileSync(filePath);
    const expirationMicros = (1000 * 60 * 60 * 24 * expirationDays + Date.now()) * 1000;

    await this.client.upload({
      signer: this.account,
      blobData,
      blobName,
      expirationMicros
    });

    return blobName;
  }
}

// Usage
const shelby = new ShelbyService();
await shelby.uploadFile('./video.mp4', 'videos/demo.mp4', 30);
```

### Example 2: React File Upload Component

**User Request**: "Create a React component to upload files to Shelby"

**Implementation**:

```typescript
// components/ShelbyUploader.tsx
import React, { useState } from 'react';
import { Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { ShelbyClient } from "@shelby-protocol/sdk/browser";

const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
  apiKey: process.env.REACT_APP_SHELBY_API_KEY
});

const privateKey = new Ed25519PrivateKey(process.env.REACT_APP_SHELBY_PRIVATE_KEY!);
const account = Account.fromPrivateKey({ privateKey });

export function ShelbyUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Convert file to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const blobData = new Uint8Array(arrayBuffer);

      // Generate blob name
      const blobName = `uploads/${Date.now()}_${file.name}`;

      // Upload with 30 day expiration
      const expirationMicros = (1000 * 60 * 60 * 24 * 30 + Date.now()) * 1000;

      await shelbyClient.upload({
        signer: account,
        blobData,
        blobName,
        expirationMicros
      });

      // Construct URL for accessing uploaded blob
      const url = `https://api.shelbynet.shelby.xyz/shelby/blobs/${blobName}`;
      setUploadedUrl(url);

      alert('Upload successful!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {uploadedUrl && <p>URL: {uploadedUrl}</p>}
    </div>
  );
}
```

### Example 3: Video Upload Service with Progress

**User Request**: "Build a service to upload videos to Shelby with progress tracking"

**Implementation**:

```typescript
// services/video-upload.ts
import { Network, Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import fs from 'fs';
import path from 'path';

interface UploadProgress {
  filename: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  blobName?: string;
  error?: string;
}

export class VideoUploadService {
  private client: ShelbyNodeClient;
  private account: Account;

  constructor() {
    this.client = new ShelbyNodeClient({ network: Network.SHELBYNET });
    const privateKey = new Ed25519PrivateKey(process.env.SHELBY_PRIVATE_KEY!);
    this.account = Account.fromPrivateKey({ privateKey });
  }

  async uploadVideo(
    videoPath: string,
    category: string = 'videos',
    expirationDays: number = 90
  ): Promise<UploadProgress> {
    const filename = path.basename(videoPath);
    const blobName = `${category}/${Date.now()}_${filename}`;

    const progress: UploadProgress = {
      filename,
      status: 'pending'
    };

    try {
      progress.status = 'uploading';

      const blobData = fs.readFileSync(videoPath);
      const expirationMicros = (1000 * 60 * 60 * 24 * expirationDays + Date.now()) * 1000;

      await this.client.upload({
        signer: this.account,
        blobData,
        blobName,
        expirationMicros
      });

      progress.status = 'completed';
      progress.blobName = blobName;

      console.log(`✅ Uploaded: ${filename} -> ${blobName}`);
    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';

      console.error(`❌ Failed: ${filename}`, error);
    }

    return progress;
  }

  async uploadMultipleVideos(videoPaths: string[]): Promise<UploadProgress[]> {
    const results: UploadProgress[] = [];

    for (const videoPath of videoPaths) {
      const result = await this.uploadVideo(videoPath);
      results.push(result);
    }

    return results;
  }

  getBlobUrl(blobName: string): string {
    return `https://api.shelbynet.shelby.xyz/shelby/blobs/${blobName}`;
  }
}

// Usage
const uploader = new VideoUploadService();
const result = await uploader.uploadVideo('./intro.mp4', 'tutorials', 90);
const url = uploader.getBlobUrl(result.blobName!);
console.log('Access video at:', url);
```

## Error Handling

Common errors and solutions:

- **`Cannot find module '@shelby-protocol/sdk'`**: Package not installed → Run npm/pnpm/yarn/bun install
- **`Insufficient ShelbyUSD tokens`**: Fund account via faucet or CLI
- **`Insufficient gas`**: Fund with Aptos tokens
- **`Invalid private key format`**: Ensure key is valid Ed25519 private key
- **`Network error`**: Check internet connectivity and API endpoint
- **`Invalid blob data`**: Ensure data is Buffer (Node.js) or Uint8Array (browser)
- **`Expiration validation error`**: Ensure expiration is in microseconds and in future

## Notes

- **Two SDK variants**: Node.js (`@shelby-protocol/sdk/node`) and Browser (`@shelby-protocol/sdk/browser`)
- **Authentication**: Uses Aptos Ed25519 account-based authentication
- **Token requirements**: Aptos tokens (gas) + ShelbyUSD tokens (uploads)
- **Data formats**: Buffer for Node.js, Uint8Array for browsers
- **Expiration format**: Microseconds (milliseconds * 1000)
- **Network endpoint**: `https://api.shelbynet.shelby.xyz/shelby`
- **Blob URLs**: `https://api.shelbynet.shelby.xyz/shelby/blobs/{blobName}`
- **Use cases**: Video streaming, AI training data, data analytics, decentralized CDN

## Related Resources

- **Shelby CLI**: Command-line tool for manual operations
- **Media Player SDK**: React component for video playback (`@shelby-protocol/player`)
- **Explorer**: Web UI at https://explorer.shelby.xyz
- **Aptos SDK**: https://aptos.dev/sdks/ts-sdk/
- **Documentation**: https://docs.shelby.xyz
