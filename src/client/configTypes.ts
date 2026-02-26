export type AtMyAppConfigArgs = Record<string, unknown> & {
  usesAtMyAppHeadConfig?: boolean;
};

export type AtMyAppConfig = {
  include?: string[];
  description?: string;
  args?: AtMyAppConfigArgs;
  metadata?: Record<string, unknown>;
};
