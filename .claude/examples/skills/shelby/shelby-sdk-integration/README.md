# Shelby SDK Integration Skill

Expert guidance for integrating the Shelby Protocol TypeScript SDK into Node.js and browser applications.

## What This Skill Does

This skill assists with:
- SDK installation and setup (Node.js and browser)
- Aptos account authentication
- Blob upload/download operations
- Network configuration (SHELBYNET, local)
- Error handling and best practices
- Production-ready integration patterns

## When It's Invoked

The skill activates when users:
- Mention "@shelby-protocol/sdk" or "ShelbyNodeClient"
- Want programmatic Shelby integration
- Need help with Aptos authentication
- Are building apps with decentralized storage
- Ask about SDK implementation patterns
- Need error handling guidance

## Key Capabilities

- **Installation**: Package setup for Node.js and browser
- **Authentication**: Ed25519 private key management
- **Upload Operations**: File uploads with expiration
- **Error Handling**: Token errors, network issues
- **Best Practices**: Security, naming, performance

## Quick Example

**User**: "Set up Shelby SDK in my Node.js app"

**Skill Response**:
```typescript
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from '@aptos-labs/ts-sdk';

const client = new ShelbyNodeClient({
  network: Network.SHELBYNET
});

await client.upload({
  signer: account,
  blobData: Buffer.from('Hello, Shelby!'),
  blobName: 'example/hello.txt',
  expirationMicros: (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000
});
```

## Related Skills

- `shelby-quickstart` - Initial setup and basics
- `shelby-cli-helper` - Manual upload alternative
- `shelby-media-player` - Frontend video playback
