---
name: bun-runtime
description: Use when building HTTP servers, web APIs, file operations, or working with Bun's native runtime APIs (Bun.serve, Bun.file, Bun.write, workers, FFI). Invoke for server-side Bun applications, WebSocket servers, or native module integration.
allowed-tools: Read, Grep, Glob
---

# Bun Runtime Expert

## Purpose

Expert knowledge of Bun's runtime APIs and native features. Covers HTTP/WebSocket servers, file I/O, process management, FFI (Foreign Function Interface), and Bun-specific native modules.

## When to Use

Invoke this skill when:
- Building HTTP or WebSocket servers with Bun.serve
- Working with files using Bun.file or Bun.write
- Creating child processes or workers
- Using FFI to call native libraries
- Integrating with S3, databases, or external services
- Questions about Bun's native APIs vs Node.js compatibility
- Performance optimization for Bun servers
- Debugging Bun runtime issues

## Documentation Available

**Location**: `./docs/bun/runtime/`

**Coverage** (51 files):
- **HTTP & Networking**:
  - Bun.serve - HTTP/HTTPS/WebSocket servers
  - Fetch API - HTTP client requests
  - WebSockets - Real-time communication
  - HTTP proxy, streaming responses

- **File System**:
  - Bun.file - File handles and operations
  - Bun.write - Efficient file writing
  - File I/O APIs
  - Glob patterns

- **Process Management**:
  - Child processes (spawn, exec)
  - Workers and concurrency
  - Environment variables

- **Native Integration**:
  - FFI (Foreign Function Interface)
  - Native module loading
  - C/C++ library integration

- **Utilities**:
  - Bun.password - Password hashing (Argon2)
  - Bun.hash - Fast hashing (CityHash, Murmur)
  - Bun.sleep - Async delays
  - Bun.semver - Semantic versioning
  - Bun.escapeHTML - HTML sanitization

## Related Skills

- **bun-test**: For testing Bun servers and APIs
- **bun-package-manager**: For installing dependencies
- **bun-bundler**: For building production bundles
- **bun-quickstart**: For project setup and configuration

## Best Practices

- **Use Bun.serve for HTTP servers** - 4x faster than Node.js + Express
- **Leverage Bun.file for file operations** - optimized and faster than fs/promises
- **Use Bun.password for auth** - built-in Argon2 hashing
- **Prefer native Bun APIs** over Node.js compatibility layer when available
- **Use workers for CPU-intensive tasks** - keep main thread responsive
- **Enable hot reload with --watch** - faster development cycle
- **Use Bun.env instead of process.env** - more ergonomic

## Examples

### Example 1: HTTP Server with Routing

**Question**: "How do I create a fast HTTP API with Bun?"

**Response**:
```typescript
// server.ts
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url)

    // Simple routing
    if (url.pathname === "/" && req.method === "GET") {
      return new Response("Welcome to Bun API!")
    }

    if (url.pathname === "/api/users" && req.method === "GET") {
      const users = await getUsers() // Your DB logic
      return Response.json(users)
    }

    if (url.pathname === "/api/users" && req.method === "POST") {
      const body = await req.json()
      const user = await createUser(body)
      return Response.json(user, { status: 201 })
    }

    return new Response("Not Found", { status: 404 })
  },

  // Error handling
  error(error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  },
})

console.log(`Server running at http://localhost:${server.port}`)
```

**Run with hot reload**:
```bash
bun --watch server.ts
```

**Performance**: Bun.serve handles **millions of requests per second** - 4x faster than Node.js + Fastify!

**References**:
- See: `docs/bun/runtime/http.md`
- See: `docs/bun/runtime/bun-serve.md`

### Example 2: WebSocket Server

**Question**: "How do I build a real-time WebSocket server?"

**Response**:
```typescript
// websocket-server.ts
const server = Bun.serve({
  port: 3000,

  fetch(req, server) {
    // Upgrade HTTP to WebSocket
    if (server.upgrade(req)) {
      return // Successfully upgraded
    }

    return new Response("Expected WebSocket upgrade", { status: 400 })
  },

  websocket: {
    open(ws) {
      console.log("Client connected")
      ws.send("Welcome to the WebSocket server!")
    },

    message(ws, message) {
      console.log("Received:", message)

      // Echo back
      ws.send(`Echo: ${message}`)

      // Broadcast to all clients
      server.publish("room1", `Broadcast: ${message}`)
    },

    close(ws) {
      console.log("Client disconnected")
    },
  },
})

console.log(`WebSocket server running at ws://localhost:${server.port}`)
```

**Client side**:
```typescript
const ws = new WebSocket("ws://localhost:3000")

ws.onopen = () => {
  ws.send("Hello server!")
}

ws.onmessage = (event) => {
  console.log("Received:", event.data)
}
```

**References**:
- See: `docs/bun/runtime/websockets.md`

### Example 3: File Operations

**Question**: "How do I read and write files efficiently?"

**Response**:
```typescript
// Read file (multiple methods)
const file = Bun.file("data.json")

// As text
const text = await file.text()

// As JSON
const json = await file.json()

// As ArrayBuffer
const buffer = await file.arrayBuffer()

// As Blob
const blob = await file.blob()

