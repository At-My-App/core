export type AmaEventRef<ID extends string, Columns extends string[]> = {
  /**
   * The unique ID of the event
   */
  id: ID;
  /**
   * The columns names of the event
   */
  columns: Columns;
};

export type AmaEvent<ID extends string, Columns extends string[]> = {
  ref: AmaEventRef<ID, Columns>;
  data: Record<Columns[number], string>;
};
