import { AmaEvent } from "../definitions/AmaEvent";
import { AmaFile, AmaFileRef } from "../definitions/AmaFile";
import { BaseRef } from "../definitions/Base";

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
  get<Ref extends BaseRef<string, unknown, string>>(
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
  trackEvent: <Event extends AmaEvent<string, string[]>>(
    eventId: Event["ref"]["id"],
    data: Record<Event["ref"]["columns"][number], any>
  ) => Promise<boolean>;
};
