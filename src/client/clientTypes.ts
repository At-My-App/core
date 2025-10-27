import {
  AmaCustomEvent,
  AmaCustomEventDef,
} from "../definitions/AmaCustomEvent";
import { AmaEvent, AmaEventDef } from "../definitions/AmaEvent";
import { BaseDef } from "../definitions/Base";

export type AtMyAppClient = {
  storage: StorageClient;
  analytics: AnalyticsClient;
  collections: CollectionsClient;
};

export type StorageGetOptions = {
  previewKey?: string;
};

export type StorageClient = {
  getFromPath: (
    path: string,
    options?: StorageGetOptions
  ) => Promise<unknown>;
  get<Ref extends BaseDef<string, unknown, string>>(
    path: Ref["path"],
    mode: Ref["type"],
    options?: StorageGetOptions
  ): Promise<Ref["returnType"]>;
  getStaticUrl: (
    path: string,
    options?: StorageGetOptions
  ) => Promise<string>;
};

export type AtMyAppClientOptions = {
  apiKey: string;
  baseUrl: string;
  customFetch?: typeof fetch;
  previewKey?: string;
  plugins?: string[];
  /**
   * 'client' for client-side requests with cache, 'priority' for requests to server without cache (mainly for server-side rendering, higher usage cost)
   */
  mode?: 'client' | 'priority';
};

export type AnalyticsClient = {
  trackCustomEvent: <Event extends AmaCustomEventDef<string, string[]>>(
    eventId: Event["id"],
    data: Record<Event["columns"][number], any> | string[]
  ) => Promise<boolean>;

  trackEvent: <Event extends AmaEventDef<string>>(
    eventId: Event["id"]
  ) => Promise<boolean>;
};

// Collections types
export type CollectionsOrderDirection = "asc" | "desc";
export type CollectionsComparisonOp = "eq" | "lt" | "lte" | "gt" | "gte" | "in";
export type CollectionsPrimitive = string | number | boolean | Date;

export type CollectionsListWithMeta<Row> = {
  rows: Row[];
  total: number;
};

export type CollectionsSingleWithMeta<Row> = {
  row: Row | null;
  total: number;
};

export type CollectionsFormat = "raw" | "data" | "dictionary" | "dataWithMeta";

export type CollectionsRawEntry<Row = any> = {
  id: string | number;
  data: Row;
  [key: string]: unknown;
};

export type CollectionsListResult<Row, Format extends CollectionsFormat = "data"> =
  Format extends "raw"
    ? CollectionsRawEntry<Row>[]
    : Format extends "dictionary"
    ? Record<string, Row>
    : Format extends "dataWithMeta"
    ? CollectionsListWithMeta<Row>
    : Row[];

export type CollectionsSingleResult<Row, Format extends CollectionsFormat = "data"> =
  Format extends "raw"
    ? CollectionsRawEntry<Row> | null
    : Format extends "dictionary"
    ? Record<string, Row> | null
    : Format extends "dataWithMeta"
    ? CollectionsSingleWithMeta<Row>
    : Row | null;

export type CollectionsFilterExpr =
  | {
      type: "comparison";
      field: string;
      op: CollectionsComparisonOp;
      value: CollectionsPrimitive | CollectionsPrimitive[];
    }
  | { type: "and"; conditions: CollectionsFilterExpr[] }
  | { type: "or"; conditions: CollectionsFilterExpr[] }
  | { type: "not"; condition: CollectionsFilterExpr };

export type CollectionsListOptions<Format extends CollectionsFormat = "data"> = {
  select?:
    | "id"
    | "data"
    | "created"
    | "updated"
    | Array<"id" | "data" | "created" | "updated">;
  order?: `${"id" | "created" | "updated"}${"" | ".asc" | ".desc"}`;
  range?: [number, number];
  limit?: number;
  offset?: number;
  filter?: CollectionsFilterExpr;
  previewKey?: string;
  plugins?: string[];
  format?: Format;
};

export type CollectionsResponse<Row = any> = {
  success: boolean;
  data?: Row[];
  error?: string;
};

export type CollectionsResponseRaw<Row = any> = {
  success: boolean;
  data?: {
    entries: Row[];
    total: number;
  }
  error?: string;
};

export type CollectionsClient = {
  // listRaw overloads (typed via AmaCollectionDef or generic Row)
  listRaw<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponseRaw<Def["structure"]["__rowType"]>>;
  listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponseRaw<Row>>;

  // list overloads (typed via AmaCollectionDef or generic Row)
  list<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  list<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>>;

  // getById overloads (typed via AmaCollectionDef or generic Row)
  getById<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  getById<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>>;

  // Add: first helper
  first<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  first<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsSingleResult<Row, Format>>;

  // Add: getManyByIds helper
  getManyByIds<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>,
    Format extends CollectionsFormat = "data"
  >(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  getManyByIds<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>
  ): Promise<CollectionsListResult<Row, Format>>;
};
