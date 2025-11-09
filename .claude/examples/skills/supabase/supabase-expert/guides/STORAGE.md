# Storage Guide

Comprehensive guide to Supabase Storage - S3-compatible object storage with RLS, CDN, and image transformations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [File Upload Patterns](#file-upload-patterns)
3. [Security & RLS](#security--rls)
4. [Image Transformations](#image-transformations)
5. [CDN & Performance](#cdn--performance)
6. [Large File Handling](#large-file-handling)
7. [Video & Media](#video--media)
8. [Best Practices](#best-practices)
9. [Advanced Patterns](#advanced-patterns)

---

## Getting Started

### Create Storage Bucket

```sql
-- Via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Public bucket: Files accessible without auth
-- Private bucket: Requires RLS policies
```

```typescript
// Via JavaScript
const { data, error } = await supabase.storage.createBucket('avatars', {
  public: true,
  fileSizeLimit: 1024 * 1024 * 2, // 2MB
  allowedMimeTypes: ['image/png', 'image/jpeg'],
})
```

### Basic Upload

```typescript
import { createClient } from '@/lib/supabase/client'

async function uploadFile(file: File) {
  const supabase = createClient()

  const filePath = `${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return { path: data.path, publicUrl }
}
```

---

## File Upload Patterns

### Pattern 1: Avatar Upload with Preview

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export function AvatarUpload({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const supabase = createClient()

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar.${fileExt}`

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)

    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {avatarUrl && (
        <Image
          src={avatarUrl}
          alt="Avatar"
          width={150}
          height={150}
          className="rounded-full"
        />
      )}

      <label className="button" htmlFor="avatar-upload">
        {uploading ? 'Uploading...' : 'Upload Avatar'}
      </label>

      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        style={{ display: 'none' }}
      />
    </div>
  )
}
```

### Pattern 2: Multi-File Upload with Progress

```typescript
interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  url?: string
  error?: string
}

export function MultiFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const supabase = createClient()

  async function handleFiles(files: FileList) {
    const newUploads: UploadProgress[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Upload files concurrently
    await Promise.all(
      newUploads.map((upload, index) =>
        uploadWithProgress(upload, uploads.length + index)
      )
    )
  }

  async function uploadWithProgress(upload: UploadProgress, index: number) {
    try {
      updateUpload(index, { status: 'uploading', progress: 0 })

      const filePath = `uploads/${Date.now()}-${upload.file.name}`

      // Note: Supabase doesn't support native progress tracking
      // This is a workaround using file size
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, upload.file)

      if (error) throw error

      // Simulate progress
      updateUpload(index, { progress: 100 })

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      updateUpload(index, {
        status: 'complete',
        progress: 100,
        url: publicUrl,
      })

    } catch (error) {
      updateUpload(index, {
        status: 'error',
        error: error.message,
      })
    }
  }

  function updateUpload(index: number, updates: Partial<UploadProgress>) {
    setUploads(prev =>
      prev.map((upload, i) =>
        i === index ? { ...upload, ...updates } : upload
      )
    )
  }

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className="uploads-list">
        {uploads.map((upload, index) => (
          <div key={index} className="upload-item">
            <span>{upload.file.name}</span>
            <span>{upload.status}</span>
            {upload.status === 'uploading' && (
              <progress value={upload.progress} max="100" />
            )}
            {upload.url && <a href={upload.url}>View</a>}
            {upload.error && <span className="error">{upload.error}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 3: Drag & Drop Upload

```typescript
export function DragDropUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const supabase = createClient()

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)

    for (const file of files) {
      const filePath = `uploads/${Date.now()}-${file.name}`

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (error) {
        console.error('Upload failed:', error)
      } else {
        console.log('Uploaded:', filePath)
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`dropzone ${isDragging ? 'dragging' : ''}`}
    >
      {isDragging ? 'Drop files here' : 'Drag and drop files here'}
    </div>
  )
}
```

---

## Security & RLS

### Bucket Policies

```sql
-- Policy 1: Public read, authenticated write
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Policy 2: Users can only access their own files
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'private'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 3: Organization-based access
CREATE POLICY "Organization members can access files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id::text = (storage.foldername(name))[1]
    )
  );
```

### Secure Upload Pattern

```typescript
// Server Action for secure upload
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadDocument(formData: FormData) {
  const supabase = createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type' }
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File too large (max 10MB)' }
  }

  // Upload to user's folder
  const filePath = `${user.id}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (error) {
    return { error: error.message }
  }

  // Store metadata in database
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      filename: file.name,
      file_path: data.path,
      file_size: file.size,
      mime_type: file.type,
    })

  if (dbError) {
    // Cleanup uploaded file
    await supabase.storage.from('documents').remove([data.path])
    return { error: dbError.message }
  }

  revalidatePath('/documents')
  return { success: true, path: data.path }
}
```

---

## Image Transformations

### Basic Transformations

```typescript
function getOptimizedImageUrl(path: string) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path, {
      transform: {
        width: 800,
        height: 600,
        resize: 'cover', // 'contain' | 'cover' | 'fill'
        quality: 80,
      },
    })

  return data.publicUrl
}

// Usage in Next.js Image component
<Image
  src={getOptimizedImageUrl('avatar.jpg')}
  alt="Avatar"
  width={800}
  height={600}
/>
```

### Responsive Images

```typescript
function getResponsiveImages(path: string) {
  const supabase = createClient()

  const sizes = [
    { width: 320, quality: 80 },
    { width: 640, quality: 80 },
    { width: 1024, quality: 80 },
    { width: 1920, quality: 75 },
  ]

  return sizes.map(({ width, quality }) => {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path, {
        transform: { width, quality },
      })

    return {
      width,
      url: data.publicUrl,
    }
  })
}

// Usage
const images = getResponsiveImages('photo.jpg')
const srcset = images.map(img => `${img.url} ${img.width}w`).join(', ')

<img
  src={images[2].url}
  srcSet={srcset}
  sizes="(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px"
  alt="Photo"
/>
```

### Image Processing on Upload

```typescript
async function uploadAndProcessImage(file: File, userId: string) {
  const supabase = createClient()

  // Upload original
  const originalPath = `${userId}/original/${Date.now()}-${file.name}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(originalPath, file)

  if (uploadError) throw uploadError

  // Generate thumbnails
  const thumbnails = await generateThumbnails(originalPath)

  // Store metadata
  await supabase.from('images').insert({
    user_id: userId,
    original_path: originalPath,
    thumbnails,
    filename: file.name,
    size: file.size,
  })

  return { originalPath, thumbnails }
}

async function generateThumbnails(originalPath: string) {
  const supabase = createClient()

  const sizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 800, height: 800 },
  }

  const thumbnails: Record<string, string> = {}

  for (const [name, { width, height }] of Object.entries(sizes)) {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(originalPath, {
        transform: {
          width,
          height,
          resize: 'cover',
          quality: 80,
        },
      })

    thumbnails[name] = data.publicUrl
  }

  return thumbnails
}
```

---

## CDN & Performance

### Cache Control

```typescript
// Set cache headers on upload
const { data, error } = await supabase.storage
  .from('images')
  .upload(filePath, file, {
    cacheControl: '31536000', // 1 year in seconds
    contentType: file.type,
  })

// For frequently changing content
cacheControl: '300' // 5 minutes

// For static assets
cacheControl: '31536000, immutable'
```

### CDN URLs

```typescript
// Supabase automatically uses Cloudflare CDN
// No additional configuration needed

function getCDNUrl(path: string) {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path)

  // This URL is automatically CDN-accelerated
  return data.publicUrl
}
```

### Lazy Loading

```tsx
import { Suspense } from 'react'
import Image from 'next/image'

export function LazyImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Suspense fallback={<div className="skeleton" />}>
      <Image
        src={src}
        alt={alt}
        width={800}
        height={600}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/png;base64,..."
      />
    </Suspense>
  )
}
```

---

## Large File Handling

### Chunked Upload (Client-Side)

```typescript
async function uploadLargeFile(file: File) {
  const chunkSize = 5 * 1024 * 1024 // 5MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize)

  const uploadId = crypto.randomUUID()
  const chunks: string[] = []

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    const chunkPath = `uploads/${uploadId}/chunk-${i}`

    const { error } = await supabase.storage
      .from('large-files')
      .upload(chunkPath, chunk)

    if (error) throw error

    chunks.push(chunkPath)

    // Report progress
    const progress = ((i + 1) / totalChunks) * 100
    console.log(`Progress: ${progress.toFixed(0)}%`)
  }

  // Merge chunks on server
  const { data } = await supabase.functions.invoke('merge-chunks', {
    body: { uploadId, chunks, filename: file.name },
  })

  return data
}
```

### Server-Side Merge (Edge Function)

```typescript
// supabase/functions/merge-chunks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { uploadId, chunks, filename } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Download all chunks
  const chunkData: Uint8Array[] = []

  for (const chunkPath of chunks) {
    const { data, error } = await supabase.storage
      .from('large-files')
      .download(chunkPath)

    if (error) throw error

    const arrayBuffer = await data.arrayBuffer()
    chunkData.push(new Uint8Array(arrayBuffer))
  }

  // Merge chunks
  const totalLength = chunkData.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of chunkData) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  // Upload merged file
  const finalPath = `uploads/${uploadId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('large-files')
    .upload(finalPath, merged.buffer, {
      contentType: 'application/octet-stream',
    })

  if (uploadError) throw uploadError

  // Delete chunks
  await supabase.storage
    .from('large-files')
    .remove(chunks)

  return new Response(JSON.stringify({ path: finalPath }))
})
```

### Resumable Uploads

```typescript
interface UploadState {
  uploadId: string
  file: File
  uploadedChunks: number[]
  totalChunks: number
}

class ResumableUpload {
  private state: UploadState

  constructor(file: File) {
    this.state = {
      uploadId: crypto.randomUUID(),
      file,
      uploadedChunks: [],
      totalChunks: Math.ceil(file.size / (5 * 1024 * 1024)),
    }

    // Load state from localStorage
    const saved = localStorage.getItem(`upload-${file.name}`)
    if (saved) {
      this.state = { ...this.state, ...JSON.parse(saved) }
    }
  }

  async upload() {
    const chunkSize = 5 * 1024 * 1024

    for (let i = 0; i < this.state.totalChunks; i++) {
      // Skip already uploaded chunks
      if (this.state.uploadedChunks.includes(i)) {
        continue
      }

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, this.state.file.size)
      const chunk = this.state.file.slice(start, end)

      const chunkPath = `${this.state.uploadId}/chunk-${i}`

      const { error } = await supabase.storage
        .from('large-files')
        .upload(chunkPath, chunk)

      if (error) {
        // Save state and retry later
        this.saveState()
        throw error
      }

      this.state.uploadedChunks.push(i)
      this.saveState()
    }

    // Complete upload
    this.clearState()
  }

  private saveState() {
    localStorage.setItem(
      `upload-${this.state.file.name}`,
      JSON.stringify(this.state)
    )
  }

  private clearState() {
    localStorage.removeItem(`upload-${this.state.file.name}`)
  }
}
```

---

## Video & Media

### Video Upload

```typescript
async function uploadVideo(file: File, userId: string) {
  const supabase = createClient()

  // Validate video file
  const validTypes = ['video/mp4', 'video/quicktime', 'video/webm']
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid video format')
  }

  // Max 100MB
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('Video must be less than 100MB')
  }

  const filePath = `${userId}/videos/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
    })

  if (error) throw error

  return { path: data.path }
}
```

