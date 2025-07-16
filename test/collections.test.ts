// @ts-nocheck

import { createAtMyAppClient } from "../src/client/client";
import { server } from "./server"; // Import server for handler manipulation if needed
import { API_BASE_URL, file_json, preview_json } from "./handlers";
import { http, HttpResponse } from "msw";

describe("Collections with MSW", () => {
  it("should fetch data from path", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const data = await client.collections.get("/file.json", "file");
    expect(data.src).toEqual(file_json);
  });

  it("should handle 404 errors", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    // Override with a 404 response for this test
    server.use(
      http.get(`${API_BASE_URL}/storage/f/missing.json`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const data = await client.collections.get("/missing.json", "file");
    expect(data.isError).toBe(true);
    expect(data.errorMessage).toBe("File not found");
    expect(data.errorStatus).toBe(404);
  });

  it("should handle authentication errors", async () => {
    const client = createAtMyAppClient({
      apiKey: "invalid-key",
      baseUrl: API_BASE_URL,
    });

    // Override with a 401 response for this test
    server.use(
      http.get(`${API_BASE_URL}/storage/f/auth.json`, () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    const data = await client.collections.get("/auth.json", "file");
    expect(data.isError).toBe(true);
    expect(data.errorMessage).toBe("Wrong API key");
    expect(data.errorStatus).toBe(401);
  });

  it("should handle generic errors", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    // Override with a 500 response for this test
    server.use(
      http.get(`${API_BASE_URL}/storage/f/error.json`, () => {
        return new HttpResponse(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    const data = await client.collections.get("/error.json", "file");
    expect(data.isError).toBe(true);
    expect(data.errorStatus).toBe(500);
  });

  it("should fetch content type data", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const contentData = { name: "Test Content" };

    server.use(
      http.get(`${API_BASE_URL}/storage/f/content.json`, () => {
        return HttpResponse.json(contentData);
      })
    );

    const data = await client.collections.get("/content.json", "content");
    expect(data.__amatype).toBe("AmaContent");
    expect(data.data).toEqual(contentData);
    expect(data.isError).toBe(false);
  });

  it("should fetch image type data", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const imageSrc = "https://example.com/image.jpg";

    server.use(
      http.get(`${API_BASE_URL}/storage/f/image.jpg`, () => {
        return HttpResponse.json(imageSrc);
      })
    );

    const data = await client.collections.get("/image.jpg", "image");
    expect(data.__amatype).toBe("AmaImage");
    expect(data.src).toEqual(imageSrc);
    expect(data.isError).toBe(false);
  });

  it("should fetch icon type data", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const iconSrc = "https://example.com/icon.svg";

    server.use(
      http.get(`${API_BASE_URL}/storage/f/icon.svg`, () => {
        return HttpResponse.json(iconSrc);
      })
    );

    const data = await client.collections.get("/icon.svg", "icon");
    expect(data.__amatype).toBe("AmaIcon");
    expect(data.src).toEqual(iconSrc);
    expect(data.isError).toBe(false);
  });

  it("should pass preview key when provided", async () => {
    const previewKey = "preview-123";
    let requestUrl;

    server.use(
      http.get(`${API_BASE_URL}/storage/f/:path`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(preview_json);
      })
    );

    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const data = await client.collections.get("/preview.json", "file", {
      previewKey,
    });

    expect(data.src).toEqual(preview_json);
  });

  it("should use client-level preview key when available", async () => {
    const previewKey = "client-preview-123";
    let requestUrl;

    server.use(
      http.get(`${API_BASE_URL}/storage/f/:path`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(file_json);
      })
    );

    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
      previewKey,
    });

    await client.collections.getFromPath("/preview.json");
    expect(requestUrl.searchParams.get("amaPreviewKey")).toBe(previewKey);
  });

  it("should fetch a static URL for a given path", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const path = "/image.jpg";
    const expectedStaticUrl = "https://cdn.example.com/image.jpg";

    const url = await client.collections.getStaticUrl(path);
    expect(url).toBe(expectedStaticUrl);
  });

  it("should throw an error when static URL generation fails", async () => {
    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    // Override handler with a failure response
    server.use(
      http.get(`${API_BASE_URL}/storage/static/broken.jpg`, () => {
        return new HttpResponse(JSON.stringify({ success: false }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    await expect(
      client.collections.getStaticUrl("/broken.jpg")
    ).rejects.toThrow("Failed to get static URL");
  });

  it("should fetch a static URL with preview key", async () => {
    const previewKey = "preview-123";
    let requestUrl: URL;

    server.use(
      http.get(`${API_BASE_URL}/storage/static/:path`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          data: { staticUrl: "https://cdn.example.com/static/url.jpg" },
        });
      })
    );

    const client = createAtMyAppClient({
      apiKey: "test",
      baseUrl: API_BASE_URL,
    });

    const url = await client.collections.getStaticUrl("/url.jpg", {
      previewKey,
    });

    expect(url).toBe("https://cdn.example.com/static/url.jpg");
    expect(requestUrl.searchParams.get("amaPreviewKey")).toBe(previewKey);
  });
});
