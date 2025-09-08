import { CollectionsFilterExpr, CollectionsPrimitive } from "../clientTypes";

/**
 * A DSL for creating collection filters.
 * @example
 * F.and(
 *  F.eq('name', 'John Doe'),
 *  F.gt('age', 30)
 * )
 */
export const F = {
  eq: (field: string, value: CollectionsPrimitive): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "eq",
    value,
  }),
  gt: (field: string, value: CollectionsPrimitive): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "gt",
    value,
  }),
  gte: (field: string, value: CollectionsPrimitive): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "gte",
    value,
  }),
  lt: (field: string, value: CollectionsPrimitive): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "lt",
    value,
  }),
  lte: (field: string, value: CollectionsPrimitive): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "lte",
    value,
  }),
  in: (field: string, values: CollectionsPrimitive[]): CollectionsFilterExpr => ({
    type: "comparison",
    field,
    op: "in",
    value: values,
  }),
  and: (...conditions: CollectionsFilterExpr[]): CollectionsFilterExpr => ({
    type: "and",
    conditions,
  }),
  or: (...conditions: CollectionsFilterExpr[]): CollectionsFilterExpr => ({
    type: "or",
    conditions,
  }),
  not: (condition: CollectionsFilterExpr): CollectionsFilterExpr => ({
    type: "not",
    condition,
  }),
} as const;