### Video Streaming

```tsx
export function VideoPlayer({ videoPath }: { videoPath: string }) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(videoPath)

  return (
    <video
      controls
      preload="metadata"
      className="w-full"
    >
      <source src={data.publicUrl} type="video/mp4" />
      Your browser does not support video playback.
    </video>
  )
}
```

### Generate Video Thumbnail

```typescript
// Edge Function to generate thumbnail
serve(async (req) => {
  const { videoPath } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Download video
  const { data: videoData, error } = await supabase.storage
    .from('videos')
    .download(videoPath)

  if (error) throw error

  // Use FFmpeg or similar to extract thumbnail
  // This is pseudo-code - actual implementation depends on your environment
  const thumbnail = await extractThumbnail(videoData, { time: 1 }) // 1 second

  // Upload thumbnail
  const thumbnailPath = videoPath.replace(/\.[^.]+$/, '-thumb.jpg')

  await supabase.storage
    .from('videos')
    .upload(thumbnailPath, thumbnail, {
      contentType: 'image/jpeg',
    })

  return new Response(JSON.stringify({ thumbnailPath }))
})
```

---

## Best Practices

### 1. File Naming

```typescript
// Good: Unique, organized
const filePath = `${userId}/${category}/${Date.now()}-${sanitizeFilename(file.name)}`

// Bad: Collisions, disorganized
const filePath = file.name

function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
}
```

