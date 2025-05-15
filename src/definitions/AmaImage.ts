import { Base, BaseRef } from "./Base";

export interface AmaImageConfig {
  /**
   * "webp" or "none"
   */
  optimizeFormat?: "webp" | "none";
  /**
   * progressive or none
   */
  optimizeLoad?: "progressive" | "none";
  ratioHint?: {
    x: number;
    y: number;
  };
  maxSize?: {
    width: number;
    height: number;
  };
}

export interface AmaImageRef<Path extends string, Config extends AmaImageConfig>
  extends BaseRef<Path, AmaImage<any>, "image"> {
  structure: {
    __amatype: "AmaImage";
    __config: Config;
  };
}

export interface AmaImage<Ref extends AmaImageRef<string, AmaImageConfig>>
  extends Base<"AmaImage", Ref["structure"]["__config"]> {
  src: string;
}
