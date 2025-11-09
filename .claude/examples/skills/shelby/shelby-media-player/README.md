# Shelby Media Player Skill

Expert assistance for integrating the Shelby Protocol media player SDK for React video streaming applications.

## What This Skill Does

This skill provides guidance for:
- Media player installation and setup
- SimpleShakaVideoPlayer component usage
- Custom video player layouts
- TailwindCSS 4 configuration
- Adaptive HLS/DASH streaming
- Integration with Shelby storage
- Advanced player customization

## When It's Invoked

The skill activates when users:
- Mention "@shelby-protocol/player" or "SimpleShakaVideoPlayer"
- Want to build video streaming apps
- Need HLS/DASH streaming help
- Are integrating Shaka Player
- Need custom video player controls
- Are troubleshooting TailwindCSS issues

## Key Capabilities

- **Setup**: Installation, TailwindCSS 4 configuration
- **Basic Player**: SimpleShakaVideoPlayer component
- **Custom Layouts**: Primitive components for custom UIs
- **Shelby Integration**: Streaming from decentralized storage
- **Advanced Features**: usePlayer hook, analytics, playlists

## Quick Example

**User**: "Create a video player for Shelby videos"

**Skill Response**:
```typescript
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

function VideoPlayer({ blobName }: { blobName: string }) {
  const videoUrl = `https://api.shelbynet.shelby.xyz/shelby/blobs/${blobName}`;

  return (
    <SimpleShakaVideoPlayer
      src={videoUrl}
      poster="/poster.jpg"
      title="Video from Shelby"
    />
  );
}
```

## Related Skills

- `shelby-quickstart` - Getting started
- `shelby-sdk-integration` - Upload videos programmatically
- `shelby-cli-helper` - Upload videos manually
