import { Base, BaseDef } from "./Base";

export interface AmaIconDef<Path extends string> extends BaseDef<Path, AmaIcon<any>, "icon"> {
  structure: {
    __amatype: "AmaIcon";
  };
}

export interface AmaIcon<Ref extends AmaIconDef<string>> extends Base<"AmaIcon", Ref["structure"]> {
  src: string;
}