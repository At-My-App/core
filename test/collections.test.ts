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
        return HttpResponse.json({ success: true, data: [{ id: 1 }, { id: 2 }] });
      })
    );

    const client = createAtMyAppClient({ apiKey: "k", baseUrl: API_BASE_URL });
    const rows = await client.collections.list("orders", {
      filter: F.and(F.eq("status", "done"), F.gte("total", 100)),
    });

    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(2);
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
        return HttpResponse.json({ success: true, data: [{ id: "123" }] });
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
});
