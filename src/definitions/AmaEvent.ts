export type AmaEventDef<ID extends string> = {
  /**
   * The unique ID of the event
   */
  id: ID;
  /**
   * The columns names of the event
   */
  type: "basic_event";
  __is_ATMYAPP_Object: true;
};

export type AmaEvent<ID extends string> = {
  ref: AmaEventDef<ID>;
  data: Record<string, string>;
};
