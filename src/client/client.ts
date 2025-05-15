import { AmaContentRef } from "../definitions/AmaContent";
import { AmaFileConfig, AmaFileRef } from "../definitions/AmaFile";
import { AmaImageRef } from "../definitions/AmaImage";
import { AmaImageConfig } from "../definitions/AmaImage";
import { AtMyAppClient, AtMyAppClientOptions } from "./clientTypes";

import { createCollectionsClient } from "./collections";

export const createAtMyAppClient = (
  options: AtMyAppClientOptions
): AtMyAppClient => {
  return {
    collections: createCollectionsClient(options),
  };
};

type MyFile = AmaFileRef<"test.json", AmaFileConfig>;
type MyContent = AmaContentRef<
  "test.json",
  {
    name: string;
  }
>;
type MyImage = AmaImageRef<"test.json", AmaImageConfig>;

const client = createAtMyAppClient({
  apiKey: "123",
  baseUrl: "https://api.atmyapp.com",
});
