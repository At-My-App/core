import { Base, BaseDef } from "./Base";

export interface AmaIconDef<Path extends string> extends BaseDef<Path, AmaIcon<any>, "icon"> {
  structure: {
    __amatype: "AmaIconDef";
  };
}

export interface AmaIcon<Ref extends AmaIconDef<string>> extends Base<"AmaIcon", Ref["structure"]> {
  src: string;
}