### 2. Store Metadata in Database

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX files_user_id_idx ON files(user_id);
```

```typescript
async function uploadWithMetadata(file: File, userId: string) {
  // Upload file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Get URL
  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  // Store metadata
  await supabase.from('files').insert({
    user_id: userId,
    filename: file.name,
    file_path: uploadData.path,
    file_size: file.size,
    mime_type: file.type,
    url: publicUrl,
  })
}
```

### 3. Cleanup Orphaned Files

```typescript
// Edge Function: scheduled cleanup
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Find files older than 24 hours with no database record
  const { data: files } = await supabase.storage
    .from('temporary')
    .list()

  const orphanedFiles = []

  for (const file of files || []) {
    const { data: metadata } = await supabase
      .from('files')
      .select('id')
      .eq('file_path', file.name)
      .single()

    if (!metadata) {
      orphanedFiles.push(file.name)
    }
  }

  // Delete orphaned files
  if (orphanedFiles.length > 0) {
    await supabase.storage
      .from('temporary')
      .remove(orphanedFiles)

    console.log(`Cleaned up ${orphanedFiles.length} orphaned files`)
  }

  return new Response(JSON.stringify({
    cleaned: orphanedFiles.length
  }))
})
```

---

## Advanced Patterns

### Signed URLs (Temporary Access)

```typescript
async function getSignedUrl(filePath: string, expiresIn = 60) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('private')
    .createSignedUrl(filePath, expiresIn)

  if (error) throw error

  return data.signedUrl
}

