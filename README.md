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
📝 **User Submissions** - Collect forms and user-generated content effortlessly
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
import { createAtMyAppClient, AmaContentDef } from "@atmyapp/core";

// Initialize the client
const client = createAtMyAppClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.atmyapp.com",
});

// Define your content structure
type JokeOfTheDay = {
  joke: string;
  punchline: string;
};

// Mark the content as a JSON file
type JokeOfTheDayDef = AmaContentDef<"joke.json", JokeOfTheDay>;

// Define image type
type JokeImageDef = AmaImageDef<
  "joke-image",
  {
    maxSize: { width: 1920; height: 1080 };
  }
>;

// Define event type
type JokeViewEvent = AmaEventDef<"joke_view">;

// Export the files that shoul be managed by AtMyApp
export type ATMYAPP = [JokeOfTheDayDef, JokeImageDef, JokeViewEvent];

// Fetch content
const content = await client.storage.get<JokeOfTheDayDef>(
  "joke.json",
  "content"
);
console.log(content.data);

// Get the image as static URL
const imageUrl = await client.storage.getStaticUrl("joke-image");
console.log(imageUrl);

// Track basic events (server automatically collects IP, location, etc.)
await client.analytics.trackEvent<JokeViewEvent>("joke_view");
```

## 📚 API Reference

### Client Setup

#### `createAtMyAppClient(options: AtMyAppClientOptions)`

Creates a new AtMyApp client instance.

**Parameters:**

- `apiKey` (string) - Your AtMyApp API key
- `baseUrl` (string) - The base URL for the AtMyApp API
- `customFetch` (optional) - Custom fetch implementation
- `previewKey` (optional) - Preview key for draft content (when using preview mode we add the query parameter `previewKey` to the website URL). You can check the website URL to see if it contains the `previewKey` query parameter (in the future we will automatically check the URL for the preview key)
- `mode` (optional) - Request mode: `'client'` for client-side requests with cache (default), `'priority'` for server-side requests without cache (mainly for server-side rendering, higher usage cost)

```typescript
const client = createAtMyAppClient({
  apiKey: process.env.ATMYAPP_API_KEY!,
  baseUrl: "https://api.atmyapp.com",
  previewKey: "preview-123", // Optional: for preview mode (got from window.location.search)
});
```

### Collections API

Use the Collections client to list entries, add filters with a fluent DSL, and fetch entries by id. The client always returns full rows and always enables the static-urls plugin by default.

Setup
```typescript
import { createAtMyAppClient, CollectionsListOptions, CollectionsFilter as F } from "@atmyapp/core";

const client = createAtMyAppClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.atmyapp.com",
  // Optional: default preview key for preview mode (used when per-call previewKey is omitted)
  previewKey: "preview-123",
});
```

List entries
```typescript
// Full rows by default
const rows = await client.collections.list("blog_posts");

// With options
const rows2 = await client.collections.list("blog_posts", {
  limit: 20,
  offset: 0,
  order: "updated.desc",
});
```

Filtering with F
```typescript
// Equality
await client.collections.list("blog_posts", {
  filter: F.eq("author", "Alice"),
});

// AND
await client.collections.list("blog_posts", {
  filter: F.and(
    F.eq("published", true),
    F.gte("updated", new Date("2024-01-01")),
  ),
});

// OR
await client.collections.list("blog_posts", {
  filter: F.or(
    F.eq("author", "Alice"),
    F.eq("author", "Bob"),
  ),
});

// IN
await client.collections.list("blog_posts", {
  filter: F.in("id", [1, 2, 3]),
});
```

Preview mode (draft content)
```typescript
// Per-call preview key (overrides client default if set)
await client.collections.list("blog_posts", {
  previewKey: "prev-xyz-123",
});
```

Get by id
```typescript
const row = await client.collections.getById("blog_posts", 123);

// With preview key
const draftRow = await client.collections.getById("blog_posts", 123, {
  previewKey: "prev-xyz-123",
});
```

Helpers
```typescript
// first: returns the first row or null (set order in options if needed)
const firstRow = await client.collections.first("blog_posts", {
  order: "updated.desc",
});

// getManyByIds: returns all found rows reordered to match the ids array
const rowsById = await client.collections.getManyByIds("blog_posts", [5, 2, 9], {
  // Optional: order is ignored for reordering; we reorder client-side
  previewKey: "prev-xyz-123",
});
```

Notes
- We always return full rows; no select override is applied by helper methods.
- The static-urls plugin is always enabled for collection requests.
- For OR filters, AND conditions inside an OR group aren’t supported by the server query syntax.

#### `client.collections.get<T>(path, mode, options?)`

Fetch typed content from a specific path.

**Parameters:**

- `path` (string) - The content path
- `mode` ('file' | 'content' | 'image') - The type of content to fetch
- `options` (optional) - Additional options including preview key

**Generic type:**

- `T` - The type of the content to fetch (prefilled with the path, content type and return type)

**Examples:**

```typescript
// 📄 Fetch content data
const blogPost = await client.collections.get("/blog/my-post.json", "content");
if (!blogPost.isError) {
  console.log(blogPost.data); // Your content data
}
```

#### `client.collections.getFromPath(path, options?)`

Fetch raw data from a path without type safety.

```typescript
const rawData = await client.collections.getFromPath("/api/config");
```

#### `client.collections.getStaticUrl(path, options?)`

Get the static URL for an image or file. This is useful for embedding images in your website or prerender your websites at build time.

```typescript
const imageUrl = await client.collections.getStaticUrl("/images/my-image.png");
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

**Parameters:**

- `eventId` (string) - Unique identifier for the event type

**Examples:**

```typescript
import { AmaEventDef } from "@atmyapp/core";

// Define your event types
type PageViewEvent = AmaEventDef<"page_view">;

// Export the events that should be managed by AtMyApp
export type ATMYAPP = [PageViewEvent];

// 📄 Track page views
await client.analytics.trackEvent<PageViewEvent>("page_view");
```

#### `client.analytics.trackCustomEvent<T>(eventId, data)`

Track custom events with structured data for detailed analytics and business intelligence.

**Parameters:**

- `eventId` (string) - Unique identifier for the event type
- `data` (Record<string, string> | string[]) - Event data (max 20 entries, 5KB total)

**Examples:**

```typescript
import { AmaCustomEventDef } from "@atmyapp/core";

// Define your event types
type CampaignClickEvent = AmaCustomEventDef<
  "campaign_click",
  ["campaign_id", "source", "medium", "content"]
>;

// Export the events that should be managed by AtMyApp
export type ATMYAPP = [CampaignClickEvent];

// 🎯 Track marketing campaigns
await client.analytics.trackCustomEvent("campaign_click", {
  campaign_id: "summer_sale_2024",
  source: "email",
  medium: "newsletter",
  content: "hero_banner",
});
```

## 🎨 Type Definitions

AtMyApp Core provides comprehensive TypeScript definitions for type-safe development. Additionally, the AtMyApp CLI will generate the type definitions for you and add them to your project.

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
type BlogPostDef = AmaContentDef<"/blog/posts.json", BlogPost>;

// Export the content types that should be managed by AtMyApp
export type ATMYAPP = [BlogPostDef];

// Use with the client
const post = await client.collections.get<BlogPostDef>(
  "/blog/posts.json",
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

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[🌐 AtMyApp Website](https://atmyapp.com)** • **[📚 Documentation](https://docs.atmyapp.com)** • **[💬 Support](https://atmyapp.com/support)**

Made with ❤️ by the AtMyApp team

_Update your website with words, not code._

</div>
