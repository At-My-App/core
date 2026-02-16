import {
  AtMyAppClientOptions,
  StorageGetOptions,
  StorageClient,
} from "./clientTypes";
import { createFetch } from "@better-fetch/fetch";
import { cleanPath } from "./utils/cleanPath";
import { AmaFile, AmaFileDef } from "../definitions/AmaFile";
import { BaseDef } from "../definitions/Base";
import { AmaContent } from "../definitions/AmaContent";
import { AmaImage } from "../definitions/AmaImage";
import { AmaIcon } from "../definitions/AmaIcon";
import {
  readLocalFile,
  readLocalFileJson,
  getLocalFileUrl,
  isLocalStorageAvailable,
} from "./localFallback";

export const createStorageClient = (
  clientOptions: AtMyAppClientOptions
): StorageClient => {
  const storageUrl = `${clientOptions.baseUrl}/storage`;
  const clientMode = clientOptions.clientMode ?? "online";
  const timeoutMs = clientOptions.localStorage?.timeoutMs ?? 5000;

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

  const getRaw = async (path: string, options?: StorageGetOptions) => {
    // In local mode, only read from local storage
    if (clientMode === "local") {
      const localData = readLocalFileJson(path, clientOptions);
      if (localData !== null) {
        return { data: localData, error: undefined };
      }
      // Try reading as raw file
      const rawData = readLocalFile(path, clientOptions);
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
      const response = await $fetch("/f/:path", {
        params: {
          path: cleanPath(path),
        },
        query,
      });
      return response;
    }

    // In with-fallback mode, try API first then fall back to local
    const { data: response, error } = await fetchWithTimeout(() =>
      $fetch("/f/:path", {
        params: {
          path: cleanPath(path),
        },
        query,
      })
    );

    if (!error && response?.data) {
      return response;
    }

    // Fallback to local storage
    if (isLocalStorageAvailable(clientOptions)) {
      const localData = readLocalFileJson(path, clientOptions);
      if (localData !== null) {
        return { data: localData, error: undefined };
      }
      const rawData = readLocalFile(path, clientOptions);
      if (rawData !== null) {
        return { data: rawData, error: undefined };
      }
    }

    // Return original error if fallback also failed
    return (
      response ?? {
        data: undefined,
        error: { status: 500, message: error?.message ?? "Request failed" },
      }
    );
  };

  const getFromPath = async (path: string, options?: StorageGetOptions) => {
    const response = await getRaw(path, options);
    return response.data;
  };

  const getFile = async (path: string): Promise<AmaFile<any>> => {
    const response = await getRaw(path);

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
      return {
        __amatype: "AmaFile",
        __config: {},
        isError: true,
        src: null as any,
        errorMessage: "File not found",
        errorStatus: 404,
      };
    }

    if (response.error?.status === 401) {
      return {
        __amatype: "AmaFile",
        __config: {},
        isError: true,
        src: null as any,
        errorMessage: "Wrong API key",
        errorStatus: 401,
      };
    }

    return {
      __amatype: "AmaFile",
      __config: {},
      src: null as any,
      isError: true,
      errorMessage: response.error?.message,
      errorStatus: response.error?.status,
    };
  };

  const getContent = async (path: string): Promise<AmaContent<any, any>> => {
    const response = await getFile(path);

    if (response.isError) {
      return response as any;
    }

    return {
      __amatype: "AmaContent",
      __config: {},
      isError: false,
      errorMessage: undefined,
      data: response.src as any,
    };
  };

  const getImage = async (path: string): Promise<AmaImage<any>> => {
    const response = await getFile(path);

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

  const getIcon = async (path: string): Promise<AmaIcon<any>> => {
    const response = await getFile(path);

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

  const get = async <Ref extends BaseDef<string, unknown, string>>(
    path: Ref["path"],
    mode: Ref["type"] = "file"
  ): Promise<Ref["returnType"]> => {
    if (mode === "file") {
      return getFile(path);
    }

    if (mode === "content") {
      return getContent(path);
    }

    if (mode === "image") {
      return getImage(path);
    }

    if (mode === "icon") {
      return getIcon(path);
    }

    throw new Error(`Unsupported mode: ${mode}`);
  };

  const getStaticUrl = async (path: string, options?: StorageGetOptions) => {
    // In local mode, return file:// URL
    if (clientMode === "local") {
      return getLocalFileUrl(path, clientOptions);
    }

    const previewKey = options?.previewKey || clientOptions.previewKey;

    const query: Record<string, string> = {};
    if (previewKey) {
      query.amaPreviewKey = previewKey;
    }

    // In online mode, just fetch from API
    if (clientMode === "online") {
      const response = await $fetch<{
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

      if (response.data && response.data.success) {
        return response.data.data.staticUrl;
      }

      throw new Error("Failed to get static URL");
    }

    // In with-fallback mode, try API first then fall back to local
    const { data: response, error } = await fetchWithTimeout(() =>
      $fetch<{
        success: boolean;
        data: {
          staticUrl: string;
        };
      }>("/static/:path", {
        params: {
          path: cleanPath(path),
        },
        query,
      })
    );

    if (!error && response?.data?.success) {
      return response.data.data.staticUrl;
    }

    // Fallback to local file:// URL
    if (isLocalStorageAvailable(clientOptions)) {
      return getLocalFileUrl(path, clientOptions);
    }

    throw new Error(error?.message ?? "Failed to get static URL");
  };

  return {
    getFromPath,
    get,
    getStaticUrl,
  };
};
