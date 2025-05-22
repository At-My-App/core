import { AtMyAppClient, AtMyAppClientOptions } from "./clientTypes";

import { createCollectionsClient } from "./collections";
import { createAnalyticsClient } from "./analytics";
export const createAtMyAppClient = (
  options: AtMyAppClientOptions
): AtMyAppClient => {
  return {
    collections: createCollectionsClient(options),
    analytics: createAnalyticsClient(options),
  };
};
