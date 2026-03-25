import {
  AmaCustomEvent,
  AmaCustomEventDef,
} from "../definitions/AmaCustomEvent";
import { AmaEvent, AmaEventDef } from "../definitions/AmaEvent";
import { BaseDef } from "../definitions/Base";
import type {
  ArrayFieldDefinition,
  AssetFieldDefinition,
  CollectionDefinition,
  DocumentDefinition,
  Definition,
  EnumFieldDefinition,
  EventDefinition,
  FieldBase,
  FieldDefinition,
  FileDefinition,
  ObjectFieldDefinition,
  ReferenceFieldDefinition,
  ScalarFieldDefinition,
  SchemaDocument,
} from "@atmyapp/structure";
import type { AmaContent } from "../definitions/AmaContent";
import type { AmaFile } from "../definitions/AmaFile";
import type { AmaImage } from "../definitions/AmaImage";
import type { MetaClient } from "./meta";

export type CanonicalSchemaInput =
  | SchemaDocument
  | { definitions: Record<string, Definition> }
  | Record<string, Definition>;

type IsOptionalField<TField extends FieldBase> =
  TField extends { optional: true }
    ? true
    : TField extends { required: false }
    ? true
    : false;

type OptionalFieldKeys<TFields extends Record<string, FieldDefinition>> = {
  [K in keyof TFields]-?: IsOptionalField<TFields[K]> extends true ? K : never;
}[keyof TFields];

type RequiredFieldKeys<TFields extends Record<string, FieldDefinition>> = Exclude<
  keyof TFields,
  OptionalFieldKeys<TFields>
>;

type StructuredObjectValue<TFields extends Record<string, FieldDefinition>> = {
  [K in RequiredFieldKeys<TFields>]: CanonicalFieldValue<TFields[K]>;
} & {
  [K in OptionalFieldKeys<TFields>]?: CanonicalFieldValue<TFields[K]>;
};

type ScalarValue<TField extends ScalarFieldDefinition> =
  TField["scalar"] extends "string"
    ? string
    : TField["scalar"] extends "number"
    ? number
    : TField["scalar"] extends "boolean"
    ? boolean
    : TField["scalar"] extends "null"
    ? null
    : string;

type EnumValue<TField extends EnumFieldDefinition> = TField["values"][number];

type FileAssetValue = {
  url: string;
  name?: string;
  mimeType?: string;
};

type ImageAssetValue = FileAssetValue & {
  alt?: string;
};

type AssetValue<TField extends AssetFieldDefinition> = TField["assetKind"] extends "gallery"
  ? ImageAssetValue[]
  : TField["multiple"] extends true
  ? (TField["assetKind"] extends "image" ? ImageAssetValue : FileAssetValue)[]
  : TField["assetKind"] extends "image"
  ? ImageAssetValue
  : FileAssetValue;

type ReferenceValue<TField extends ReferenceFieldDefinition> = TField["multiple"] extends true
  ? string[]
  : string;

type GeneratedSystemFields<
  TDefinition extends CollectionDefinition | DocumentDefinition,
> =
  TDefinition extends { systemFields?: { slug?: infer TSlug } }
    ? TSlug extends false | undefined | null
      ? {}
      : TSlug extends { enabled: false }
      ? {}
      : { slug: string }
    : {};

type CanonicalFieldValue<TField extends FieldDefinition> = TField extends ScalarFieldDefinition
  ? ScalarValue<TField>
  : TField extends EnumFieldDefinition
  ? EnumValue<TField>
  : TField extends ObjectFieldDefinition
  ? StructuredObjectValue<TField["fields"]>
  : TField extends ArrayFieldDefinition
  ? CanonicalFieldValue<TField["items"]>[]
  : TField extends AssetFieldDefinition
  ? AssetValue<TField>
  : TField extends ReferenceFieldDefinition
  ? ReferenceValue<TField>
  : TField extends { kind: "union"; variants: infer TVariants extends FieldDefinition[] }
  ? CanonicalFieldValue<TVariants[number]>
  : string;

type CanonicalEntryType<
  TDefinition extends CollectionDefinition | DocumentDefinition,
> = StructuredObjectValue<TDefinition["fields"]> & GeneratedSystemFields<TDefinition>;

type ExtractDefinitions<TSchema> =
  TSchema extends { definitions: infer TDefinitions }
    ? TDefinitions extends Record<string, Definition>
      ? TDefinitions
      : {}
    : TSchema extends Record<string, Definition>
    ? TSchema
    : {};

