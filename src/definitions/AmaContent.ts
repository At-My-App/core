import { Base, BaseRef } from "./Base";

export interface AmaContentRef<Path extends string, D>
  extends BaseRef<Path, AmaContent<D, any>, "content"> {
  structure: D;
}

export interface AmaContent<D, Ref extends AmaContentRef<string, D>>
  extends Base<"AmaContent", Ref["structure"]> {
  data: D;
}
