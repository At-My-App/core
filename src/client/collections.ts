import {
  AtMyAppClientOptions,
  CollectionsClient,
  CollectionsGetOptions,
} from "./clientTypes";
import { createFetch } from "@better-fetch/fetch";
import { cleanPath } from "./utils/cleanPath";
import { AmaFile, AmaFileDef } from "../definitions/AmaFile";
import { BaseDef } from "../definitions/Base";
import { AmaContent } from "../definitions/AmaContent";
import { AmaImage } from "../definitions/AmaImage";
import { AmaIcon } from "../definitions/AmaIcon";

export const createCollectionsClient = (
  clientOptions: AtMyAppClientOptions
): CollectionsClient => {
  const storageUrl = `${clientOptions.baseUrl}/storage`;

  const $fetch = createFetch({
    baseURL: storageUrl,
    auth: {
      type: "Bearer",
      token: clientOptions.apiKey,
    },
  });

  const getRaw = async (path: string, options?: CollectionsGetOptions) => {
    const previewKey = options?.previewKey || clientOptions.previewKey;

    const response = await $fetch("/f/:path", {
      params: {
        path: cleanPath(path),
      },
      query: {
        amaPreviewKey: previewKey,
      },
    });

    return response;
  };

  const getFromPath = async (path: string, options?: CollectionsGetOptions) => {
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

  const getStaticUrl = async (
    path: string,
    options?: CollectionsGetOptions
  ) => {
    const previewKey = options?.previewKey || clientOptions.previewKey;

    const response = await $fetch<{
      success: boolean;
      data: {
        staticUrl: string;
      };
    }>("/static/:path", {
      params: {
        path: cleanPath(path),
      },
      query: {
        amaPreviewKey: previewKey,
      },
    });

    if (response.data && response.data.success) {
      return response.data.data.staticUrl;
    }

    throw new Error("Failed to get static URL");
  };

  return {
    getFromPath,
    get,
    getStaticUrl,
  };
};