type ExtractEvents<TSchema> =
  TSchema extends { events: infer TEvents }
    ? TEvents extends Record<string, EventDefinition>
      ? TEvents
      : {}
    : {};

type CollectionDefinitions<TSchema> = {
  [K in keyof ExtractDefinitions<TSchema> as ExtractDefinitions<TSchema>[K] extends {
    kind: "collection";
  }
    ? K
    : never]: ExtractDefinitions<TSchema>[K];
};

type CollectionName<TSchema> = keyof CollectionDefinitions<TSchema> & string;

type CollectionRow<
  TSchema,
  TName extends CollectionName<TSchema>,
> = CanonicalEntryType<
  Extract<CollectionDefinitions<TSchema>[TName], CollectionDefinition>
>;

type EventName<TSchema> = keyof ExtractEvents<TSchema> & string;

type EventColumns<
  TSchema,
  TName extends EventName<TSchema>,
> = ExtractEvents<TSchema>[TName] extends { columns: infer TColumns extends string[] }
  ? TColumns[number]
  : never;

export type AtMyAppClient<
  TSchema = unknown,
  THasRuntimeSchema extends boolean = false,
> = {
  storage: StorageClient<TSchema, THasRuntimeSchema>;
  analytics: AnalyticsClient<TSchema>;
  collections: CollectionsClient<TSchema>;
  meta: MetaClient;
};

export type StorageGetOptions = {
  previewKey?: string;
};

type StorageDefinition = DocumentDefinition | FileDefinition;

type StorageDefinitions<TSchema> = {
  [K in keyof ExtractDefinitions<TSchema> as ExtractDefinitions<TSchema>[K] extends {
    kind: "document" | "file" | "image";
  }
    ? K
    : never]: ExtractDefinitions<TSchema>[K];
};

type TrimLeadingSlash<T extends string> = T extends `/${infer Rest}`
  ? TrimLeadingSlash<Rest>
  : T;

type TrimTrailingSlash<T extends string> = T extends `${infer Rest}/`
  ? TrimTrailingSlash<Rest>
  : T;

type NormalizeStoragePath<T extends string> = TrimTrailingSlash<
  TrimLeadingSlash<T>
>;

type StripExtension<T extends string> = T extends `${infer Base}.${string}`
  ? Base
  : T;

type EnsureDocumentPath<T extends string> = T extends
  | `${string}.json`
  | `${string}.jsonx`
  | `${string}.md`
  ? T
  : `${T}.json`;

type DocumentStoragePath<
  TName extends string,
  TDefinition extends DocumentDefinition,
> = TDefinition["path"] extends string
  ? EnsureDocumentPath<NormalizeStoragePath<TDefinition["path"]>>
  : EnsureDocumentPath<NormalizeStoragePath<TName>>;

type FileStoragePath<TDefinition extends FileDefinition> = NormalizeStoragePath<
  TDefinition["path"]
>;

type StorageDefinitionAliases<
  TName extends string,
  TDefinition extends StorageDefinition,
> = TDefinition extends DocumentDefinition
  ?
      | NormalizeStoragePath<TName>
      | StripExtension<NormalizeStoragePath<TName>>
      | DocumentStoragePath<TName, TDefinition>
      | StripExtension<DocumentStoragePath<TName, TDefinition>>
  : TDefinition extends FileDefinition
  ?
      | NormalizeStoragePath<TName>
      | StripExtension<NormalizeStoragePath<TName>>
      | FileStoragePath<TDefinition>
      | StripExtension<FileStoragePath<TDefinition>>
  : never;

type StorageDefinitionDescriptor<
  TName extends string,
  TDefinition extends StorageDefinition,
> = StorageDefinitionAliases<TName, TDefinition> extends infer TAlias
  ? TAlias extends string
    ? {
        key: TAlias;
        name: TName;
        definition: TDefinition;
      }
    : never
  : never;

type StorageDefinitionDescriptors<TSchema> = {
  [K in keyof StorageDefinitions<TSchema> & string]: StorageDefinitionDescriptor<
    K,
    Extract<StorageDefinitions<TSchema>[K], StorageDefinition>
  >;
}[keyof StorageDefinitions<TSchema> & string];

export type SchemaStorageKey<TSchema> =
  StorageDefinitionDescriptors<TSchema>["key"] & string;

