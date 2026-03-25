import {
  createAtMyAppClient,
  defineDocument,
  defineImage,
  defineSchema,
  type LocalDataSource,
  s,
} from "../src";

const schema = defineSchema({
  definitions: {
    settings: defineDocument({
      path: "settings.json",
      fields: {
        theme: s.string(),
      },
    }),
    logo: defineImage({
      path: "logo.png",
    }),
  },
});

describe("local data source adapter", () => {
  const localDataSource: LocalDataSource = {
    async readFile(path) {
      if (path === "settings.json") {
        return JSON.stringify({ theme: "sunrise" });
      }
      if (path === "logo.png") {
        return "raw-logo";
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
      if (path === "logo.png") {
        return "data:image/png;base64,AAA";
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
      schema,
    });

    const content = await client.storage.getFromPath("settings.json");
    const rows = await client.collections.list("posts");
    const staticUrl = await client.storage.getStaticUrl("settings.json");
    const settings = await client.storage.get("settings");
    const settingsValue = await client.storage.getValue("settings");
    const logo = await client.storage.get("logo");
    const logoValue = await client.storage.getValue("logo");

    expect(content).toEqual({ theme: "sunrise" });
    expect(rows).toEqual([{ title: "Hello playground" }]);
    expect(staticUrl).toBe("data:application/json,%7B%7D");
    expect(settings.__amatype).toBe("AmaContent");
    expect(settings.data).toEqual({ theme: "sunrise" });
    expect(settingsValue).toEqual({ theme: "sunrise" });
    expect(logo.__amatype).toBe("AmaImage");
    expect(logo.src).toBe("raw-logo");
    expect(logoValue).toEqual({ url: "data:image/png;base64,AAA" });
  });
});
