# 🚀 AtMyApp Core JavaScript Library

[![npm version](https://badge.fury.io/js/%40atmyapp%2Fcore.svg)](https://badge.fury.io/js/%40atmyapp%2Fcore)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> 🎯 **Update your website with words, not code.** The official JavaScript/TypeScript client library for AtMyApp - AI-powered content management that empowers everyone on your team.

## 📖 Table of Contents

- [🌟 Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📚 API Reference](#-api-reference)
  - [Client Setup](#client-setup)
  - [Collections API](#collections-api)
  - [Analytics API](#analytics-api)
- [🎨 Type Definitions](#-type-definitions)
- [💡 Examples](#-examples)
- [🔧 Configuration](#-configuration)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Features

✨ **AI-Powered Content Management** - Update content with natural language commands  
🔄 **Real-time Updates** - Instant content changes without code deployments  
📊 **Built-in Analytics** - Track content performance and user engagement  
🖼️ **Media Optimization** - Automatic image optimization and responsive sizing  
🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions  
⚡ **Lightweight** - Minimal dependencies for optimal performance  
🔐 **Secure** - API key authentication with preview mode support

## 📦 Installation

```bash
# npm
npm install @atmyapp/core

# yarn
yarn add @atmyapp/core

# pnpm
pnpm add @atmyapp/core
```

## 🚀 Quick Start

```typescript
import { createAtMyAppClient } from "@atmyapp/core";

// Initialize the client
const client = createAtMyAppClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.atmyapp.com",
});

// Fetch content
const content = await client.collections.get("/blog/latest-post", "content");
console.log(content.data);

// Track analytics
await client.analytics.trackEvent("page_view", {
  page: "/blog/latest-post",
  user_id: "user123",
});
```

## 📚 API Reference

### Client Setup

#### `createAtMyAppClient(options: AtMyAppClientOptions)`

Creates a new AtMyApp client instance.

**Parameters:**

- `apiKey` (string) - Your AtMyApp API key
- `baseUrl` (string) - The base URL for the AtMyApp API
- `customFetch` (optional) - Custom fetch implementation
- `previewKey` (optional) - Preview key for draft content

```typescript
const client = createAtMyAppClient({
  apiKey: process.env.ATMYAPP_API_KEY!,
  baseUrl: "https://api.atmyapp.com",
  previewKey: "preview-123", // Optional: for preview mode
});
```

### Collections API

The Collections API allows you to fetch content, images, and files from your AtMyApp project.

#### `client.collections.get<T>(path, mode, options?)`

Fetch typed content from a specific path.

**Parameters:**

- `path` (string) - The content path
- `mode` ('file' | 'content' | 'image') - The type of content to fetch
- `options` (optional) - Additional options including preview key

**Examples:**

```typescript
// 📄 Fetch content data
const blogPost = await client.collections.get("/blog/my-post", "content");
if (!blogPost.isError) {
  console.log(blogPost.data); // Your content data
}

// 🖼️ Fetch optimized images
const heroImage = await client.collections.get("/images/hero", "image");
if (!heroImage.isError) {
  console.log(heroImage.src); // Optimized image URL
}

// 📁 Fetch raw files
const document = await client.collections.get("/docs/manual.pdf", "file");
if (!document.isError) {
  console.log(document.src); // File URL
}
```

#### `client.collections.getFromPath(path, options?)`

Fetch raw data from a path without type safety.

```typescript
const rawData = await client.collections.getFromPath("/api/config");
```

### Analytics API

Track user interactions and content performance with the built-in analytics system.

#### `client.analytics.trackEvent<T>(eventId, data)`

Track custom events with structured data.

**Parameters:**

- `eventId` (string) - Unique identifier for the event type
- `data` (Record<string, string> | string[]) - Event data (max 20 entries, 5KB total)

**Examples:**

```typescript
// 📊 Track page views
await client.analytics.trackEvent("page_view", {
  page: "/blog/ai-content-management",
  referrer: "google.com",
  user_agent: navigator.userAgent,
});

// 🛒 Track e-commerce events
await client.analytics.trackEvent("purchase", {
  product_id: "prod_123",
  amount: "99.99",
  currency: "USD",
  user_id: "user_456",
});

// 📝 Track content interactions
await client.analytics.trackEvent("content_engagement", [
  "blog_post_123",
  "scroll_50_percent",
  "2024-01-15T10:30:00Z",
]);
```

## 🎨 Type Definitions

AtMyApp Core provides comprehensive TypeScript definitions for type-safe development.

### Content Types

```typescript
import { AmaContentDef, AmaContent } from "@atmyapp/core";

// Define your content structure
interface BlogPost {
  title: string;
  content: string;
  publishedAt: string;
  author: {
    name: string;
    avatar: string;
  };
}

// Create a typed content definition
type BlogPostDef = AmaContentDef<"/blog/posts", BlogPost>;

// Use with the client
const post = await client.collections.get<BlogPostDef>(
  "/blog/posts",
  "content"
);
// post.data is now typed as BlogPost
```

### Image Types

```typescript
import { AmaImageDef, AmaImageConfig } from "@atmyapp/core";

// Define image configuration
interface HeroImageConfig extends AmaImageConfig {
  optimizeFormat: "webp";
  maxSize: { width: 1920; height: 1080 };
}

type HeroImageDef = AmaImageDef<"/images/hero", HeroImageConfig>;

const heroImage = await client.collections.get<HeroImageDef>(
  "/images/hero",
  "image"
);
```

### Event Types

```typescript
import { AmaEventDef } from "@atmyapp/core";

// Define custom events
type PageViewEvent = AmaEventDef<
  "page_view",
  ["page", "referrer", "timestamp"]
>;
type PurchaseEvent = AmaEventDef<
  "purchase",
  ["product_id", "amount", "user_id"]
>;

// Type-safe event tracking
await client.analytics.trackEvent<PageViewEvent>("page_view", {
  page: "/home",
  referrer: "google.com",
  timestamp: new Date().toISOString(),
});
```

## 💡 Examples

### 🏪 E-commerce Product Catalog

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  inStock: boolean;
}

type ProductDef = AmaContentDef<"/products", Product[]>;

// Fetch all products
const products = await client.collections.get<ProductDef>(
  "/products",
  "content"
);

if (!products.isError) {
  products.data.forEach((product) => {
    console.log(`${product.name}: $${product.price}`);
  });
}

// Track product views
await client.analytics.trackEvent("product_view", {
  product_id: "prod_123",
  category: "electronics",
  price: "299.99",
});
```

### 📰 Blog Management

```typescript
interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
}

// Fetch featured posts
const featuredPosts = await client.collections.get("/blog/featured", "content");

// Track reading engagement
await client.analytics.trackEvent("article_read", {
  article_id: "blog_post_123",
  reading_time: "5_minutes",
  completion_rate: "80_percent",
});
```

### 🖼️ Media Gallery

```typescript
// Fetch optimized gallery images
const galleryImages = await Promise.all([
  client.collections.get("/gallery/image-1", "image"),
  client.collections.get("/gallery/image-2", "image"),
  client.collections.get("/gallery/image-3", "image"),
]);

const validImages = galleryImages.filter((img) => !img.isError);
```

### 🔍 Error Handling

```typescript
const content = await client.collections.get("/blog/post", "content");

if (content.isError) {
  switch (content.errorStatus) {
    case 404:
      console.log("Content not found");
      break;
    case 401:
      console.log("Invalid API key");
      break;
    default:
      console.log(`Error: ${content.errorMessage}`);
  }
} else {
  // Content loaded successfully
  console.log(content.data);
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env
ATMYAPP_API_KEY=your_api_key_here
ATMYAPP_BASE_URL=https://api.atmyapp.com
ATMYAPP_PREVIEW_KEY=your_preview_key_here
```

### Preview Mode

Enable preview mode to see draft content before it's published:

```typescript
const client = createAtMyAppClient({
  apiKey: process.env.ATMYAPP_API_KEY!,
  baseUrl: process.env.ATMYAPP_BASE_URL!,
  previewKey: process.env.ATMYAPP_PREVIEW_KEY,
});

// Or pass preview key per request
const draftContent = await client.collections.get(
  "/blog/draft-post",
  "content",
  {
    previewKey: "preview-123",
  }
);
```

### Custom Fetch

Use a custom fetch implementation for advanced use cases:

```typescript
import { createAtMyAppClient } from "@atmyapp/core";

const client = createAtMyAppClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.atmyapp.com",
  customFetch: async (url, options) => {
    // Add custom headers, logging, etc.
    console.log(`Fetching: ${url}`);
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        "X-Custom-Header": "value",
      },
    });
  },
});
```

## 🌐 Framework Integration

### Next.js

```typescript
// lib/atmyapp.ts
import { createAtMyAppClient } from "@atmyapp/core";

export const atmyapp = createAtMyAppClient({
  apiKey: process.env.ATMYAPP_API_KEY!,
  baseUrl: process.env.ATMYAPP_BASE_URL!,
});

// pages/blog/[slug].tsx
import { GetStaticProps } from "next";
import { atmyapp } from "../../lib/atmyapp";

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await atmyapp.collections.get(
    `/blog/${params?.slug}`,
    "content"
  );

  if (post.isError) {
    return { notFound: true };
  }

  return {
    props: { post: post.data },
    revalidate: 60, // ISR
  };
};
```

### React

```typescript
// hooks/useAtMyApp.ts
import { useEffect, useState } from "react";
import { atmyapp } from "../lib/atmyapp";

export function useContent<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    atmyapp.collections
      .get(path, "content")
      .then((result) => {
        if (result.isError) {
          setError(result.errorMessage || "Failed to load content");
        } else {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, [path]);

  return { data, loading, error };
}
```

## 🚨 Rate Limits & Best Practices

### Analytics Limits

- **Maximum 20 data entries** per event
- **Maximum 5KB total size** for all string values
- Events exceeding limits will be rejected with a warning

### Performance Tips

- ✅ Cache content responses when possible
- ✅ Use preview mode only during development
- ✅ Batch analytics events when appropriate
- ✅ Handle errors gracefully with fallback content

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[🌐 AtMyApp Website](https://atmyapp.com)** • **[📚 Documentation](https://docs.atmyapp.com)** • **[💬 Support](https://atmyapp.com/support)**

Made with ❤️ by the AtMyApp team

_Update your website with words, not code._

</div>
