import { AmaCustomEvent } from "../definitions/AmaCustomEvent";
import { AmaEvent } from "../definitions/AmaEvent";
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
};

export type AtMyAppClientOptions = {
  apiKey: string;
  baseUrl: string;
  customFetch?: typeof fetch;
  previewKey?: string;
};

export type AnalyticsClient = {
  trackCustomEvent: <Event extends AmaCustomEvent<string, string[]>>(
    eventId: Event["ref"]["id"],
    data: Record<Event["ref"]["columns"][number], any>
  ) => Promise<boolean>;

  trackEvent: <Event extends AmaEvent<string>>(
    eventId: Event["ref"]["id"]
  ) => Promise<boolean>;
};
