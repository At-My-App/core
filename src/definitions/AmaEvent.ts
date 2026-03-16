export type AmaEventDef<ID extends string> = {
  /**
   * The unique ID of the event
   */
  id: ID;
  /**
   * Human-readable definition description.
   */
  description?: string;
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