type StorageDefinitionForKey<
  TSchema,
  TKey extends SchemaStorageKey<TSchema>,
> = Extract<StorageDefinitionDescriptors<TSchema>, { key: TKey }>["definition"];

export type StorageAssetValue = {
  url: string;
};

type StorageWrapperValueForDefinition<TDefinition extends StorageDefinition> =
  TDefinition extends DocumentDefinition
    ? AmaContent<CanonicalEntryType<TDefinition>, any>
    : TDefinition extends { kind: "image" }
    ? AmaImage<any>
    : AmaFile<any>;

type StorageRawValueForDefinition<TDefinition extends StorageDefinition> =
  TDefinition extends DocumentDefinition
    ? CanonicalEntryType<TDefinition>
    : StorageAssetValue;

type LegacyStorageClient = {
  getFromPath: (path: string, options?: StorageGetOptions) => Promise<unknown>;
  get<Ref extends BaseDef<string, unknown, string>>(
    path: Ref["path"],
    mode: Ref["type"],
    options?: StorageGetOptions,
  ): Promise<Ref["returnType"]>;
  getStaticUrl: (path: string, options?: StorageGetOptions) => Promise<string>;
};

type SchemaAwareStorageClient<TSchema> = {
  getFromPath: (path: string, options?: StorageGetOptions) => Promise<unknown>;
  get<TKey extends SchemaStorageKey<TSchema>>(
    key: TKey,
    options?: StorageGetOptions,
  ): Promise<StorageWrapperValueForDefinition<StorageDefinitionForKey<TSchema, TKey>>>;
  get<Ref extends BaseDef<string, unknown, string>>(
    path: Ref["path"],
    mode: Ref["type"],
    options?: StorageGetOptions,
  ): Promise<Ref["returnType"]>;
  getValue<TKey extends SchemaStorageKey<TSchema>>(
    key: TKey,
    options?: StorageGetOptions,
  ): Promise<StorageRawValueForDefinition<StorageDefinitionForKey<TSchema, TKey>>>;
  getStaticUrl: (path: string, options?: StorageGetOptions) => Promise<string>;
};

export type StorageClient<
  TSchema = unknown,
  THasRuntimeSchema extends boolean = false,
> = THasRuntimeSchema extends true
  ? SchemaAwareStorageClient<TSchema>
  : LegacyStorageClient;

export type ClientErrorPolicy = "quiet-empty" | "throw";

/**
 * Client mode determines how the client fetches data:
 * - 'online': Always fetch from the API (default)
 * - 'with-fallback': Try API first, fall back to local storage on failure
 * - 'local': Only read from local storage (offline mode)
 */
export type ClientMode = "online" | "with-fallback" | "local";

/**
 * Configuration for local storage fallback
 */
export type LocalStorageOptions = {
  /**
   * Path to the extracted snapshot directory, relative to process.cwd()
   * @default '.ama/local'
   */
  path?: string;
  /**
   * Timeout in milliseconds before falling back to local storage (only used in 'with-fallback' mode)
   * @default 5000
   */
  timeoutMs?: number;
};

