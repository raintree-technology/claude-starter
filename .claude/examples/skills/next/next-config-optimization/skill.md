---
name: next-config-optimization
description: Use when configuring Next.js builds, optimizing images/fonts/scripts, setting up metadata, or working with Turbopack. Invoke for next.config.js setup, Image component optimization, Font loading, Script strategies, or build configuration.
allowed-tools: Read, Grep, Glob
---

# Next.js Configuration & Optimization Expert

## Purpose

Expert knowledge of Next.js configuration and optimization features. Covers next.config.js, Image optimization, Font loading, Script strategies, metadata management, and Turbopack.

## When to Use

Invoke this skill when:
- Configuring next.config.js
- Optimizing images with next/image
- Loading fonts efficiently
- Managing third-party scripts
- Setting up metadata for SEO
- Configuring build settings
- Using Turbopack for faster builds
- Implementing environment variables
- Setting up redirects and rewrites
- Debugging build or performance issues

## Documentation Available

**Location**: `./docs/next/`

**Coverage** (~80 files):
- **Configuration**:
  - next.config.js options
  - Environment variables
  - TypeScript configuration
  - Compiler options

- **Image Optimization**:
  - next/image component
  - Image sizing and loading
  - Remote images
  - Image formats

- **Font Optimization**:
  - next/font/google
  - next/font/local
  - Font loading strategies
  - Variable fonts

- **Script Optimization**:
  - next/script component
  - Script loading strategies
  - Third-party scripts

- **Metadata**:
  - Static and dynamic metadata
  - generateMetadata
  - Metadata API

- **Build Tools**:
  - Turbopack (experimental)
  - Webpack configuration
  - Bundle analyzer

## Related Skills

- **next-app-router**: For app/ directory features
- **next-data-rendering**: For caching and rendering
- **next-pages-router**: For pages/ directory

## Best Practices

- **Use next/image** - Automatic optimization
- **Load fonts with next/font** - No layout shift
- **Defer non-critical scripts** - Use afterInteractive or lazyOnload
- **Set proper metadata** - SEO and social sharing
- **Use environment variables** - Secure configuration
- **Enable Turbopack** - Faster development builds
- **Configure image domains** - Allowlist remote sources
- **Optimize bundle size** - Use bundle analyzer
- **Set up redirects properly** - SEO-friendly

## Examples

### Example 1: next.config.js Configuration

**Question**: "How do I configure next.config.js?"

**Response**:
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ['example.com', 'cdn.example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true, // 308
      },
      {
        source: '/about',
        destination: '/',
        permanent: false, // 307
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ];
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Environment variables (public)
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },

  // Experimental features
  experimental: {
    turbo: {
      // Turbopack options
    },
    ppr: true, // Partial Prerendering
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.BUILD_ID': JSON.stringify(buildId),
      })
    );

    return config;
  },

  // Output configuration
  output: 'standalone', // For Docker deployments
  // output: 'export', // For static export

  // Page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],

  // Trailing slash
  trailingSlash: false,

  // Base path
  basePath: '/docs',

  // Asset prefix (CDN)
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://cdn.example.com'
    : undefined,
};

module.exports = nextConfig;
```

**TypeScript Configuration**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**References**:
- See: `docs/next/app/api-reference/next-config-js/`

### Example 2: Image Optimization

**Question**: "How do I optimize images with next/image?"

**Response**:
```typescript
import Image from 'next/image';

// Local image (static import)
import profilePic from '@/public/profile.jpg';

export function ProfileImage() {
  return (
    <Image
      src={profilePic}
      alt="Profile picture"
      width={500}
      height={500}
      priority // Load immediately (above fold)
    />
  );
}

// Remote image
export function ProductImage({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="Product"
      width={800}
      height={600}
      quality={90} // 1-100 (default: 75)
      placeholder="blur"
      blurDataURL="data:image/png;base64,..." // Low-quality placeholder
    />
  );
}

// Responsive image
export function ResponsiveImage() {
  return (
    <Image
      src="/product.jpg"
      alt="Product"
      fill // Fill parent container
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{ objectFit: 'cover' }}
    />
  );
}

// With loader (custom CDN)
const customLoader = ({ src, width, quality }) => {
  return `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}`;
};

export function CustomLoaderImage() {
  return (
    <Image
      loader={customLoader}
      src="product.jpg"
      alt="Product"
      width={800}
      height={600}
    />
  );
}

// Lazy loading
export function LazyImage() {
  return (
    <Image
      src="/below-fold.jpg"
      alt="Below fold"
      width={800}
      height={600}
      loading="lazy" // Default for non-priority images
    />
  );
}

