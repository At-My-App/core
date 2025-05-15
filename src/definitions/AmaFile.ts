import { Base, BaseRef } from "./Base";

/**
 * Reference type for AMA file resources
 */
export interface AmaFileRef<
  Path extends string,
  Config extends AmaFileConfig = {},
> extends BaseRef<Path, AmaFile<any>, "file"> {
  /** Configuration for the file */
  structure: {
    __amatype: "AmaFileDef";
    __config: Config;
  };
}

export interface AmaFileConfig {
  /**
   * Content type (MIME type) of the file (e.g. "application/pdf", "image/png")
   */
  contentType?: string;
}

export type AmaFile<Ref extends AmaFileRef<string, AmaFileConfig>> = Base<
  "AmaFile",
  Ref["structure"]["__config"]
> & {
  src: string;
};
