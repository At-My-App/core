import { createAtMyAppClient, type LocalDataSource } from "../src";

describe("local data source adapter", () => {
  const localDataSource: LocalDataSource = {
    async readFile(path) {
      if (path === "settings.json") {
        return JSON.stringify({ theme: "sunrise" });
      }
      return null;
    },
    async readJson(path) {
      if (path === "settings.json") {
        return { theme: "sunrise" };
      }
      return null;
    },
    async listCollection(name) {
      if (name === "posts") {
        return [
          {
            id: "1",
            data: { title: "Hello playground" },
            createdAt: "2026-03-16T00:00:00.000Z",
            updatedAt: "2026-03-16T00:00:00.000Z",
          },
        ];
      }
      return [];
    },
    async getStaticUrl(path) {
      if (path === "settings.json") {
        return "data:application/json,%7B%7D";
      }
      return null;
    },
  };

  it("reads content and collections through localDataSource", async () => {
    const client = createAtMyAppClient({
      apiKey: "local",
      baseUrl: "http://localhost",
      clientMode: "local",
      localDataSource,
    });

    const content = await client.storage.getFromPath("settings.json");
    const rows = await client.collections.list("posts");
    const staticUrl = await client.storage.getStaticUrl("settings.json");

    expect(content).toEqual({ theme: "sunrise" });
    expect(rows).toEqual([{ title: "Hello playground" }]);
    expect(staticUrl).toBe("data:application/json,%7B%7D");
  });
});
