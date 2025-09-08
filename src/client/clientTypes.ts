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

export type CollectionsListOptions = {
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
};

export type CollectionsResponse<Row = any> = {
  success: boolean;
  data?: Row[];
  error?: string;
};

export type CollectionsClient = {
  // listRaw overloads (typed via AmaCollectionDef or generic Row)
  listRaw<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponse<Def["structure"]["__rowType"]>>;
  listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<CollectionsResponse<Row>>;

  // list overloads (typed via AmaCollectionDef or generic Row)
  list<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<Def["structure"]["__rowType"][]>;
  list<Row = any>(
    collection: string,
    options?: CollectionsListOptions
  ): Promise<Row[]>;

  // getById overloads (typed via AmaCollectionDef or generic Row)
  getById<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<string, any, any>
  >(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions
  ): Promise<Def["structure"]["__rowType"] | null>;
  getById<Row = any>(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions
  ): Promise<Row | null>;
};
