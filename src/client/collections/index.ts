import {
  AtMyAppClientOptions,
  CollectionsClient,
  CollectionsListOptions,
  CollectionsResponse,
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
  });

  // Overloads for listRaw
  function listRaw<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponse<Def["structure"]["__rowType"]>>;
  function listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponse<Row>>;
  async function listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponse<Row>> {
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
    query['plugins'] = 'static-urls';

    // Add preview key support
    const previewKey = options?.previewKey || clientOptions.previewKey;
    if (previewKey) {
      query['amaPreviewKey'] = previewKey;
    }
    console.log('query', query)

    const response = await $fetch<CollectionsResponse<Row>>("/:collection/entries", {
      params: { collection },
      query,
    });
    return response.data as unknown as CollectionsResponse<Row>;
  }

  // Overloads for list
  function list<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<Def["structure"]["__rowType"][]>;
  function list<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<Row[]>;
  async function list<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<Row[]> {
    const resp = await listRaw<Row>(collection, options);
    if ((resp as any).success === true && (resp as any).data) {
      return (resp as any).data as Row[];
    }
    const err = (resp as any).error || "Collections request failed";
    throw new Error(err);
  }

  // Overloads for getById
  function getById<
    Def extends import("../../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions
  ): Promise<Def["structure"]["__rowType"] | null>;
  function getById<Row = any>(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions
  ): Promise<Row | null>;
  async function getById<Row = any>(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions
  ): Promise<Row | null> {
    const rows = await list<Row>(collection, {
      ...options,
      filter: F.eq("id", id),
      limit: 1,
    });
    return rows[0] ?? null;
  }

  return {
    list,
    listRaw,
    getById,
  };
};

export { F }