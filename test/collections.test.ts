// @ts-nocheck
import { createAtMyAppClient } from "../src/client/client";
import { server } from "./server";
import { API_BASE_URL } from "./handlers";
import { http, HttpResponse } from "msw";
import { F } from "../src/client/collections";

describe("Collections client", () => {
  it("lists with AND filters", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          data: [
            { id: 1, data: { status: "done", total: 120 } },
            { id: 2, data: { status: "pending", total: 80 } },
          ],
        });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    const rows = await client.collections.list("orders", {
      filter: F.and(F.eq("status", "done"), F.gte("total", 100)),
    });

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(2);
    expect(rows[0].status).toBe("done");
    expect(requestUrl?.searchParams.get("status.eq")).toBe("done");
    expect(requestUrl?.searchParams.get("total.gte")).toBe("100");
  });

  it("supports IN operator", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    await client.collections.list("orders", {
      filter: F.in("status", ["done", "canceled"]),
    });

    expect(requestUrl?.searchParams.get("status.in")).toBe("(done,canceled)");
  });

  it("supports OR groups combined with AND", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    await client.collections.list("orders", {
      filter: F.and(
        F.eq("category", "retail"),
        F.or(F.eq("status", "done"), F.in("status", ["canceled", "refunded"]))
      ),
    });

    const orValues = requestUrl?.searchParams.getAll("or");
    expect(requestUrl?.searchParams.get("category.eq")).toBe("retail");
    expect(orValues && orValues[0]).toBe("(status.eq.done,status.in.(canceled,refunded))");
  });

  it("normalizes select/order and limit/offset", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    await client.collections.list("orders", {
      select: ["id", "data", "foo"],
      order: "updated.desc",
      limit: 50,
      offset: 50,
    });

    expect(requestUrl?.searchParams.get("select")).toBe("id,data");
    expect(requestUrl?.searchParams.get("order")).toBe("updated.desc");
    expect(requestUrl?.searchParams.get("limit")).toBe("50");
    expect(requestUrl?.searchParams.get("offset")).toBe("50");
  });

  it("supports getById via id.eq and limit 1", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          data: [{ id: "123", data: { id: "123", title: "Hello" } }],
        });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    const row = await client.collections.getById("orders", "123");
    expect(row?.id).toBe("123");
    expect(requestUrl?.searchParams.get("id.eq")).toBe("123");
    expect(requestUrl?.searchParams.get("limit")).toBe("1");
  });

  it("rejects AND inside OR with a clear error", async () => {
    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    await expect(
      client.collections.list("orders", {
        filter: F.or(F.and(F.eq("a", 1), F.eq("b", 2)), F.eq("c", 3)),
      })
    ).rejects.toThrow("AND inside OR is not supported");
  });

  it("returns dictionary format when requested", async () => {
    let requestUrl: URL | undefined;
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          data: [
            { id: "1", data: { title: "First" } },
            { id: "2", data: { title: "Second" } },
          ],
        });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    const rows = await client.collections.list("orders", { format: "dictionary" });

    expect(Object.keys(rows)).toEqual(["1", "2"]);
    expect(rows["1"].title).toBe("First");
    expect(requestUrl?.searchParams.getAll("plugins")).toEqual(["static-url"]);
  });

  it("returns raw rows when format is raw", async () => {
    server.use(
      http.get(`${API_BASE_URL}/collections/:collection`, () => {
        return HttpResponse.json({
          success: true,
          data: [
            { id: "1", data: { title: "First" }, created: "2024-01-01" },
          ],
        });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    const rows = await client.collections.list("orders", { format: "raw" });

    expect(rows[0].id).toBe("1");
    expect(rows[0].data.title).toBe("First");
    expect(rows[0].created).toBe("2024-01-01");
  });
});
