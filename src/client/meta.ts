import { createFetch } from "@better-fetch/fetch";
import { AtMyAppClientOptions } from "./clientTypes";
import { AtMyAppHeadConfig } from "./metaTypes";

const buildMetaError = (
  siteId: string,
  status: number | string,
  message: string,
): Error => {
  return new Error(
    `AtMyApp: failed to fetch head config for site "${siteId}". ` +
      `Status: ${status}. ` +
      `Message: ${message}`,
  );
};

export interface MetaClient {
  getHeadConfig(siteId: string): Promise<AtMyAppHeadConfig>;
}

export const createMetaClient = (
  clientOptions: AtMyAppClientOptions,
): MetaClient => {
  const $fetch = createFetch({
    baseURL: `${clientOptions.baseUrl}/meta`,
    auth: {
      type: "Bearer",
      token: clientOptions.apiKey,
    },
    fetch: clientOptions.customFetch,
  });

  const getHeadConfig = async (siteId: string): Promise<AtMyAppHeadConfig> => {
    try {
      const response = await $fetch<{
        success: boolean;
        data: AtMyAppHeadConfig;
      }>(`/sites/${siteId}/head`);

      if (response.error || !response.data?.success) {
        throw buildMetaError(
          siteId,
          response.error?.status ?? "unknown",
          response.error?.message ?? "unknown",
        );
      }

      return response.data.data;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith(
          `AtMyApp: failed to fetch head config for site "${siteId}"`,
        )
      ) {
        throw error;
      }

      throw buildMetaError(
        siteId,
        "unknown",
        error instanceof Error ? error.message : "unknown",
      );
    }
  };

  return { getHeadConfig };
};
