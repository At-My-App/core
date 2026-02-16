export type AmaComponentDef<
  Name extends string,
  Props extends Record<string, any> = Record<string, any>,
> = {
  name: Name;
  props: Props;
};

export type AmaMdxConfigDef<
  Name extends string,
  Components extends AmaComponentDef<string, any>[] = AmaComponentDef<
    string,
    any
  >[],
> = {
  name: Name;
  components: Components;
};

export type AmaMdxFieldDef<
  Config extends AmaMdxConfigDef<string, AmaComponentDef<string, any>[]>,
> = {
  __amatype: "AmaMdxDef";
  mdxConfig: Config["name"];
};
