---
name: shelby-media-player
description: Use when integrating Shelby Protocol media player for React video streaming. Helps with installation, SimpleShakaVideoPlayer setup, custom layouts, TailwindCSS 4 configuration, and building adaptive HLS/DASH video players. Invoke for video player components, decentralized video streaming, or Shaka Player integration with Shelby.
allowed-tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Shelby Media Player

## Purpose

This skill assists developers integrating the Shelby Protocol media player SDK into React applications for video streaming. The player is a lightweight React wrapper around Shaka Player, designed for adaptive HLS/DASH streaming from Shelby's decentralized storage network.

## When to Use

This skill should be invoked when:
- User mentions "@shelby-protocol/player", "SimpleShakaVideoPlayer", or "Shelby video player"
- User wants to build video streaming applications with React
- User needs help with HLS or DASH adaptive streaming
- User asks about Shaka Player integration with Shelby
- User needs custom video player layouts or controls
- User is troubleshooting TailwindCSS 4 integration with the player
- User wants to stream videos from Shelby decentralized storage
- User asks about video player components, controls, or customization

## Process

### 1. Installation and Setup

**Install the package:**

```bash
npm install @shelby-protocol/player
# or
pnpm add @shelby-protocol/player
# or
yarn add @shelby-protocol/player
# or
bun add @shelby-protocol/player
```

**TailwindCSS 4 Requirement:**

The player requires TailwindCSS 4 for default styles:

```bash
npm install tailwindcss@4
```

**Configure styles in `globals.css`:**

Option 1 - Source directive (recommended):
```css
@source "@shelby-protocol/player";
```

Option 2 - Direct import:
```css
@import "@shelby-protocol/player/shadcn.css";
```

### 2. Basic Implementation

**Simple player setup:**

```typescript
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

function MyVideoPlayer() {
  return (
    <SimpleShakaVideoPlayer
      src="https://example.com/video.m3u8"
      poster="https://example.com/thumbnail.jpg"
      title="My Video Title"
    />
  );
}
```

**Props:**
- **src** (required): Video source URL (HLS `.m3u8` or DASH `.mpd` format)
- **poster** (optional): Poster image URL displayed before playback
- **title** (optional): Video title for accessibility and display

### 3. Integration with Shelby Storage

**Stream videos from Shelby blobs:**

```typescript
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

interface ShelbyVideoPlayerProps {
  blobName: string;
  poster?: string;
  title: string;
}

function ShelbyVideoPlayer({ blobName, poster, title }: ShelbyVideoPlayerProps) {
  // Construct Shelby API URL
  const videoUrl = `https://api.shelbynet.shelby.xyz/shelby/blobs/${blobName}`;

  return (
    <SimpleShakaVideoPlayer
      src={videoUrl}
      poster={poster}
      title={title}
    />
  );
}

// Usage
<ShelbyVideoPlayer
  blobName="videos/intro.m3u8"
  poster="/thumbnails/intro.jpg"
  title="Introduction Video"
/>
```

### 4. Custom Player Layouts

**Build custom layouts using primitive components:**

```typescript
import {
  VideoOutlet,
  Controls,
  PlayButton,
  VolumeButton,
  TimeSlider,
  FullscreenButton,
  usePlayer
} from '@shelby-protocol/player';

function CustomVideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const { containerRef } = usePlayer();

  return (
    <div ref={containerRef} className="relative">
      <VideoOutlet />

      {/* Custom controls layout */}
      <Controls>
        <div className="flex items-center gap-4 px-4 py-2">
          <PlayButton />
          <TimeSlider />
          <VolumeButton />
          <FullscreenButton />
        </div>
      </Controls>
    </div>
  );
}
```

**Available primitive components:**
- `VideoOutlet`: Main video container
- `Poster`: Poster image display
- `Controls`: Player control container
- `PlayButton`: Play/pause button
- `VolumeButton`: Volume control with slider
- `TimeSlider`: Seek bar/timeline
- `FullscreenButton`: Fullscreen toggle
- `DefaultLayout`: Pre-configured layout

### 5. Advanced Customization with usePlayer Hook

**Access Shaka Player instance for advanced controls:**

```typescript
import { usePlayer } from '@shelby-protocol/player';
import { useEffect } from 'react';

function AdvancedVideoPlayer({ src }: { src: string }) {
  const { containerRef, player } = usePlayer();

  useEffect(() => {
    if (player) {
      // Access Shaka Player instance for advanced controls
      player.configure({
        streaming: {
          bufferingGoal: 30,
          rebufferingGoal: 10,
        }
      });

      // Add event listeners
      player.addEventListener('error', (event) => {
        console.error('Player error:', event);
      });
    }
  }, [player]);

  return (
    <div ref={containerRef}>
      {/* Custom player UI */}
    </div>
  );
}
```

### 6. Complete Example Components

**Video gallery component:**

```typescript
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

interface Video {
  id: string;
  blobName: string;
  title: string;
  poster: string;
  duration: string;
}

