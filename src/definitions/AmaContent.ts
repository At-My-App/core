import { Base, BaseDef } from "./Base";

export interface AmaContentDef<Path extends string, D>
  extends BaseDef<Path, AmaContent<D, any>, "content"> {
  structure: D;
}

export interface AmaContent<D, Ref extends AmaContentDef<string, D>>
  extends Base<"AmaContent", Ref["structure"]> {
  data: D;
}
