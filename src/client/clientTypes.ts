import { AmaFile, AmaFileRef } from "../definitions/AmaFile";
import { BaseRef } from "../definitions/Base";

export type AtMyAppClient = {
  collections: CollectionsClient;
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