function VideoGallery({ videos }: { videos: Video[] }) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <div>
      {/* Video grid */}
      <div className="grid grid-cols-3 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="cursor-pointer"
          >
            <img src={video.poster} alt={video.title} />
            <h3>{video.title}</h3>
            <p>{video.duration}</p>
          </div>
        ))}
      </div>

      {/* Video player modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <SimpleShakaVideoPlayer
              src={`https://api.shelbynet.shelby.xyz/shelby/blobs/${selectedVideo.blobName}`}
              poster={selectedVideo.poster}
              title={selectedVideo.title}
            />
            <button onClick={() => setSelectedVideo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Output Format

When helping users integrate Shelby media player:

1. **Check dependencies** - Verify React and TailwindCSS 4 are installed
2. **Provide complete examples** - Include imports and full component code
3. **Explain styling setup** - Show TailwindCSS configuration
4. **Demonstrate integration** - Show Shelby storage URL construction
5. **Handle edge cases** - Show error handling and loading states

## Best Practices

### Video Format and Encoding
- **Use adaptive streaming formats**: HLS (`.m3u8`) or DASH (`.mpd`)
- **Provide multiple quality levels** for adaptive bitrate streaming
- **Optimize encoding settings** for target devices and bandwidth
- **Use proper video codecs**: H.264 for compatibility, H.265 for efficiency

### Performance
- **Lazy load video components** when possible to improve page load
- **Implement intersection observer** to load videos only when visible
- **Optimize poster images** - compress and use appropriate sizes
- **Consider CDN or edge caching** for frequently accessed videos
- **Use appropriate buffering settings** based on use case

### User Experience
- **Always provide poster images** for better visual experience
- **Include meaningful video titles** for accessibility
- **Implement loading states** while video initializes
- **Handle errors gracefully** with user-friendly messages
- **Provide playback controls** appropriate for your use case
- **Consider autoplay policies** - most browsers restrict autoplay

### Accessibility
- **Use semantic HTML** with proper ARIA labels
- **Provide keyboard navigation** for all controls
- **Include captions/subtitles** when available
- **Ensure adequate color contrast** for controls
- **Test with screen readers**

### Styling
- **Override CSS variables** for custom theming
- **Use Tailwind utility classes** on wrapper elements
- **Create reusable styled components** for consistency
- **Maintain responsive design** across device sizes
- **Test on different screen sizes** and orientations

## Examples

### Example 1: Simple Video Player Page

**User Request**: "Create a page to play a video from Shelby storage"

**Implementation**:

```typescript
// app/video/[blobName]/page.tsx
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

interface VideoPageProps {
  params: {
    blobName: string;
  };
}

export default function VideoPage({ params }: VideoPageProps) {
  const { blobName } = params;

  // Decode blob name from URL
  const decodedBlobName = decodeURIComponent(blobName);

  // Construct video URL
  const videoUrl = `https://api.shelbynet.shelby.xyz/shelby/blobs/${decodedBlobName}`;

  return (
    <div className="container mx-auto py-8">
      <SimpleShakaVideoPlayer
        src={videoUrl}
        poster="/default-poster.jpg"
        title="Video from Shelby Storage"
      />
    </div>
  );
}
```

### Example 2: Custom Player with Playlist

**User Request**: "Build a video player with a playlist sidebar"

**Implementation**:

```typescript
// components/PlaylistPlayer.tsx
import { useState } from 'react';
import { SimpleShakaVideoPlayer } from '@shelby-protocol/player';

interface PlaylistItem {
  id: string;
  blobName: string;
  title: string;
  poster: string;
  duration: string;
}

interface PlaylistPlayerProps {
  playlist: PlaylistItem[];
}

export function PlaylistPlayer({ playlist }: PlaylistPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentVideo = playlist[currentIndex];

  const videoUrl = `https://api.shelbynet.shelby.xyz/shelby/blobs/${currentVideo.blobName}`;

  return (
    <div className="flex gap-4">
      {/* Main player */}
      <div className="flex-1">
        <SimpleShakaVideoPlayer
          key={currentVideo.id} // Force remount on video change
          src={videoUrl}
          poster={currentVideo.poster}
          title={currentVideo.title}
        />
        <div className="mt-4">
          <h2 className="text-2xl font-bold">{currentVideo.title}</h2>
        </div>
      </div>

      {/* Playlist sidebar */}
      <div className="w-80 space-y-2">
        <h3 className="font-semibold text-lg mb-4">Playlist</h3>
        {playlist.map((video, index) => (
          <div
            key={video.id}
            onClick={() => setCurrentIndex(index)}
            className={`
              p-3 rounded cursor-pointer transition-colors
              ${index === currentIndex ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}
            `}
          >
            <div className="flex gap-3">
              <img
                src={video.poster}
                alt={video.title}
                className="w-24 h-14 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                <p className="text-xs opacity-70">{video.duration}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Advanced Player with Analytics

**User Request**: "Create a video player that tracks viewing analytics"

**Implementation**:

```typescript
// components/AnalyticsPlayer.tsx
import { usePlayer } from '@shelby-protocol/player';
import { useEffect, useRef } from 'react';

interface AnalyticsPlayerProps {
  src: string;
  poster?: string;
  title: string;
  videoId: string;
  onAnalytics?: (event: string, data: any) => void;
}

export function AnalyticsPlayer({
  src,
  poster,
  title,
  videoId,
  onAnalytics
}: AnalyticsPlayerProps) {
  const { containerRef, player } = usePlayer();
  const watchTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!player) return;

    // Track play events
    const handlePlay = () => {
      onAnalytics?.('video_play', { videoId, title });
      lastTimeRef.current = Date.now();
    };

    // Track pause events
    const handlePause = () => {
      const watchTime = (Date.now() - lastTimeRef.current) / 1000;
      watchTimeRef.current += watchTime;

      onAnalytics?.('video_pause', {
        videoId,
        title,
        watchTime: watchTimeRef.current
      });
    };

    // Track completion
    const handleEnded = () => {
      onAnalytics?.('video_complete', {
        videoId,
        title,
        totalWatchTime: watchTimeRef.current
      });
    };

    // Track errors
    const handleError = (event: any) => {
      onAnalytics?.('video_error', {
        videoId,
        title,
        error: event.detail
      });
    };

    // Add listeners
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('ended', handleEnded);
    player.addEventListener('error', handleError);

    // Track initial load
    onAnalytics?.('video_load', { videoId, title });

    // Cleanup
    return () => {
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('ended', handleEnded);
      player.removeEventListener('error', handleError);
    };
  }, [player, videoId, title, onAnalytics]);

  return (
    <div ref={containerRef}>
      {/* Use built-in components */}
      <SimpleShakaVideoPlayer
        src={src}
        poster={poster}
        title={title}
      />
    </div>
  );
}

// Usage
<AnalyticsPlayer
  src="https://api.shelbynet.shelby.xyz/shelby/blobs/videos/intro.m3u8"
  poster="/posters/intro.jpg"
  title="Introduction Video"
  videoId="intro-2024"
  onAnalytics={(event, data) => {
    // Send to analytics service
    console.log('Analytics:', event, data);
    // analytics.track(event, data);
  }}
/>
```

## Error Handling

Common issues and solutions:

- **Styles not working**: Install TailwindCSS 4 and add source directive to `globals.css`
- **Video not playing**: Check URL accessibility, format (HLS/DASH), and CORS headers
- **Player not rendering**: Verify React is installed and component is properly imported
- **CORS errors**: Ensure Shelby API or video CDN has proper CORS headers
- **Buffering issues**: Adjust Shaka Player buffering configuration
- **Fullscreen not working**: Check browser permissions and Fullscreen API support
- **Black screen**: Verify video format compatibility with browser
- **Controls not responding**: Check event listeners and state management

## Troubleshooting

### Styles Not Rendering

**Problem**: Player appears unstyled or broken.

**Solutions**:
1. Verify TailwindCSS 4 is installed:
   ```bash
   npm install tailwindcss@4
   ```

2. Add source directive to `globals.css`:
   ```css
   @source "@shelby-protocol/player";
   ```

3. Restart development server

### Video Not Loading

**Problem**: Video doesn't load or play.

**Solutions**:
1. Check video URL is accessible (test in browser)
2. Verify video format is HLS (`.m3u8`) or DASH (`.mpd`)
3. Check browser console for errors
4. Ensure CORS headers are set correctly
5. Test with a known working HLS/DASH stream

### Performance Issues

**Problem**: Video stutters or buffers excessively.

**Solutions**:
1. Optimize video encoding settings
2. Use appropriate bitrate for target bandwidth
3. Implement proper chunking for large videos
4. Configure Shaka Player buffering settings
5. Consider CDN or edge caching

## Notes

- **Based on Shaka Player**: Uses Google's adaptive streaming library
- **Streaming formats**: Supports HLS and DASH adaptive streaming
- **TailwindCSS 4 required**: For default styling (shadcn-style components)
- **Browser support**: Modern browsers with HLS (Safari native) or DASH support
- **Fullscreen API**: Uses browser's native fullscreen capabilities
- **Adaptive bitrate**: Automatically adjusts quality based on network conditions
- **Custom controls**: Build completely custom UIs with primitive components
- **Shelby integration**: Works seamlessly with Shelby decentralized storage
- **TypeScript support**: Fully typed for better DX

## Related Resources

- **Shelby SDK**: Upload videos programmatically (`@shelby-protocol/sdk`)
- **Shelby CLI**: Upload videos via command line
- **Shaka Player Docs**: https://shaka-player-demo.appspot.com/docs/api/
- **HLS Spec**: https://datatracker.ietf.org/doc/html/rfc8216
- **DASH Spec**: https://www.iso.org/standard/79329.html
- **TailwindCSS**: https://tailwindcss.com/
