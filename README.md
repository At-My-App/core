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

// Track basic events (server automatically collects IP, location, etc.)
await client.analytics.trackEvent("page_view");

// Track custom events with detailed data
await client.analytics.trackCustomEvent("purchase", {
  product_id: "prod_123",
  amount: "99.99",
  user_id: "user456",
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

// 🎨 Fetch icons
const logoIcon = await client.collections.get("/icons/logo", "icon");
if (!logoIcon.isError) {
  console.log(logoIcon.src); // Icon URL
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

Track user interactions and content performance with the built-in analytics system. AtMyApp provides two types of event tracking:

1. **Basic Events** - Simple occurrence tracking where the server automatically collects metadata (IP, location, user agent, etc.)
2. **Custom Events** - Structured data tracking with your own custom fields

#### `client.analytics.trackEvent<T>(eventId)`

Track basic events for simple occurrence tracking. Perfect for page views, user actions, and other events where you only need to know that something happened. The server automatically collects:

- 🌍 IP address and geographic location
- 🖥️ User agent and device information
- ⏰ Precise timestamp
- 🔗 Referrer information
- 📱 Screen resolution and viewport

**Parameters:**

- `eventId` (string) - Unique identifier for the event type

**Examples:**

```typescript
// 📄 Track page views
await client.analytics.trackEvent("page_view");

// 👤 Track user authentication
await client.analytics.trackEvent("user_login");
await client.analytics.trackEvent("user_logout");

// 🖱️ Track user interactions
await client.analytics.trackEvent("button_click");
await client.analytics.trackEvent("form_submit");
await client.analytics.trackEvent("download_start");

// 📊 Track content engagement
await client.analytics.trackEvent("video_play");
await client.analytics.trackEvent("article_share");
await client.analytics.trackEvent("newsletter_signup");
```

#### `client.analytics.trackCustomEvent<T>(eventId, data)`

Track custom events with structured data for detailed analytics and business intelligence.

**Parameters:**

- `eventId` (string) - Unique identifier for the event type
- `data` (Record<string, string> | string[]) - Event data (max 20 entries, 5KB total)

**Examples:**

```typescript
// 🛒 Track e-commerce events
await client.analytics.trackCustomEvent("purchase", {
  product_id: "prod_123",
  amount: "99.99",
  currency: "USD",
  user_id: "user_456",
  category: "electronics",
});

// 🎯 Track marketing campaigns
await client.analytics.trackCustomEvent("campaign_click", {
  campaign_id: "summer_sale_2024",
  source: "email",
  medium: "newsletter",
  content: "hero_banner",
});

// 📝 Track content performance
await client.analytics.trackCustomEvent("content_engagement", [
  "blog_post_123",
  "scroll_75_percent",
  "5_minute_read_time",
  "social_share",
]);
```

## 🎨 Type Definitions

AtMyApp Core provides comprehensive TypeScript definitions for type-safe development.

### Basic Event Types

```typescript
import { AmaEventDef, AmaEvent } from "@atmyapp/core";

// Define basic events for simple occurrence tracking
const pageViewEvent: AmaEventDef<"page_view"> = {
  id: "page_view",
  type: "basic_event",
  __is_ATMYAPP_Object: true,
};

const userLoginEvent: AmaEventDef<"user_login"> = {
  id: "user_login",
  type: "basic_event",
  __is_ATMYAPP_Object: true,
};

// Type-safe basic event tracking
await client.analytics.trackEvent("page_view");
await client.analytics.trackEvent("user_login");
```

### Custom Event Types

```typescript
import { AmaCustomEventDef } from "@atmyapp/core";

// Define custom events with structured data
type PageViewEvent = AmaCustomEventDef<
  "page_view_detailed",
  ["page", "referrer", "session_id"]
>;

type PurchaseEvent = AmaCustomEventDef<
  "purchase",
  ["product_id", "amount", "user_id", "category"]
>;

// Type-safe custom event tracking
await client.analytics.trackCustomEvent<PageViewEvent>("page_view_detailed", {
  page: "/products/laptop",
  referrer: "google.com",
  session_id: "sess_123",
});

await client.analytics.trackCustomEvent<PurchaseEvent>("purchase", {
  product_id: "laptop_pro_15",
  amount: "1299.99",
  user_id: "user_789",
  category: "electronics",
});
```

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

### Icon Types

```typescript
import { AmaIconDef } from "@atmyapp/core";

// Define icon (simpler than images, no configuration needed)
type LogoIconDef = AmaIconDef<"/icons/logo">;

const logoIcon = await client.collections.get<LogoIconDef>(
  "/icons/logo",
  "icon"
);
```

## 💡 Examples

### 📊 Analytics Implementation Patterns

#### Basic Event Tracking for SPA

```typescript
// Track page navigation in Single Page Applications
function trackPageView(path: string) {
  // Basic event - server collects all metadata automatically
  await client.analytics.trackEvent("page_view");

  // Optional: Custom event for detailed analytics
  await client.analytics.trackCustomEvent("page_view_detailed", {
    path,
    timestamp: new Date().toISOString(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  });
}

// Usage in your router
router.afterEach((to) => {
  trackPageView(to.path);
});
```

#### E-commerce Event Tracking

```typescript
// Basic events for simple funnel tracking
await client.analytics.trackEvent("product_view");
await client.analytics.trackEvent("add_to_cart");
await client.analytics.trackEvent("checkout_start");
await client.analytics.trackEvent("purchase_complete");

// Custom events for business intelligence
await client.analytics.trackCustomEvent("product_interaction", {
  product_id: "laptop_pro_15",
  action: "view",
  category: "electronics",
  price: "1299.99",
  in_stock: "true",
});

await client.analytics.trackCustomEvent("purchase", {
  order_id: "order_789",
  total_amount: "1399.98",
  items_count: "2",
  payment_method: "credit_card",
  shipping_method: "express",
});
```

#### Content Engagement Tracking

```typescript
// Basic engagement events
await client.analytics.trackEvent("article_start");
await client.analytics.trackEvent("video_play");
await client.analytics.trackEvent("form_submit");

// Detailed engagement metrics
await client.analytics.trackCustomEvent("content_engagement", {
  content_id: "blog_post_123",
  content_type: "article",
  engagement_type: "scroll_milestone",
  scroll_percentage: "75",
  time_spent: "180", // seconds
});

// Social sharing tracking
await client.analytics.trackCustomEvent("social_share", {
  content_id: "blog_post_123",
  platform: "twitter",
  share_type: "native_button",
  user_id: "user_456",
});
```

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
  products.data.forEach(async (product) => {
    console.log(`${product.name}: $${product.price}`);

    // Track product view with basic event
    await client.analytics.trackEvent("product_view");

    // Track detailed product analytics
    await client.analytics.trackCustomEvent("product_interaction", {
      product_id: product.id,
      action: "list_view",
      category: "catalog_browse",
      price: product.price.toString(),
    });
  });
}
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

// Track blog engagement
await client.analytics.trackEvent("blog_page_view");

await client.analytics.trackCustomEvent("content_discovery", {
  content_type: "blog_post",
  discovery_method: "featured_section",
  post_count: featuredPosts.data?.length.toString() || "0",
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

// Fetch icons for UI elements
const uiIcons = await Promise.all([
  client.collections.get("/icons/menu", "icon"),
  client.collections.get("/icons/search", "icon"),
  client.collections.get("/icons/user", "icon"),
]);

const validImages = galleryImages.filter((img) => !img.isError);
const validIcons = uiIcons.filter((icon) => !icon.isError);

// Track gallery interaction
await client.analytics.trackEvent("gallery_view");

await client.analytics.trackCustomEvent("media_engagement", {
  gallery_id: "homepage_gallery",
  images_loaded: validImages.length.toString(),
  interaction_type: "initial_load",
});
```

### 🔍 Error Handling

```typescript
const content = await client.collections.get("/blog/post", "content");

if (content.isError) {
  // Track error occurrence
  await client.analytics.trackEvent("content_error");

  // Track detailed error analytics
  await client.analytics.trackCustomEvent("error_tracking", {
    error_type: "content_fetch",
    status_code: content.errorStatus?.toString() || "unknown",
    resource_path: "/blog/post",
    error_message: content.errorMessage || "unknown_error",
  });

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
  // Track successful content load
  await client.analytics.trackEvent("content_load_success");
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

// Track page views in _app.tsx
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      atmyapp.analytics.trackEvent("page_view");
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return <Component {...pageProps} />;
}
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
          // Track content errors
          atmyapp.analytics.trackEvent("content_error");
        } else {
          setData(result.data);
          // Track successful content loads
          atmyapp.analytics.trackEvent("content_load_success");
        }
      })
      .finally(() => setLoading(false));
  }, [path]);

  return { data, loading, error };
}

