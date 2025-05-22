import { Base, BaseDef } from "./Base";

/**
 * Reference type for AMA file resources
 */
export interface AmaFileDef<
  Path extends string,
  Config extends AmaFileConfig = {},
> extends BaseDef<Path, AmaFile<any>, "file"> {
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

export type AmaFile<Ref extends AmaFileDef<string, AmaFileConfig>> = Base<
  "AmaFile",
  Ref["structure"]["__config"]
> & {
  src: string;
};