export type LocalDataSourceEntry = {
  id: string | number;
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type LocalDataSource = {
  readFile: (
    path: string,
  ) => Promise<string | ArrayBuffer | Record<string, unknown> | null>;
  readJson: (path: string) => Promise<unknown | null>;
  listCollection: (name: string) => Promise<LocalDataSourceEntry[]>;
  getStaticUrl?: (path: string) => Promise<string | null>;
};

export type AtMyAppClientOptions = {
  apiKey: string;
  baseUrl: string;
  schema?: CanonicalSchemaInput;
  customFetch?: typeof fetch;
  previewKey?: string;
  plugins?: string[];
  /**
   * Controls how collection and storage reads behave when a request fails or data is missing.
   * @default "quiet-empty"
   */
  errorPolicy?: ClientErrorPolicy;
  /**
   * 'client' for client-side requests with cache, 'priority' for requests to server without cache (mainly for server-side rendering, higher usage cost)
   */
  mode?: "client" | "priority";
  /**
   * Client mode for data fetching strategy
   * @default 'online'
   */
  clientMode?: ClientMode;
  /**
   * Local storage configuration for fallback/local modes
   */
  localStorage?: LocalStorageOptions;
  /**
   * Optional browser-friendly local data adapter used by local/with-fallback modes.
   */
  localDataSource?: LocalDataSource;
};

export type AnalyticsClient<TSchema = unknown> = {
  trackCustomEvent<Name extends EventName<TSchema>>(
    eventId: Name,
    data: Record<EventColumns<TSchema, Name>, any> | string[],
  ): Promise<boolean>;
  trackCustomEvent<Event extends AmaCustomEventDef<string, string[]>>(
    eventId: Event["id"],
    data: Record<Event["columns"][number], any> | string[],
  ): Promise<boolean>;

  trackEvent<Name extends EventName<TSchema>>(eventId: Name): Promise<boolean>;
  trackEvent<Event extends AmaEventDef<string>>(
    eventId: Event["id"],
  ): Promise<boolean>;
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

export type CollectionsListResult<
  Row,
  Format extends CollectionsFormat = "data",
> = Format extends "raw"
  ? CollectionsRawEntry<Row>[]
  : Format extends "dictionary"
    ? Record<string, Row>
    : Format extends "dataWithMeta"
      ? CollectionsListWithMeta<Row>
      : Row[];

export type CollectionsSingleResult<
  Row,
  Format extends CollectionsFormat = "data",
> = Format extends "raw"
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

export type CollectionsListOptions<Format extends CollectionsFormat = "data"> =
  {
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
  };
  error?: string;
};

export type CollectionsClient<TSchema = unknown> = {
  // listRaw overloads (typed via AmaCollectionDef or generic Row)
  listRaw<Name extends CollectionName<TSchema>>(
    collection: Name,
    options?: CollectionsListOptions,
  ): Promise<CollectionsResponseRaw<CollectionRow<TSchema, Name>>>;
  listRaw<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<
      string,
      any,
      any
    >,
  >(
    collection: string,
    options?: CollectionsListOptions,
  ): Promise<CollectionsResponseRaw<Def["structure"]["__rowType"]>>;
  listRaw<Row = any>(
    collection: string,
    options?: CollectionsListOptions,
  ): Promise<CollectionsResponseRaw<Row>>;

  // list overloads (typed via AmaCollectionDef or generic Row)
  list<Name extends CollectionName<TSchema>, Format extends CollectionsFormat = "data">(
    collection: Name,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<CollectionRow<TSchema, Name>, Format>>;
  list<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<
      string,
      any,
      any
    >,
    Format extends CollectionsFormat = "data",
  >(
    collection: string,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  list<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<Row, Format>>;

  // getById overloads (typed via AmaCollectionDef or generic Row)
  getById<
    Name extends CollectionName<TSchema>,
    Format extends CollectionsFormat = "data",
  >(
    collection: Name,
    id: string | number,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<CollectionRow<TSchema, Name>, Format>>;
  getById<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<
      string,
      any,
      any
    >,
    Format extends CollectionsFormat = "data",
  >(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  getById<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    id: string | number,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<Row, Format>>;

  // Add: first helper
  first<Name extends CollectionName<TSchema>, Format extends CollectionsFormat = "data">(
    collection: Name,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<CollectionRow<TSchema, Name>, Format>>;
  first<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<
      string,
      any,
      any
    >,
    Format extends CollectionsFormat = "data",
  >(
    collection: string,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<Def["structure"]["__rowType"], Format>>;
  first<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsSingleResult<Row, Format>>;

  // Add: getManyByIds helper
  getManyByIds<
    Name extends CollectionName<TSchema>,
    Format extends CollectionsFormat = "data",
  >(
    collection: Name,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<CollectionRow<TSchema, Name>, Format>>;
  getManyByIds<
    Def extends import("../definitions/AmaCollection").AmaCollectionDef<
      string,
      any,
      any
    >,
    Format extends CollectionsFormat = "data",
  >(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<Def["structure"]["__rowType"], Format>>;
  getManyByIds<Row = any, Format extends CollectionsFormat = "data">(
    collection: string,
    ids: Array<string | number>,
    options?: CollectionsListOptions<Format>,
  ): Promise<CollectionsListResult<Row, Format>>;
};

export type {
  CollectionName as CanonicalCollectionName,
  CollectionRow as CanonicalCollectionRow,
  EventName as CanonicalEventName,
  EventColumns as CanonicalEventColumns,
  ExtractDefinitions as CanonicalSchemaDefinitions,
  ExtractEvents as CanonicalSchemaEvents,
};
