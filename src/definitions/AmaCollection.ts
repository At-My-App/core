import { Base, BaseDef } from "./Base";

export type CollectionConfig = {
  indexedColumns?: string[];
}


export interface AmaCollectionDef<Path extends string, D, C extends CollectionConfig = CollectionConfig>
  extends BaseDef<Path, AmaCollection<any>, "collection"> {
  structure: {
    __rowType: D;
    __config: C;
  }
}

export interface AmaCollection<Ref extends AmaCollectionDef<string, any, any>>
  extends Base<"AmaCollection", Ref["structure"]> {
  rowType: Ref["structure"]["__rowType"];
  config: Ref["structure"]["__config"];
}
