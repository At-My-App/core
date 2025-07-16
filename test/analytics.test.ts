// @ts-nocheck

import { createAtMyAppClient } from "../src/client/client";
import { server } from "./server";
import { API_BASE_URL } from "./handlers";
import { http, HttpResponse } from "msw";

describe("Analytics with MSW", () => {
  let client: ReturnType<typeof createAtMyAppClient>;

  beforeEach(() => {
    client = createAtMyAppClient({
      apiKey: "test-api-key",
      baseUrl: API_BASE_URL,
    });
  });

  describe("trackEvent (Basic Events)", () => {
    it("should successfully track a basic event", async () => {
      const result = await client.analytics.trackEvent("page_view");
      expect(result).toBe(true);
    });

    it("should successfully track a user login event", async () => {
      const result = await client.analytics.trackEvent("user_login");
      expect(result).toBe(true);
    });

    it("should successfully track a button click event", async () => {
      const result = await client.analytics.trackEvent("button_click");
      expect(result).toBe(true);
    });

    it("should handle server errors gracefully", async () => {
      const result = await client.analytics.trackEvent("error_event");
      expect(result).toBe(false);
    });

    it("should handle network errors", async () => {
      // Override with a network error for this test
      server.use(
        http.post(`${API_BASE_URL}/analytics/network_error`, () => {
          return HttpResponse.error();
        })
      );

      const result = await client.analytics.trackEvent("network_error");
      expect(result).toBe(false);
    });
  });

  describe("trackCustomEvent (Custom Events)", () => {
    it("should successfully track a custom event with object data", async () => {
      const eventData = {
        user_id: "12345",
        action: "purchase",
        product_id: "abc123",
      };

      const result = await client.analytics.trackCustomEvent(
        "custom_purchase",
        eventData
      );
      expect(result).toBe(true);
    });

    it("should successfully track a custom event with array data", async () => {
      const eventData = ["user_12345", "purchase", "product_abc123"];

      const result = await client.analytics.trackCustomEvent(
        "custom_purchase_array",
        eventData
      );
      expect(result).toBe(true);
    });

    it("should handle server errors for custom events", async () => {
      const eventData = { error: "test" };
      const result = await client.analytics.trackCustomEvent(
        "custom_error_event",
        eventData
      );
      expect(result).toBe(false);
    });

    it("should reject events with too many data entries (>20)", async () => {
      // Create an object with 21 properties
      const largeEventData: Record<string, string> = {};
      for (let i = 0; i < 21; i++) {
        largeEventData[`field_${i}`] = `value_${i}`;
      }

      const result = await client.analytics.trackCustomEvent(
        "large_event",
        largeEventData
      );
      expect(result).toBe(false);
    });

    it("should reject events with data size exceeding 5000 bytes", async () => {
      // Create a string that's definitely over 5000 bytes
      const largeString = "x".repeat(5001);
      const eventData = { large_field: largeString };

      const result = await client.analytics.trackCustomEvent(
        "large_data_event",
        eventData
      );
      expect(result).toBe(false);
    });

    it("should handle array data with size validation", async () => {
      // Create an array with 21 elements
      const largeArray = Array.from({ length: 21 }, (_, i) => `value_${i}`);

      const result = await client.analytics.trackCustomEvent(
        "large_array_event",
        largeArray
      );
      expect(result).toBe(false);
    });

    it("should properly convert non-string values to strings", async () => {
      const eventData = {
        user_id: 12345, // number
        is_premium: true, // boolean
        purchase_date: null, // null
        undefined_field: undefined, // undefined
      };

      const result = await client.analytics.trackCustomEvent(
        "conversion_test",
        eventData
      );
      expect(result).toBe(true);
    });

    it("should sort object keys for consistent data ordering", async () => {
      const eventData = {
        z_field: "last",
        a_field: "first",
        m_field: "middle",
      };

      // The implementation should sort the keys alphabetically
      const result = await client.analytics.trackCustomEvent(
        "sorting_test",
        eventData
      );
      expect(result).toBe(true);
    });

    it("should handle empty object data", async () => {
      const result = await client.analytics.trackCustomEvent("empty_event", {});
      expect(result).toBe(true);
    });

    it("should handle empty array data", async () => {
      const result = await client.analytics.trackCustomEvent(
        "empty_array_event",
        []
      );
      expect(result).toBe(true);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed API responses", async () => {
      server.use(
        http.post(`${API_BASE_URL}/analytics/malformed`, () => {
          // Return a JSON response with an error field to indicate failure
          return HttpResponse.json(
            { error: "Malformed response" },
            { status: 500 }
          );
        })
      );

      const result = await client.analytics.trackEvent("malformed");
      expect(result).toBe(false);
    });

    it("should handle authentication failures", async () => {
      server.use(
        http.post(`${API_BASE_URL}/analytics/auth_fail`, () => {
          return new HttpResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        })
      );

      const result = await client.analytics.trackEvent("auth_fail");
      expect(result).toBe(false);
    });

    it("should handle rate limiting", async () => {
      server.use(
        http.post(`${API_BASE_URL}/analytics/rate_limit`, () => {
          return new HttpResponse(
            JSON.stringify({ error: "Rate limit exceeded" }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
      );

      const result = await client.analytics.trackEvent("rate_limit");
      expect(result).toBe(false);
    });
  });

  describe("Integration tests", () => {
    it("should work with different API keys", async () => {
      const clientWithDifferentKey = createAtMyAppClient({
        apiKey: "different-api-key",
        baseUrl: API_BASE_URL,
      });

      const result =
        await clientWithDifferentKey.analytics.trackEvent("different_key_test");
      expect(result).toBe(true);
    });

    it("should work with different base URLs", async () => {
      const altBaseUrl = "http://localhost:9999";

      server.use(
        http.post(`${altBaseUrl}/analytics/alt_url_test`, () => {
          return HttpResponse.json({ success: true, eventId: "alt_url_test" });
        })
      );

      const clientWithDifferentUrl = createAtMyAppClient({
        apiKey: "test-api-key",
        baseUrl: altBaseUrl,
      });

      const result =
        await clientWithDifferentUrl.analytics.trackEvent("alt_url_test");
      expect(result).toBe(true);
    });

    it("should handle concurrent event tracking", async () => {
      const promises = [
        client.analytics.trackEvent("concurrent_1"),
        client.analytics.trackEvent("concurrent_2"),
        client.analytics.trackEvent("concurrent_3"),
        client.analytics.trackCustomEvent("concurrent_custom", {
          test: "data",
        }),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([true, true, true, true]);
    });
  });
});
