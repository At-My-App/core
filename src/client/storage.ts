import {
  AtMyAppClientOptions,
  StorageGetOptions,
  StorageClient,
} from "./clientTypes";
import { createFetch } from "@better-fetch/fetch";
import { cleanPath } from "./utils/cleanPath";
import { AmaFile } from "../definitions/AmaFile";
import { BaseDef } from "../definitions/Base";
import { AmaContent } from "../definitions/AmaContent";
import { AmaImage } from "../definitions/AmaImage";
import { AmaIcon } from "../definitions/AmaIcon";
import {
  compileSchema,
  resolveDefinitionForPath,
  type CompiledDefinition,
  type Definition,
  type DocumentDefinition,
  type FileDefinition,
  type SchemaDocument,
} from "@atmyapp/structure";
import {
  getLocalStaticUrl,
  isAnyLocalDataAvailable,
  readLocalFileValue,
  readLocalJsonValue,
} from "./localFallback";
import {
  buildDocumentPlaceholder,
  buildEmptyAssetValue,
} from "./placeholders";

type StorageReadableDefinition = DocumentDefinition | FileDefinition;
type StorageErrorResponse = {
  status?: number;
  message?: string;
};

function normalizeRuntimeSchema(
  schema: AtMyAppClientOptions["schema"]
): SchemaDocument | null {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return null;
  }

  if (
    "version" in schema &&
    "definitions" in schema &&
    schema.definitions &&
    typeof schema.definitions === "object"
  ) {
    return schema as SchemaDocument;
  }

  if ("definitions" in schema && schema.definitions) {
    return {
      version: 1,
      definitions: schema.definitions as Record<string, Definition>,
      description:
        typeof (schema as SchemaDocument).description === "string"
          ? (schema as SchemaDocument).description
          : undefined,
      events:
        (schema as SchemaDocument).events &&
        typeof (schema as SchemaDocument).events === "object"
          ? (schema as SchemaDocument).events
          : {},
      args:
        (schema as SchemaDocument).args &&
        typeof (schema as SchemaDocument).args === "object"
          ? (schema as SchemaDocument).args
          : {},
      mdx:
        (schema as SchemaDocument).mdx &&
        typeof (schema as SchemaDocument).mdx === "object"
          ? (schema as SchemaDocument).mdx
          : {},
      submissions:
        (schema as SchemaDocument).submissions &&
        typeof (schema as SchemaDocument).submissions === "object"
          ? (schema as SchemaDocument).submissions
          : {},
    };
  }

  return {
    version: 1,
    definitions: schema as Record<string, Definition>,
    events: {},
    args: {},
    mdx: {},
    submissions: {},
  };
}

