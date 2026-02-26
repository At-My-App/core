// @ts-nocheck

import { createAtMyAppClient } from "../src/client/client";
import { server } from "./server";
import { API_BASE_URL } from "./handlers";
import { http, HttpResponse } from "msw";

describe("Meta client", () => {
  let client: ReturnType<typeof createAtMyAppClient>;

  beforeEach(() => {
    client = createAtMyAppClient({
      apiKey: "test-api-key",
      baseUrl: API_BASE_URL,
    });
  });

  it("returns head config for a site", async () => {
    const result = await client.meta.getHeadConfig("site-1");

    expect(result.title).toBe("AtMyApp default title");
    expect(result.description).toBe("AtMyApp default description");
    expect(result.canonical).toBe("https://example.com");
    expect(result.siteId).toBe("site-1");
  });

  it("throws a helpful error for API failures", async () => {
    await expect(client.meta.getHeadConfig("error")).rejects.toThrow(
      "AtMyApp: failed to fetch head config for site \"error\""
    );
    await expect(client.meta.getHeadConfig("error")).rejects.toThrow(
      "Status: 500"
    );
  });

  it("throws a helpful error for network failures", async () => {
    server.use(
      http.get(`${API_BASE_URL}/meta/sites/network_error/head`, () => {
        return HttpResponse.error();
      })
    );

    await expect(client.meta.getHeadConfig("network_error")).rejects.toThrow(
      "AtMyApp: failed to fetch head config for site \"network_error\""
    );
  });
});
