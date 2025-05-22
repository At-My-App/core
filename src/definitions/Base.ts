export interface BaseDef<
  Path extends string,
  ReturnType = unknown,
  Type extends string = string,
> {
  path: Path;
  returnType: ReturnType;
  type: Type;
  __is_ATMYAPP_Object: true;
}

export interface Base<Type extends string, Config extends any> {
  __amatype: Type;
  __config: Config;
  isError: boolean;
  errorMessage?: string;
  errorStatus?: number;
}
