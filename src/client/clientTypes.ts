import {
  AmaCustomEvent,
  AmaCustomEventDef,
} from "../definitions/AmaCustomEvent";
import { AmaEvent, AmaEventDef } from "../definitions/AmaEvent";
import { BaseDef } from "../definitions/Base";

export type AtMyAppClient = {
  collections: CollectionsClient;
  analytics: AnalyticsClient;
};

export type CollectionsGetOptions = {
  previewKey?: string;
};

export type CollectionsClient = {
  getFromPath: (
    path: string,
    options?: CollectionsGetOptions
  ) => Promise<unknown>;
  get<Ref extends BaseDef<string, unknown, string>>(
    path: Ref["path"],
    mode: Ref["type"],
    options?: CollectionsGetOptions
  ): Promise<Ref["returnType"]>;
  getStaticUrl: (
    path: string,
    options?: CollectionsGetOptions
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
