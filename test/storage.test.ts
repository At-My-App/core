import {
  createAtMyAppClient,
  defineDocument,
  defineFile,
  defineImage,
  defineSchema,
  s,
} from "../src";
import { server } from "./server";
import { API_BASE_URL } from "./handlers";
import { http, HttpResponse } from "msw";

type Assert<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

const schema = defineSchema({
  definitions: {
    settings: defineDocument({
      path: "content/site.json",
      fields: {
        theme: s.string({
          default: "sunrise",
        }),
        retries: s.integer({
          default: 3,
        }),
        published: s.boolean({ optional: true }),
      },
    }),
    logo: defineImage({
      path: "assets/logo.png",
    }),
    manual: defineFile({
      path: "docs/manual.pdf",
    }),
  },
});

describe("Storage client", () => {
  it("types schema-aware storage lookups from runtime schema", () => {
    const typedClient = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    if (false) {
      const settingsWrapperPromise = typedClient.storage.get("settings");
      type SettingsWrapper = Awaited<typeof settingsWrapperPromise>;
      type _settingsWrapperKind = Assert<
        SettingsWrapper["__amatype"] extends "AmaContent" ? true : false
      >;
      type _settingsWrapperDataNotAny = Assert<
        IsAny<SettingsWrapper["data"]> extends false ? true : false
      >;
      type _settingsWrapperShape = Assert<
        SettingsWrapper["data"] extends {
          theme: string;
          retries: number;
          published?: boolean;
        }
          ? true
          : false
      >;

      const settingsValuePromise = typedClient.storage.getValue("content/site");
      type SettingsValue = Awaited<typeof settingsValuePromise>;
      type _settingsValueNotAny = Assert<
        IsAny<SettingsValue> extends false ? true : false
      >;
      type _settingsValueShape = Assert<
        SettingsValue extends {
          theme: string;
          retries: number;
          published?: boolean;
        }
          ? true
          : false
      >;

      const logoWrapperPromise = typedClient.storage.get("assets/logo");
      type LogoWrapper = Awaited<typeof logoWrapperPromise>;
      type _logoWrapperKind = Assert<
        LogoWrapper["__amatype"] extends "AmaImage" ? true : false
      >;

      const logoValuePromise = typedClient.storage.getValue("logo");
      type LogoValue = Awaited<typeof logoValuePromise>;
      type _logoValueShape = Assert<
        LogoValue extends { url: string } ? true : false
      >;
      type _logoValueNotAny = Assert<
        IsAny<LogoValue> extends false ? true : false
      >;

      const manualWrapperPromise = typedClient.storage.get("manual");
      type ManualWrapper = Awaited<typeof manualWrapperPromise>;
      type _manualWrapperKind = Assert<
        ManualWrapper["__amatype"] extends "AmaFile" ? true : false
      >;

      // @ts-expect-error invalid storage key should not type-check
      typedClient.storage.get("missing");

      const genericOnlyClient = createAtMyAppClient<typeof schema>({
        apiKey: "k",
        baseUrl: API_BASE_URL,
      });

      // @ts-expect-error runtime schema is required for schema-aware single-arg lookups
      genericOnlyClient.storage.get("settings");
      // @ts-expect-error getValue is only available when runtime schema is provided
      genericOnlyClient.storage.getValue("settings");
    }

    expect(true).toBe(true);
  });

  it("resolves document and asset aliases through schema-aware lookups", async () => {
    let documentRequestUrl: URL | undefined;
    let assetRequestUrl: URL | undefined;
    let staticRequestUrl: URL | undefined;

    server.use(
      http.get(`${API_BASE_URL}/storage/f/content/site.json`, ({ request }) => {
        documentRequestUrl = new URL(request.url);
        return HttpResponse.json({
          theme: "sunrise",
          retries: 5,
          published: true,
        });
      }),
      http.get(`${API_BASE_URL}/storage/f/assets/logo.png`, ({ request }) => {
        assetRequestUrl = new URL(request.url);
        return new HttpResponse("raw-logo", {
          headers: { "Content-Type": "text/plain" },
        });
      }),
      http.get(
        `${API_BASE_URL}/storage/static/assets/logo.png`,
        ({ request }) => {
          staticRequestUrl = new URL(request.url);
          return HttpResponse.json({
            success: true,
            data: {
              staticUrl: "https://cdn.example.com/assets/logo.png",
            },
          });
        }
      )
    );

    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    const settings = await client.storage.get("settings", {
      previewKey: "preview-typed",
    });
    const settingsValue = await client.storage.getValue("content/site", {
      previewKey: "preview-typed",
    });
    const logo = await client.storage.get("assets/logo", {
      previewKey: "preview-typed",
    });
    const logoValue = await client.storage.getValue("logo", {
      previewKey: "preview-typed",
    });

    expect(settings.__amatype).toBe("AmaContent");
    expect(settings.isError).toBe(false);
    expect(settings.data).toEqual({
      theme: "sunrise",
      retries: 5,
      published: true,
    });

    expect(settingsValue).toEqual({
      theme: "sunrise",
      retries: 5,
      published: true,
    });
    expect(logo.__amatype).toBe("AmaImage");
    expect(logo.isError).toBe(false);
    expect(logo.src).toBe("raw-logo");
    expect(logoValue).toEqual({
      url: "https://cdn.example.com/assets/logo.png",
    });

    expect(documentRequestUrl?.searchParams.get("amaPreviewKey")).toBe(
      "preview-typed"
    );
    expect(assetRequestUrl?.searchParams.get("amaPreviewKey")).toBe(
      "preview-typed"
    );
    expect(staticRequestUrl?.searchParams.get("amaPreviewKey")).toBe(
      "preview-typed"
    );
  });

  it("returns quiet placeholders and empty asset URLs by default", async () => {
    server.use(
      http.get(`${API_BASE_URL}/storage/f/content/site.json`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
      http.get(`${API_BASE_URL}/storage/static/assets/logo.png`, () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
    });

    const wrapper = await client.storage.get("settings");
    const value = await client.storage.getValue("settings");
    const fromPath = await client.storage.getFromPath("content/site.json");
    const logoValue = await client.storage.getValue("logo");
    const staticUrl = await client.storage.getStaticUrl("assets/logo.png");

    expect(wrapper.isError).toBe(true);
    expect(wrapper.data).toEqual({
      theme: "sunrise",
      retries: 3,
    });
    expect(value).toEqual({
      theme: "sunrise",
      retries: 3,
    });
    expect(fromPath).toEqual({
      theme: "sunrise",
      retries: 3,
    });
    expect(logoValue).toEqual({ url: "" });
    expect(staticUrl).toBe("");
  });

  it("supports throw mode for raw storage reads", async () => {
    server.use(
      http.get(`${API_BASE_URL}/storage/f/content/site.json`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.get(`${API_BASE_URL}/storage/static/assets/logo.png`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const client = createAtMyAppClient({
      apiKey: "k",
      baseUrl: API_BASE_URL,
      schema,
      errorPolicy: "throw",
    });

    await expect(client.storage.getValue("settings")).rejects.toThrow();
    await expect(client.storage.getStaticUrl("assets/logo.png")).rejects.toThrow(
      "Request failed"
    );
  });
});