// Stream large files
const stream = file.stream()
for await (const chunk of stream) {
  console.log("Chunk:", chunk)
}

// Write file
await Bun.write("output.txt", "Hello Bun!")

// Write JSON
await Bun.write("data.json", JSON.stringify({ key: "value" }))

// Write from Response
const response = await fetch("https://example.com/image.png")
await Bun.write("image.png", response)

// Write with file handle
const output = Bun.file("output.bin")
await Bun.write(output, new Uint8Array([1, 2, 3, 4]))
```

**Performance**: Bun.file is **optimized at the system level** and faster than Node.js fs/promises.

**References**:
- See: `docs/bun/runtime/bun-file.md`
- See: `docs/bun/runtime/bun-write.md`

### Example 4: Child Processes

**Question**: "How do I spawn child processes?"

**Response**:
```typescript
import { spawn } from "bun"

// Simple spawn
const proc = spawn(["ls", "-la"], {
  cwd: "/tmp",
  env: { ...process.env },
  stdout: "pipe",
})

// Read stdout
const text = await new Response(proc.stdout).text()
console.log(text)

// Wait for exit
await proc.exited

// Spawn with options
const proc2 = spawn({
  cmd: ["node", "script.js"],
  stdout: "inherit", // Stream to parent stdout
  stderr: "inherit",
  stdin: "pipe",
})

// Write to stdin
proc2.stdin.write("Hello\n")
proc2.stdin.end()
```

**References**:
- See: `docs/bun/runtime/spawn.md`

### Example 5: FFI (Native Libraries)

**Question**: "How do I call native C libraries?"

**Response**:
```typescript
import { dlopen, FFIType, suffix } from "bun:ffi"

// Open native library
const lib = dlopen(`libexample.${suffix}`, {
  // Define function signatures
  add_numbers: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },

  get_string: {
    args: [],
    returns: FFIType.cstring,
  },
})

// Call native functions
const result = lib.symbols.add_numbers(5, 3)
console.log(result) // 8

const str = lib.symbols.get_string()
console.log(str) // Native string

// Close library
lib.close()
```

**Platform-specific suffixes**:
- macOS: `.dylib`
- Linux: `.so`
- Windows: `.dll`

**References**:
- See: `docs/bun/runtime/ffi.md`

## Common Patterns

### Environment Variables
```typescript
// Bun-native (recommended)
const apiKey = Bun.env.API_KEY

// Node.js compatible
const apiKey = process.env.API_KEY
```

### Password Hashing
```typescript
import { password } from "bun"

// Hash password (Argon2)
const hashed = await password.hash("my-password")

// Verify password
const isValid = await password.verify("my-password", hashed)
```

### Fast Hashing
```typescript
import { hash } from "bun"

// CityHash (fast, non-cryptographic)
const hash1 = hash("some data")

// Murmur hash
const hash2 = hash.murmur32("some data", seed)

// Wyhash
const hash3 = hash.wyhash("some data", seed)
```

### HTML Escaping
```typescript
const escaped = Bun.escapeHTML("<script>alert('xss')</script>")
// &lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;
```

### Sleep/Delay
```typescript
await Bun.sleep(1000) // 1 second

// With timeout
await Bun.sleep(100) // 100ms
```

## Performance Tips

1. **Use Bun.serve** - Built-in server is 4x faster than Node.js alternatives
2. **Use Bun.file** - Optimized file I/O, faster than fs/promises
3. **Leverage workers** - For CPU-intensive tasks
4. **Use streaming** - For large files and responses
5. **Enable --smol flag** - Reduces memory usage for production
6. **Profile with bun:jsc** - Built-in performance profiling

## Search Helpers

```bash
# Find HTTP server docs
grep -r "Bun.serve\|serve\|fetch" docs/bun/runtime/

# Find file I/O docs
grep -r "Bun.file\|Bun.write\|file" docs/bun/runtime/

# Find process docs
grep -r "spawn\|worker\|process" docs/bun/runtime/

# Find FFI docs
grep -r "FFI\|dlopen\|native" docs/bun/runtime/

# List all runtime APIs
ls docs/bun/runtime/
```

## Common Errors

- **Port already in use**: Another process is using the port
  - Solution: Change port or kill existing process

- **File not found**: Incorrect path to file
  - Solution: Use absolute paths or check current working directory

- **FFI symbol not found**: Library doesn't export the function
  - Solution: Check library exports with `nm` command

- **WebSocket upgrade failed**: Request missing required headers
  - Solution: Ensure client sends `Upgrade: websocket` header

## Node.js Compatibility

Bun provides Node.js compatibility, but prefer native Bun APIs when available:

| Node.js | Bun Native | Performance |
|---------|-----------|-------------|
| `http.createServer()` | `Bun.serve()` | 4x faster |
| `fs/promises` | `Bun.file/write` | 2x faster |
| `child_process` | `spawn()` | Similar |
| `bcrypt` | `Bun.password` | Built-in |

## Notes

- Documentation covers latest Bun version
- Bun.serve is faster than Express, Fastify, Hono on Node.js
- Bun.file uses system-level optimizations
- FFI enables zero-copy native library calls
- File paths reference local documentation cache
- For latest updates, check https://bun.sh/docs/runtime
