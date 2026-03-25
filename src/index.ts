import { createAtMyAppClient } from "./client/client";
import { F } from "./client/collections/filter-dsl";
import { AmaCollectionDef, AmaCollection } from "./definitions/AmaCollection";

export { createAtMyAppClient } from "./client/client";
export type {
  AtMyAppClient,
  AtMyAppClientOptions,
  CanonicalSchemaInput,
  StorageGetOptions,
  StorageAssetValue,
  SchemaStorageKey,
  CollectionsClient,
  CollectionsListOptions,
  CollectionsFilterExpr,
  CollectionsResponse,
  ClientMode,
  ClientErrorPolicy,
  LocalDataSource,
  LocalDataSourceEntry,
  LocalStorageOptions,
} from "./client/clientTypes";
export type { MetaClient } from "./client/meta";
export type { AtMyAppHeadConfig } from "./client/metaTypes";
export type { AtMyAppConfig, AtMyAppConfigArgs } from "./client/configTypes";
export { createCollectionsClient } from "./client/collections";
export { F as CollectionsFilter } from "./client/collections/filter-dsl";

export type { AmaContent, AmaContentDef } from "./definitions/AmaContent";
export type {
  AmaCustomEvent,
  AmaCustomEventDef,
} from "./definitions/AmaCustomEvent";
export type { AmaEvent, AmaEventDef } from "./definitions/AmaEvent";
export type { AmaFile, AmaFileDef } from "./definitions/AmaFile";
export type { AmaImage, AmaImageDef } from "./definitions/AmaImage";
export type { AmaIcon, AmaIconDef } from "./definitions/AmaIcon";
export type {
  AmaComponentDef,
  AmaMdxConfigDef,
  AmaMdxFieldDef,
} from "./definitions/AmaMdx";
export type { AmaCollection, AmaCollectionDef } from "./definitions/AmaCollection";
export * from "@atmyapp/structure";
