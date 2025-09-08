import { CollectionsListOptions } from "../clientTypes";

export const MAX_LIMIT = 250;
export const ORDERABLE_COLUMNS = new Set(["id", "created", "updated"]);
export const SELECTABLE_COLUMNS = new Set(["id", "data", "created", "updated"]);
export const FIELD_NAME_REGEX = /^[A-Za-z0-9_]+$/;

/**
 * Checks if a field name is valid.
 * @param field The field name to check.
 * @returns True if the field name is valid, false otherwise.
 */
export function isValidFieldName(field: string): boolean {
  return FIELD_NAME_REGEX.test(field);
}

/**
 * Serializes a primitive value to a string.
 * @param value The value to serialize.
 * @returns The serialized value.
 */
export function serializePrimitive(value: any): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Normalizes the select option to a string.
 * @param select The select option to normalize.
 * @returns The normalized select option.
 */
export function normalizeSelect(select?: CollectionsListOptions["select"]): string | undefined {
  if (!select) return undefined;
  if (typeof select === "string") {
    if (!select) return undefined;
    return select;
  }
  const allowed = select.filter((c) => SELECTABLE_COLUMNS.has(c));
  if (allowed.length === 0) return undefined;
  return allowed.join(",");
}

/**
 * Normalizes the order option to a string.
 * @param order The order option to normalize.
 * @returns The normalized order option.
 */
export function normalizeOrder(order?: CollectionsListOptions["order"]): string | undefined {
  if (!order) return undefined;
  const [col, dir] = order.split(".");
  if (!ORDERABLE_COLUMNS.has(col)) return undefined;
  if (!dir) return col;
  if (dir !== "asc" && dir !== "desc") return col; // default asc if omitted
  return `${col}.${dir}`;
}