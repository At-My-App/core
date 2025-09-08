import { CollectionsFilterExpr, CollectionsListOptions, CollectionsPrimitive } from "../clientTypes";
import { isValidFieldName, serializePrimitive, normalizeSelect, normalizeOrder, MAX_LIMIT } from "./utils";

function compileFilterToParams(filter?: CollectionsFilterExpr): {
  andParams: Record<string, string>;
  orParams: string[]; // values to append for 'or'
} {
  const andParams: Record<string, string> = {};
  const orParams: string[] = [];

  if (!filter) return { andParams, orParams };

  const addAndComparison = (
    field: string,
    op: string,
    value: CollectionsPrimitive | CollectionsPrimitive[]
  ) => {
    if (!isValidFieldName(field)) return; // ignore invalid field names
    const key = `${field}.${op}`;
    if (op === "in") {
      const values = Array.isArray(value) ? value : [value];
      const serialized = values.map(serializePrimitive).join(",");
      andParams[key] = `(${serialized})`;
    } else {
      andParams[key] = serializePrimitive(value as CollectionsPrimitive);
    }
  };

  const toOrToken = (
    field: string,
    op: string,
    value: CollectionsPrimitive | CollectionsPrimitive[]
  ) => {
    if (!isValidFieldName(field)) return undefined as unknown as string;
    if (op === "in") {
      const values = Array.isArray(value) ? value : [value];
      const serialized = values.map(serializePrimitive).join(",");
      return `${field}.in.(${serialized})`;
    }
    return `${field}.${op}.${serializePrimitive(value as CollectionsPrimitive)}`;
  };

  const collect = (expr: CollectionsFilterExpr, withinOr = false) => {
    switch (expr.type) {
      case "comparison":
        if (withinOr) {
          const token = toOrToken(expr.field, expr.op, expr.value);
          orGroup.push(token);
        } else {
          addAndComparison(expr.field, expr.op, expr.value);
        }
        return;
      case "and":
        if (withinOr) {
          // Server OR groups do not support AND inside; reject
          throw new Error("AND inside OR is not supported by the server query syntax");
        }
        for (const c of expr.conditions) collect(c, false);
        return;
      case "or":
        if (withinOr) {
          for (const c of expr.conditions) collect(c, true);
          return;
        }
        // Start a new OR group
        orGroup = [];
        for (const c of expr.conditions) collect(c, true);
        if (orGroup.length > 0) {
          orParams.push(`(${orGroup.join(",")})`);
        }
        orGroup = [];
        return;
      case "not":
        throw new Error("NOT is not supported by the server query syntax");
    }
  };

  let orGroup: string[] = [];
  collect(filter);

  return { andParams, orParams };
}

/**
 * Builds URLSearchParams from collection list options.
 * @param options The options to build the params from.
 * @returns The URLSearchParams.
 */
export function buildParams(options?: CollectionsListOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (!options) return params;

  const select = normalizeSelect(options.select);
  if (select) params.set("select", select);

  const order = normalizeOrder(options.order);
  if (order) params.set("order", order);

  if (options.range && (options.limit != null || options.offset != null)) {
    throw new Error("Provide either range or limit/offset, not both");
  }
  if (options.range) {
    params.set("range", `${options.range[0]},${options.range[1]}`);
  }
  if (typeof options.limit === "number") {
    const clamped = Math.max(0, Math.min(options.limit, MAX_LIMIT));
    params.set("limit", String(clamped));
  }
  if (typeof options.offset === "number") {
    params.set("offset", String(Math.max(0, options.offset)));
  }

  const { andParams, orParams } = compileFilterToParams(options.filter);
  for (const [k, v] of Object.entries(andParams)) {
    params.set(k, v);
  }
  for (const group of orParams) {
    params.append("or", group);
  }

  return params;
}