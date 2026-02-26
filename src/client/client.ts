import { AtMyAppClient, AtMyAppClientOptions } from "./clientTypes";

import { createStorageClient } from "./storage";
import { createAnalyticsClient } from "./analytics";
import { createCollectionsClient } from "./collections";
import { createMetaClient } from "./meta";
export const createAtMyAppClient = (
  options: AtMyAppClientOptions,
): AtMyAppClient => {
  return {
    storage: createStorageClient(options),
    analytics: createAnalyticsClient(options),
    collections: createCollectionsClient(options),
    meta: createMetaClient(options),
  };
};