export const createStorageClient = (
  clientOptions: AtMyAppClientOptions
): StorageClient => {
  const storageUrl = `${clientOptions.baseUrl}/storage`;
  const clientMode = clientOptions.clientMode ?? "online";
  const errorPolicy = clientOptions.errorPolicy ?? "quiet-empty";
  const shouldThrowErrors = errorPolicy === "throw";
  const timeoutMs = clientOptions.localStorage?.timeoutMs ?? 5000;
  const schemaDocument = normalizeRuntimeSchema(clientOptions.schema);
  const compiledSchema = schemaDocument ? compileSchema(schemaDocument) : null;

  const $fetch = createFetch({
    baseURL: storageUrl,
    auth: {
      type: "Bearer",
      token: clientOptions.apiKey,
    },
    fetch: clientOptions.customFetch,
    headers: {
      "Cache-Control":
        clientOptions.mode === "priority" ? "no-cache" : "max-age=60",
    },
  });

  /**
   * Fetch from API with optional timeout
   */
  const fetchWithTimeout = async <T>(
    fetchFn: () => Promise<T>
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      if (clientMode === "with-fallback" && timeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
        );
        const data = await Promise.race([fetchFn(), timeoutPromise]);
        return { data, error: null };
      }
      const data = await fetchFn();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

  const toStorageError = (error: unknown): StorageErrorResponse => {
    if (!error) {
      return {
        message: "Request failed",
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    if (typeof error === "object") {
      return {
        status:
          typeof (error as { status?: unknown }).status === "number"
            ? (error as { status: number }).status
            : undefined,
        message:
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Request failed",
      };
    }

    return {
      message: String(error),
    };
  };

  const getErrorMessage = (error?: StorageErrorResponse | null) =>
    error?.message ?? "Request failed";

  const fetchPathFromApi = async (
    path: string,
    query: Record<string, string>
  ) => {
    try {
      return await $fetch("/f/:path", {
        params: {
          path: cleanPath(path),
        },
        query,
      });
    } catch (error) {
      return {
        data: undefined,
        error: toStorageError(error),
      };
    }
  };

  const fetchStaticUrlFromApi = async (
    path: string,
    query: Record<string, string>
  ) => {
    try {
      return await $fetch<{
        success: boolean;
        data: {
          staticUrl: string;
        };
      }>("/static/:path", {
        params: {
          path: cleanPath(path),
        },
        query,
      });
    } catch (error) {
      return {
        data: undefined,
        error: toStorageError(error),
      };
    }
  };

  const resolveSchemaDefinitionByPath = (
    path: string
  ): CompiledDefinition<StorageReadableDefinition> | null => {
    if (!compiledSchema) {
      return null;
    }

    const resolved = resolveDefinitionForPath(compiledSchema, path);

    if (
      !resolved ||
      (resolved.kind !== "document" &&
        resolved.kind !== "file" &&
        resolved.kind !== "image")
    ) {
      return null;
    }

    return resolved as CompiledDefinition<StorageReadableDefinition>;
  };

  const getDocumentPlaceholderForPath = (path: string) => {
    const definition = resolveSchemaDefinitionByPath(path);
    if (!definition || definition.kind !== "document") {
      return undefined;
    }
    return buildDocumentPlaceholder(definition.definition as DocumentDefinition);
  };

  const warnQuietFallback = (target: string, message: string) => {
    if (!shouldThrowErrors) {
      console.warn(
        `AtMyApp storage: returning quiet empty state for "${target}" because ${message}.`
      );
    }
  };

  const throwIfConfigured = (message: string) => {
    if (shouldThrowErrors) {
      throw new Error(message);
    }
  };

  const getRaw = async (path: string, options?: StorageGetOptions) => {
    // In local mode, only read from local storage
    if (clientMode === "local") {
      const localData = await readLocalJsonValue(path, clientOptions);
      if (localData !== null) {
        return { data: localData, error: undefined };
      }
      // Try reading as raw file
      const rawData = await readLocalFileValue(path, clientOptions);
      if (rawData !== null) {
        return { data: rawData, error: undefined };
      }
      return {
        data: undefined,
        error: { status: 404, message: "File not found in local storage" },
      };
    }

    const previewKey = options?.previewKey || clientOptions.previewKey;

    const query: Record<string, string> = {};
    if (previewKey) {
      query.amaPreviewKey = previewKey;
    }

    // In online mode, just fetch from API
    if (clientMode === "online") {
      return fetchPathFromApi(path, query);
    }

    // In with-fallback mode, try API first then fall back to local
    const { data: response, error } = await fetchWithTimeout(() =>
      fetchPathFromApi(path, query)
    );

    if (!error && response?.data) {
      return response;
    }

    // Fallback to local storage
    if (await isAnyLocalDataAvailable(clientOptions)) {
      const localData = await readLocalJsonValue(path, clientOptions);
      if (localData !== null) {
        return { data: localData, error: undefined };
      }
      const rawData = await readLocalFileValue(path, clientOptions);
      if (rawData !== null) {
        return { data: rawData, error: undefined };
      }
    }

    // Return original error if fallback also failed
    return (
      response ?? {
        data: undefined,
        error: toStorageError(error),
      }
    );
  };

  const getFromPath = async (path: string, options?: StorageGetOptions) => {
    const response = await getRaw(path, options);
    if (response.error) {
      const placeholder = getDocumentPlaceholderForPath(path);
      if (placeholder !== undefined && !shouldThrowErrors) {
        warnQuietFallback(path, getErrorMessage(response.error));
        return placeholder;
      }
      throwIfConfigured(getErrorMessage(response.error));
    }
    return response.data;
  };

  const getFile = async (
    path: string,
    options?: StorageGetOptions
  ): Promise<AmaFile<any>> => {
    const response = await getRaw(path, options);

    if (response.data && !response.error) {
      return {
        __amatype: "AmaFile",
        __config: {},
        isError: false,
        errorMessage: undefined,
        src: response.data as any,
      };
    }

    if (response.error?.status === 404) {
      warnQuietFallback(path, "the file was not found");
      return {
        __amatype: "AmaFile",
        __config: {},
        isError: true,
        src: shouldThrowErrors ? (null as any) : "",
        errorMessage: "File not found",
        errorStatus: 404,
      };
    }

    if (response.error?.status === 401) {
      warnQuietFallback(path, "the API key was rejected");
      return {
        __amatype: "AmaFile",
        __config: {},
        isError: true,
        src: shouldThrowErrors ? (null as any) : "",
        errorMessage: "Wrong API key",
        errorStatus: 401,
      };
    }

    if (response.error) {
      warnQuietFallback(path, getErrorMessage(response.error));
    }

    return {
      __amatype: "AmaFile",
      __config: {},
      src: shouldThrowErrors ? (null as any) : "",
      isError: true,
      errorMessage: response.error?.message,
      errorStatus: response.error?.status,
    };
  };

  const getContent = async (
    path: string,
    options?: StorageGetOptions
  ): Promise<AmaContent<any, any>> => {
    const response = await getRaw(path, options);

    if (response.data !== undefined && !response.error) {
      return {
        __amatype: "AmaContent",
        __config: {},
        isError: false,
        errorMessage: undefined,
        data: response.data as any,
      };
    }

    return {
      __amatype: "AmaContent",
      __config: {},
      isError: true,
      errorMessage: response.error?.message,
      errorStatus: response.error?.status,
      data:
        (!shouldThrowErrors
          ? (getDocumentPlaceholderForPath(path) ?? {})
          : {}) as any,
    };
  };

  const getImage = async (
    path: string,
    options?: StorageGetOptions
  ): Promise<AmaImage<any>> => {
    const response = await getFile(path, options);

    if (response.isError) {
      return response as any;
    }

    return {
      __amatype: "AmaImage",
      __config: {},
      isError: false,
      errorMessage: undefined,
      src: response.src as any,
    };
  };

  const getIcon = async (
    path: string,
    options?: StorageGetOptions
  ): Promise<AmaIcon<any>> => {
    const response = await getFile(path, options);

    if (response.isError) {
      return response as any;
    }

    return {
      __amatype: "AmaIcon",
      __config: {},
      isError: false,
      errorMessage: undefined,
      src: response.src as any,
    };
  };

  const resolveSchemaDefinition = (
    key: string
  ): CompiledDefinition<StorageReadableDefinition> => {
    if (!compiledSchema) {
      throw new Error(
        "Schema-aware storage lookups require createAtMyAppClient({ schema })"
      );
    }

    const resolved = resolveDefinitionForPath(compiledSchema, key);

    if (!resolved) {
      throw new Error(`Storage definition not found for key: ${key}`);
    }

    if (
      resolved.kind !== "document" &&
      resolved.kind !== "file" &&
      resolved.kind !== "image"
    ) {
      throw new Error(
        `Definition "${resolved.name}" cannot be read through storage lookups`
      );
    }

    return resolved as CompiledDefinition<StorageReadableDefinition>;
  };

  const getDefinitionPath = (
    definition: CompiledDefinition<StorageReadableDefinition>
  ): string => {
    const path = definition.definition.path;
    if (!path) {
      throw new Error(
        `Definition "${definition.name}" does not declare a storage path`
      );
    }
    return path;
  };

  const getResolvedWrapper = async (
    key: string,
    options?: StorageGetOptions
  ) => {
    const definition = resolveSchemaDefinition(key);
    const resolvedPath = getDefinitionPath(definition);

    if (definition.kind === "document") {
      return getContent(resolvedPath, options);
    }

    if (definition.kind === "image") {
      return getImage(resolvedPath, options);
    }

    return getFile(resolvedPath, options);
  };

  const get = async <Ref extends BaseDef<string, unknown, string>>(
    pathOrKey: Ref["path"] | string,
    modeOrOptions?: Ref["type"] | StorageGetOptions,
    maybeOptions?: StorageGetOptions
  ): Promise<Ref["returnType"]> => {
    if (typeof modeOrOptions === "string") {
      if (modeOrOptions === "file") {
        return getFile(pathOrKey, maybeOptions) as Promise<Ref["returnType"]>;
      }

      if (modeOrOptions === "content") {
        return getContent(pathOrKey, maybeOptions) as Promise<Ref["returnType"]>;
      }

      if (modeOrOptions === "image") {
        return getImage(pathOrKey, maybeOptions) as Promise<Ref["returnType"]>;
      }

      if (modeOrOptions === "icon") {
        return getIcon(pathOrKey, maybeOptions) as Promise<Ref["returnType"]>;
      }

      throw new Error(`Unsupported mode: ${modeOrOptions}`);
    }

    if (compiledSchema) {
      return getResolvedWrapper(pathOrKey, modeOrOptions) as Promise<
        Ref["returnType"]
      >;
    }

    return getFile(pathOrKey, modeOrOptions) as Promise<Ref["returnType"]>;
  };

  const getValue = async (key: string, options?: StorageGetOptions) => {
    const definition = resolveSchemaDefinition(key);
    const resolvedPath = getDefinitionPath(definition);

    if (definition.kind === "document") {
      const response = await getRaw(resolvedPath, options);

      if (response.data !== undefined && !response.error) {
        return response.data;
      }

      if (!shouldThrowErrors) {
        warnQuietFallback(resolvedPath, getErrorMessage(response.error));
        return buildDocumentPlaceholder(definition.definition as DocumentDefinition);
      }

      throw new Error(getErrorMessage(response.error));
    }

    return {
      url: await getStaticUrl(resolvedPath, options),
    };
  };

  const getStaticUrl = async (path: string, options?: StorageGetOptions) => {
    // In local mode, return file:// URL
    if (clientMode === "local") {
      try {
        return await getLocalStaticUrl(path, clientOptions);
      } catch (error) {
        if (shouldThrowErrors) {
          throw error;
        }
        warnQuietFallback(
          path,
          error instanceof Error ? error.message : "the local static URL could not be resolved"
        );
        return "";
      }
    }

    const previewKey = options?.previewKey || clientOptions.previewKey;

    const query: Record<string, string> = {};
    if (previewKey) {
      query.amaPreviewKey = previewKey;
    }

    // In online mode, just fetch from API
    if (clientMode === "online") {
      const response = await fetchStaticUrlFromApi(path, query);

      if (response.data && response.data.success) {
        return response.data.data.staticUrl;
      }

      if (!shouldThrowErrors) {
        warnQuietFallback(path, getErrorMessage(toStorageError(response.error)));
        return "";
      }

      throw new Error(getErrorMessage(toStorageError(response.error)));
    }

    // In with-fallback mode, try API first then fall back to local
    const { data: response, error } = await fetchWithTimeout(() =>
      fetchStaticUrlFromApi(path, query)
    );

    if (!error && response?.data?.success) {
      return response.data.data.staticUrl;
    }

    // Fallback to local file:// URL
    if (await isAnyLocalDataAvailable(clientOptions)) {
      try {
        return await getLocalStaticUrl(path, clientOptions);
      } catch (localError) {
        if (shouldThrowErrors) {
          throw localError;
        }
        warnQuietFallback(
          path,
          localError instanceof Error
            ? localError.message
            : "the local static URL could not be resolved"
        );
      }
    }

    if (!shouldThrowErrors) {
      warnQuietFallback(
        path,
        error?.message ?? getErrorMessage(toStorageError(response?.error))
      );
      return buildEmptyAssetValue().url;
    }

    throw new Error(
      error?.message ??
        getErrorMessage(toStorageError(response?.error)) ??
        "Failed to get static URL"
    );
  };

  const baseClient = {
    getFromPath,
    get,
    getStaticUrl,
  };

  if (compiledSchema) {
    return {
      ...baseClient,
      getValue,
    } as StorageClient;
  }

  return baseClient as StorageClient;
};
