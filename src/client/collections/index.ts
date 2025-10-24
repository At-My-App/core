import {
  AtMyAppClientOptions,
  CollectionsClient,
  CollectionsFormat,
  CollectionsListOptions,
  CollectionsListResult,
  CollectionsRawEntry,
  CollectionsResponseRaw,
  CollectionsSingleResult,
} from "../clientTypes";
import { createFetch } from "@better-fetch/fetch";
import { buildParams } from "./params";
import { F } from "./filter-dsl";

/**
 * Creates a new CollectionsClient.
 * @param clientOptions The options for the client.
 * @returns A new CollectionsClient.
 */
export const createCollectionsClient = (
  clientOptions: AtMyAppClientOptions
): CollectionsClient => {
  const collectionsUrl = `${clientOptions.baseUrl}/collections`;

  const $fetch = createFetch({
    baseURL: collectionsUrl,
    auth: {
      type: "Bearer",
      token: clientOptions.apiKey,
    },
    headers:{
      "Cache-Control": clientOptions.mode === "priority" ? "no-cache" : "max-age=60"
    }
  });

  // Overloads for listRaw
  function listRaw<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponseRaw<Def["structure"]["__rowType"]>>;
  function listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponseRaw<Row>>;
  async function listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponseRaw<Row>> {
    const params = buildParams(options);
    const query: Record<string, string | string[]> = {};
    params.forEach((value, key) => {
      const current = (query as any)[key];
      if (current === undefined) {
        (query as any)[key] = value;
      } else if (Array.isArray(current)) {
        (query as any)[key] = [...current, value];
      } else {
        (query as any)[key] = [current as string, value];
      }
    });
    const plugins = options?.plugins ?? clientOptions.plugins ?? ["static-url"];
    if (plugins.length === 1) {
      query["plugins"] = plugins[0];
    } else if (plugins.length > 1) {
      query["plugins"] = plugins.join(",");
    }

    // Add preview key support
    const previewKey = options?.previewKey || clientOptions.previewKey;
    if (previewKey) {
      query['amaPreviewKey'] = previewKey;
    }

    const response = (await $fetch<CollectionsResponseRaw<Row>>("/:collection/entries", {
      params: { collection },
      query,
    })) as {
      data?: CollectionsResponseRaw<Row>;
      error?: unknown;
    };

    if (response.data) {
      return response.data;
    }

    const errorInfo = response.error as string | { message?: string } | undefined;
    const message =
      typeof errorInfo === "string"
        ? errorInfo
        : errorInfo?.message ?? "Collections request failed";

    return {
      success: false,
      error: message,
    };
  }

  // Overloads for list
  function list<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  function list<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>>;
  async function list<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>> {
    const { format, base } = splitFormat(options);
    const resp = await listRaw<CollectionsRawEntry<Row>>(collection, base);
    if (resp.success === true && resp.data) {
      return transformRows<Row, Format>(resp.data.entries, format);
    }
    const err = resp.error || "Collections request failed";
    throw new Error(err);
  }

  // Overloads for getById
  function getById<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  function getById<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>>;
  async function getById<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>> {
    const { format, base } = splitFormat(options);
    const previewKey = options?.previewKey ?? clientOptions.previewKey;
    const rows = await listRaw<CollectionsRawEntry<Row>>(collection, {
      ...(base ?? {}),
      // Explicitly forward previewKey while keeping full rows
      previewKey,
      filter: F.eq("id", id),
      limit: 1,
    });
    const rawRow = rows.data?.entries[0] ?? null;
    return transformSingle<Row, Format>(rawRow, format);
  }

  // Add: first helper
  async function first<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  async function first<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>>;
  async function first<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>> {
    const { format, base } = splitFormat(options);
    const previewKey = options?.previewKey ?? clientOptions.previewKey;
    const rows = await list<Row, "raw">(collection, {
      ...(base ?? {}),
      // Keep full rows; caller can provide order if desired
      limit: 1,
      // Forward previewKey explicitly for clarity
      previewKey,
      format: "raw",
    });
    const rawRows = rows as CollectionsRawEntry<Row>[];
    const rawRow = rawRows[0] ?? null;
    return transformSingle<Row, Format>(rawRow, format);
  }

  // Add: getManyByIds helper (returns rows found, ordered by ids)
  async function getManyByIds<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  async function getManyByIds<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>>;
  async function getManyByIds<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>> {
    const { format, base } = splitFormat(options);
    if (!ids || ids.length === 0) {
      const empty: CollectionsRawEntry<Row>[] = [];
      return transformRows<Row, Format>(empty, format);
    }
    const previewKey = options?.previewKey ?? clientOptions.previewKey;
    const rows = await list<Row, "raw">(collection, {
      ...(base ?? {}),
      // Keep full rows
      filter: F.in("id", ids as any),
      // Forward previewKey explicitly
      previewKey,
      format: "raw",
      // Do not set limit so we get all matches; server-side max still applies
    });

    // Reorder to match the input ids order; omit not-found ids
    const rank = new Map<string, number>(ids.map((v, i) => [String(v), i]));
    const rawRows = rows as CollectionsRawEntry<Row>[];
    const withKey = rawRows.map((r) => ({ r, k: String(r.id) }));
    withKey.sort((a, b) => rank.get(a.k)! - rank.get(b.k)!);
    const orderedRows = withKey.map((x) => x.r);
    return transformRows<Row, Format>(orderedRows, format);
  }

  return {
    list,
    listRaw,
    getById,
    first,
    getManyByIds,
  };
};

function transformRows<Row, Format extends CollectionsFormat = "data">(
  rows: CollectionsRawEntry<Row>[],
  format: CollectionsFormat | undefined
): CollectionsListResult<Row, Format> {
  const effectiveFormat = (format ?? "data") as Format;
  if (effectiveFormat === "raw") {
    return rows as unknown as CollectionsListResult<Row, Format>;
  }
  if (effectiveFormat === "dictionary") {
    const dict: Record<string, Row> = {};
    for (const entry of rows) {
      dict[String(entry.id)] = entry.data as Row;
    }
    return dict as CollectionsListResult<Row, Format>;
  }
  return rows.map((entry) => entry.data as Row) as CollectionsListResult<Row, Format>;
}

function transformSingle<Row, Format extends CollectionsFormat = "data">(
  row: CollectionsRawEntry<Row> | null,
  format: CollectionsFormat | undefined
): CollectionsSingleResult<Row, Format> {
  const effectiveFormat = (format ?? "data") as Format;
  if (!row) {
    return null as CollectionsSingleResult<Row, Format>;
  }
  if (effectiveFormat === "raw") {
    return row as unknown as CollectionsSingleResult<Row, Format>;
  }
  if (effectiveFormat === "dictionary") {
    return { [String(row.id)]: row.data as Row } as CollectionsSingleResult<Row, Format>;
  }
  return (row.data as Row) as CollectionsSingleResult<Row, Format>;
}

function splitFormat<Format extends CollectionsFormat = "data">(
  options?: CollectionsListOptions<Format>
): {
  format: CollectionsFormat | undefined;
  base: CollectionsListOptions | undefined;
} {
  if (!options) {
    return { format: undefined, base: undefined };
  }
  const { format, ...rest } = options;
  return {
    format,
    base: rest as CollectionsListOptions,
  };
}

export { F }