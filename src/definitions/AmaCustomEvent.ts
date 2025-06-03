export type AmaCustomEventDef<ID extends string, Columns extends string[]> = {
  /**
   * The unique ID of the event
   */
  id: ID;
  /**
   * The columns names of the event
   */
  columns: Columns;
  type: "event";
  __is_ATMYAPP_Object: true;
};

export type AmaCustomEvent<ID extends string, Columns extends string[]> = {
  ref: AmaCustomEventDef<ID, Columns>;
  data: Record<Columns[number], string>;
};
