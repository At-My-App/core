export type AmaEventDef<ID extends string, Columns extends string[]> = {
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

export type AmaEvent<ID extends string, Columns extends string[]> = {
  ref: AmaEventDef<ID, Columns>;
  data: Record<Columns[number], string>;
};