// Background image pattern
export function BackgroundImage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <Image
        src="/background.jpg"
        alt="Background"
        fill
        style={{ objectFit: 'cover' }}
        quality={80}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        Content on top of background
      </div>
    </div>
  );
}
```

**Image Formats**:
- Automatically serves AVIF/WebP when supported
- Falls back to original format
- Configurable in next.config.js

**Performance Benefits**:
- Automatic resizing
- Lazy loading by default
- Blur placeholder
- Format optimization
- No layout shift

**References**:
- See: `docs/next/app/api-reference/components/image/`

### Example 3: Font Optimization

**Question**: "How do I load fonts efficiently?"

**Response**:
```typescript
// app/layout.tsx
import { Inter, Roboto_Mono, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';

// Google Fonts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Font display strategy
  variable: '--font-inter', // CSS variable
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-mono',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

// Local fonts
const myFont = localFont({
  src: [
    {
      path: './fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-my-font',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${robotoMono.variable} ${playfair.variable} ${myFont.variable}`}
    >
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// Use in CSS
// globals.css
/*
body {
  font-family: var(--font-inter);
}

code {
  font-family: var(--font-roboto-mono);
}

h1 {
  font-family: var(--font-playfair);
}
*/

// Variable fonts
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // Variable fonts support weight range
});

// Preload fonts
const inter = Inter({
  subsets: ['latin'],
  preload: true, // Default: true
});

// Adjust font display
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // or 'auto', 'block', 'fallback', 'optional'
});
```

**Benefits**:
- Zero layout shift (font metrics known)
- Self-hosted (privacy, performance)
- Automatic subsetting
- CSS variables for flexibility
- Optimal loading strategy

**References**:
- See: `docs/next/app/api-reference/components/font/`

### Example 4: Script Optimization

**Question**: "How do I load third-party scripts efficiently?"

**Response**:
```typescript
import Script from 'next/script';

// Global scripts (app/layout.tsx)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive" // Load after page interactive
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}

// Page-specific script
export default function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <form id="contact-form">{/* Form fields */}</form>

      {/* Load script only on this page */}
      <Script
        src="https://example.com/form-validator.js"
        strategy="lazyOnload" // Load after everything else
        onLoad={() => {
          console.log('Script loaded');
        }}
        onError={(e) => {
          console.error('Script failed to load', e);
        }}
      />
    </div>
  );
}

// Inline script
export function InlineScriptExample() {
  return (
    <>
      <Script id="config" strategy="beforeInteractive">
        {`
          window.APP_CONFIG = {
            apiUrl: '${process.env.NEXT_PUBLIC_API_URL}',
            env: '${process.env.NODE_ENV}',
          };
        `}
      </Script>
    </>
  );
}

// Worker script
export function WorkerScriptExample() {
  return (
    <Script
      src="/worker.js"
      strategy="worker" // Experimental: run in web worker
    />
  );
}
```

**Strategy Options**:
- `beforeInteractive`: Load before page interactive (critical scripts)
- `afterInteractive`: Load after page interactive (default)
- `lazyOnload`: Load during idle time
- `worker`: Run in web worker (experimental)

**References**:
- See: `docs/next/app/api-reference/components/script/`

### Example 5: Metadata Management

**Question**: "How do I set up metadata for SEO?"

**Response**:
```typescript
// app/layout.tsx (static metadata)
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App - Best Product Ever',
  },
  description: 'The best app for doing things',
  keywords: ['next.js', 'react', 'typescript'],
  authors: [{ name: 'John Doe', url: 'https://example.com' }],
  creator: 'John Doe',
  publisher: 'My Company',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://example.com',
    siteName: 'My App',
    title: 'My App',
    description: 'The best app for doing things',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'My App Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@myapp',
    creator: '@johndoe',
    title: 'My App',
    description: 'The best app for doing things',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

// app/products/[id]/page.tsx (dynamic metadata)
import { Metadata } from 'next';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetch(`https://api.example.com/products/${params.id}`)
    .then((r) => r.json());

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
      type: 'product',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default function ProductPage({ params }: Props) {
  return <div>{/* Product content */}</div>;
}

// JSON-LD structured data
export function ProductStructuredData({ product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

**References**:
- See: `docs/next/app/api-reference/functions/generate-metadata/`

## Common Patterns

### Environment Variables
```typescript
// .env.local
DATABASE_URL=postgres://localhost:5432/db
NEXT_PUBLIC_API_URL=https://api.example.com

// Access in code
const dbUrl = process.env.DATABASE_URL; // Server only
const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Client + server
```

### Bundle Analyzer
```bash
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### Turbopack
```bash
# Development with Turbopack
next dev --turbo

# Production build (not ready yet)
# next build --turbo
```

## Search Helpers

```bash
# Find config docs
grep -r "next.config\|configuration" ./docs/next/

# Find optimization docs
grep -r "Image\|Font\|Script\|optimization" ./docs/next/

# Find metadata docs
grep -r "metadata\|SEO\|generateMetadata" ./docs/next/

# List config files
ls ./docs/next/app/api-reference/
```

## Common Errors

- **Image domain not configured**: Remote image source not allowed
  - Solution: Add domain to `images.domains` in next.config.js

- **Font not loading**: Wrong path or subset
  - Solution: Check font file path and subset configuration

- **Metadata not updating**: Using static metadata for dynamic page
  - Solution: Use generateMetadata function

- **Build fails**: Invalid next.config.js syntax
  - Solution: Check syntax and required fields

## Performance Tips

1. **Use next/image** - Automatic optimization
2. **Load fonts with next/font** - Zero layout shift
3. **Defer non-critical scripts** - Use lazyOnload
4. **Enable Turbopack** - Faster dev builds (7x faster)
5. **Use static metadata** - When possible
6. **Optimize images** - Set quality and sizes
7. **Analyze bundle** - Find large dependencies
8. **Use CDN for assets** - Set assetPrefix

## Notes

- Documentation covers Next.js 13-14
- Turbopack is experimental in Next.js 14
- next/image requires width/height or fill
- next/font automatically self-hosts Google Fonts
- Environment variables starting with NEXT_PUBLIC_ are exposed to browser
- Metadata is merged from layout to page
- File paths reference local documentation cache
- For latest updates, check https://nextjs.org/docs/app/api-reference/next-config-js
