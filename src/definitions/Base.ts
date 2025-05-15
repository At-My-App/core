export interface BaseRef<
  Path extends string,
  ReturnType = unknown,
  Type extends string = string,
> {
  path: Path;
  returnType: ReturnType;
  type: Type;
}

export interface Base<Type extends string, Config extends any> {
  __amatype: Type;
  __config: Config;
  isError: boolean;
  errorMessage?: string;
  errorStatus?: number;
}