// hooks/useAnalytics.ts
export function useAnalytics() {
  return {
    trackEvent: atmyapp.analytics.trackEvent,
    trackCustomEvent: atmyapp.analytics.trackCustomEvent,
  };
}
```

## 🚨 Rate Limits & Best Practices

### Analytics Limits

- **Basic Events**: No data size limits (only event ID required)
- **Custom Events**: Maximum 20 data entries per event
- **Custom Events**: Maximum 5KB total size for all string values
- Events exceeding limits will be rejected with a warning

### When to Use Basic vs Custom Events

#### ✅ Use Basic Events For:

- Page views and navigation
- Simple user actions (clicks, form submissions)
- Authentication events (login, logout)
- Content interactions (video play, download)
- Error occurrences
- Feature usage tracking

#### ✅ Use Custom Events For:

- E-commerce transactions with details
- A/B testing and experiments
- Performance monitoring with metrics
- User journey tracking with context
- Business intelligence and reporting
- Campaign and marketing attribution

### Performance Tips

- ✅ **Prefer basic events** for high-frequency actions
- ✅ **Cache content responses** when possible
- ✅ **Use preview mode** only during development
- ✅ **Batch analytics events** when appropriate
- ✅ **Handle errors gracefully** with fallback content
- ✅ **Track errors** to monitor API health

```typescript
// Good: Use basic events for frequent actions
document.addEventListener("click", () => {
  client.analytics.trackEvent("page_interaction");
});

// Good: Use custom events for important business data
async function handlePurchase(orderData) {
  await client.analytics.trackCustomEvent("purchase", {
    order_id: orderData.id,
    amount: orderData.total,
    item_count: orderData.items.length.toString(),
  });
}
```

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