// Usage: Generate download link that expires in 1 hour
const downloadUrl = await getSignedUrl('document.pdf', 3600)
```

### Pre-Signed Upload URLs

```typescript
// Server: Generate pre-signed URL
'use server'

export async function getUploadUrl(filename: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const filePath = `${user.id}/${Date.now()}-${filename}`

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(filePath)

  if (error) throw error

  return { signedUrl: data.signedUrl, path: filePath }
}

// Client: Upload using pre-signed URL
async function uploadWithSignedUrl(file: File) {
  const { signedUrl, path } = await getUploadUrl(file.name)

  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) throw new Error('Upload failed')

  return { path }
}
```

### File Versioning

```typescript
async function uploadVersion(file: File, originalFileId: string) {
  const supabase = createClient()

  // Get original file info
  const { data: originalFile } = await supabase
    .from('files')
    .select('*')
    .eq('id', originalFileId)
    .single()

  // Upload new version
  const versionPath = `${originalFile.user_id}/versions/${Date.now()}-${file.name}`

  const { data: uploadData, error } = await supabase.storage
    .from('documents')
    .upload(versionPath, file)

  if (error) throw error

  // Create version record
  await supabase.from('file_versions').insert({
    file_id: originalFileId,
    version_number: originalFile.version_number + 1,
    file_path: uploadData.path,
    file_size: file.size,
  })

  // Update current version
  await supabase
    .from('files')
    .update({
      version_number: originalFile.version_number + 1,
      file_path: uploadData.path,
    })
    .eq('id', originalFileId)
}
```

---

## Resources

- [Storage Docs](https://supabase.com/docs/guides/storage)
- [Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [CDN Caching](https://supabase.com/docs/guides/storage/cdn)
- [Security & RLS](https://supabase.com/docs/guides/storage/security/access-control)
